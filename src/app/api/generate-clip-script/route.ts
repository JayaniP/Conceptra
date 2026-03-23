/**
 * POST /api/generate-clip-script
 *
 * Generates a 60-second narration script for a concept's animated clip.
 * Uses the exact system prompt specified in the Final Launch Prompt doc.
 *
 * Request body: { concept_name, concept_notes, concept_excerpt, concept_id? }
 * Returns: { script: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { callAnthropicText } from '@/lib/anthropic';
import { createAdminClient } from '@/lib/supabase';

const CLIP_SCRIPT_SYSTEM = `You write narration scripts for 60-second educational clips. Warm, conversational tone — like a brilliant friend explaining something, not a lecturer. Exactly 130-150 words. Start with a hook. Explain the mechanism in 3-4 sentences. End with why it matters. No jargon without immediate plain-English follow-up. Output ONLY the script text, nothing else.`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { concept_name, concept_notes, concept_excerpt, concept_id } = body;

  if (!concept_name) {
    return NextResponse.json({ error: 'concept_name is required' }, { status: 400 });
  }

  const notes = concept_notes ?? {};
  const howItWorksStr = Array.isArray(notes.how_it_works)
    ? notes.how_it_works.join(', ')
    : (notes.how_it_works ?? '');

  const userPrompt = `Concept: ${concept_name}

What it is: ${notes.what_it_is ?? concept_excerpt ?? ''}

How it works: ${howItWorksStr}

Why it matters: ${notes.why_it_matters ?? ''}`;

  const script = await callAnthropicText(CLIP_SCRIPT_SYSTEM, userPrompt, 512);

  // Persist script back to the concept row if concept_id provided
  if (concept_id) {
    const supabase = createAdminClient();
    await supabase
      .from('concepts')
      .update({ narration_script: script })
      .eq('id', concept_id);
  }

  return NextResponse.json({ script });
}
