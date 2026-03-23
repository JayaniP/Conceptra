/**
 * POST /api/process-paper
 *
 * Main orchestration endpoint. Accepts a PDF file, arxiv URL, or DOI.
 * Kicks off the full processing pipeline and streams progress via SSE.
 *
 * Body (multipart/form-data):
 *   - file?:    PDF file
 *   - arxivUrl?: string
 *   - doi?:     string
 *   - goal?:    string
 *   - userId?:  string
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { parsePdf, fetchArxivPdf, fetchDoiPdf } from '@/lib/pdf-parser';
import { generateSlug } from '@/lib/utils';
import { callAnthropicJSON, callAnthropicText } from '@/lib/anthropic';
import {
  CONCEPT_EXTRACTION_SYSTEM,
  conceptExtractionUser,
  XAI_VISUAL_SYSTEM,
  xaiVisualUser,
  NOTES_GENERATION_SYSTEM,
  notesGenerationUser,
  QUIZ_GENERATION_SYSTEM,
  quizGenerationUser,
  NARRATION_SYSTEM,
  narrationUser,
} from '@/lib/prompts';
import { textToSpeech, uploadAudioToSupabase } from '@/lib/elevenlabs';
import type { ExtractedConcept, GeneratedNotes, GeneratedQuiz } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const supabase = createAdminClient();

  // ── Helper: send SSE event ───────────────────────────────────
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  function send(event: string, data: unknown) {
    writer.write(
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    );
  }

  // Start the response stream immediately
  const response = new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });

  // Run the pipeline asynchronously (don't await — return the stream)
  (async () => {
    try {
      // ── 1. Parse input ─────────────────────────────────────────
      send('step', { id: 'parse', label: 'Parsing paper…', status: 'active' });

      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const arxivUrl = formData.get('arxivUrl') as string | null;
      const doi = formData.get('doi') as string | null;
      const goal = (formData.get('goal') as string) ?? '';
      const userId = formData.get('userId') as string | null;

      let pdfBuffer: Buffer;
      let arxivId = '';

      if (file) {
        pdfBuffer = Buffer.from(await file.arrayBuffer());
      } else if (arxivUrl) {
        const result = await fetchArxivPdf(arxivUrl);
        pdfBuffer = result.buffer;
        arxivId = result.arxivId;
      } else if (doi) {
        const result = await fetchDoiPdf(doi);
        pdfBuffer = result.buffer;
      } else {
        throw new Error('No input provided. Please upload a PDF, arxiv URL, or DOI.');
      }

      const parsed = await parsePdf(pdfBuffer);
      send('step', { id: 'parse', label: 'Paper parsed', status: 'done' });

      // ── 2. Save paper to DB ────────────────────────────────────
      const { data: paper, error: paperError } = await supabase
        .from('papers')
        .insert({
          user_id: userId ?? null,
          title: parsed.title,
          authors: parsed.authors,
          abstract: parsed.abstract,
          arxiv_id: arxivId || null,
          doi: doi || null,
          goal,
          status: 'processing',
          page_count: parsed.pageCount,
        })
        .select()
        .single();

      if (paperError) throw paperError;
      const paperId = paper.id;

      send('paper_id', { paperId });

      // ── 3. Extract concepts ────────────────────────────────────
      send('step', { id: 'concepts', label: 'Extracting concepts…', status: 'active' });

      const conceptData = await callAnthropicJSON<{ concepts: ExtractedConcept[] }>(
        CONCEPT_EXTRACTION_SYSTEM,
        conceptExtractionUser(parsed.title, parsed.abstract, parsed.fullText, goal),
        4096
      );

      send('step', { id: 'concepts', label: `Found ${conceptData.concepts.length} concepts`, status: 'done' });

      // ── 4. Generate visuals + notes + quiz + narration per concept ──
      send('step', { id: 'visuals', label: 'Generating XAI visuals…', status: 'active' });

      await Promise.all(conceptData.concepts.map(async (concept) => {
        // 4a–4d: run AI calls in parallel per concept
        const [svgRaw, notes] = await Promise.all([
          callAnthropicText(
            XAI_VISUAL_SYSTEM,
            xaiVisualUser(concept.name, concept.excerpt),
            2048
          ),
          callAnthropicJSON<GeneratedNotes>(
            NOTES_GENERATION_SYSTEM,
            notesGenerationUser(concept.name, concept.excerpt),
            2048
          ),
        ]);

        const svgVisual = svgRaw.startsWith('<svg') ? svgRaw : svgRaw.slice(svgRaw.indexOf('<svg'));
        const notesStr = JSON.stringify(notes);

        const [quiz, narrationScript] = await Promise.all([
          callAnthropicJSON<GeneratedQuiz>(
            QUIZ_GENERATION_SYSTEM,
            quizGenerationUser(concept.name, notesStr),
            2048
          ),
          callAnthropicText(
            NARRATION_SYSTEM,
            narrationUser(concept.name, notesStr),
            512
          ),
        ]);

        // Insert concept
        const { data: conceptRow, error: conceptError } = await supabase
          .from('concepts')
          .insert({
            paper_id: paperId,
            name: concept.name,
            one_line: concept.one_line,
            excerpt: concept.excerpt,
            importance_rank: concept.importance_rank,
            svg_visual: svgVisual,
            narration_script: narrationScript,
          })
          .select()
          .single();

        if (conceptError) throw conceptError;

        // Insert notes + quiz questions in parallel
        await Promise.all([
          supabase.from('notes').insert({
            concept_id: conceptRow.id,
            what_it_is: notes.what_it_is,
            how_it_works: notes.how_it_works,
            why_it_matters: notes.why_it_matters,
            misconceptions: notes.common_misconceptions,
          }),
          supabase.from('quiz_questions').insert(
            quiz.questions.map((q, i) => ({
              concept_id: conceptRow.id,
              type: q.type,
              question: q.question,
              options: q.options ?? null,
              correct: q.correct ?? null,
              explanation: q.explanation ?? null,
              rubric: q.rubric ?? null,
              sort_order: i,
            }))
          ),
        ]);

        // Generate audio (optional — skip if no API key)
        if (process.env.ELEVENLABS_API_KEY) {
          try {
            const audioBuffer = await textToSpeech(narrationScript);
            const audioUrl = await uploadAudioToSupabase(supabase, audioBuffer, conceptRow.id);
            await supabase.from('concepts').update({ audio_url: audioUrl }).eq('id', conceptRow.id);
          } catch {
            // Non-fatal: clip will show SVG + script without audio
          }
        }

        send('concept_done', { conceptId: conceptRow.id, name: concept.name });

        // Link to similar concepts in user's library (fire-and-forget, non-fatal)
        if (userId) {
          fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/concepts/link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ concept_id: conceptRow.id, user_id: userId }),
          }).catch(() => {/* non-fatal */});
        }
      }));

      send('step', { id: 'visuals', label: 'Visuals ready', status: 'done' });

      // ── 5. Extract paper soul (fire-and-forget) ────────────────
      fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/extract-paper-soul`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper_text: parsed.fullText, paper_id: paperId }),
      }).catch(() => {/* non-fatal */});

      send('step', { id: 'done', label: 'Building clips & quiz…', status: 'active' });

      // ── 5. Create shared pack ───────────────────────────────────
      const slug = generateSlug(8);
      await supabase.from('shared_packs').insert({ paper_id: paperId, slug });

      // ── 6. Mark paper done ─────────────────────────────────────
      await supabase
        .from('papers')
        .update({ status: 'done', processed_at: new Date().toISOString() })
        .eq('id', paperId);

      send('step', { id: 'done', label: 'All done!', status: 'done' });
      send('complete', { paperId, slug });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      send('error', { message });
    } finally {
      writer.close();
    }
  })();

  return response;
}
