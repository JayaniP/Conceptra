/**
 * POST /api/generate-narration
 * Generates (or regenerates) a narration script + audio for a concept.
 *
 * Body: { conceptId }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { callAnthropicText } from '@/lib/anthropic';
import { NARRATION_SYSTEM, narrationUser } from '@/lib/prompts';
import { textToSpeech, uploadAudioToSupabase } from '@/lib/elevenlabs';

export async function POST(req: NextRequest) {
  const { conceptId } = await req.json();
  if (!conceptId) return NextResponse.json({ error: 'conceptId required' }, { status: 400 });

  const supabase = createAdminClient();

  // Fetch concept + notes
  const { data: concept, error } = await supabase
    .from('concepts')
    .select('*, notes(*)')
    .eq('id', conceptId)
    .single();

  if (error) return NextResponse.json({ error: 'Concept not found' }, { status: 404 });

  const notes = concept.notes?.[0];
  const notesJson = notes
    ? JSON.stringify({
        what_it_is: notes.what_it_is,
        how_it_works: notes.how_it_works,
        why_it_matters: notes.why_it_matters,
        common_misconceptions: notes.misconceptions,
      })
    : '{}';

  const script = await callAnthropicText(
    NARRATION_SYSTEM,
    narrationUser(concept.name, notesJson),
    512
  );

  // Generate audio if ElevenLabs key is set
  let audioUrl: string | null = null;
  if (process.env.ELEVENLABS_API_KEY) {
    const audioBuffer = await textToSpeech(script);
    audioUrl = await uploadAudioToSupabase(supabase, audioBuffer, conceptId);
  }

  await supabase
    .from('concepts')
    .update({ narration_script: script, audio_url: audioUrl })
    .eq('id', conceptId);

  return NextResponse.json({ script, audioUrl });
}
