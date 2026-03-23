/**
 * POST /api/generate-notes
 * Regenerates or updates notes for a concept.
 * Also supports inline editing (PATCH).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { callAnthropicJSON } from '@/lib/anthropic';
import { NOTES_GENERATION_SYSTEM, notesGenerationUser } from '@/lib/prompts';
import type { GeneratedNotes } from '@/types';

// Regenerate notes via Gemini
export async function POST(req: NextRequest) {
  const { conceptId } = await req.json();
  if (!conceptId) return NextResponse.json({ error: 'conceptId required' }, { status: 400 });

  const supabase = createAdminClient();

  const { data: concept, error } = await supabase
    .from('concepts')
    .select('name, excerpt')
    .eq('id', conceptId)
    .single();

  if (error) return NextResponse.json({ error: 'Concept not found' }, { status: 404 });

  const notes = await callAnthropicJSON<GeneratedNotes>(
    NOTES_GENERATION_SYSTEM,
    notesGenerationUser(concept.name, concept.excerpt ?? ''),
    1024
  );

  await supabase.from('notes').upsert({
    concept_id: conceptId,
    what_it_is: notes.what_it_is,
    how_it_works: notes.how_it_works,
    why_it_matters: notes.why_it_matters,
    misconceptions: notes.common_misconceptions,
    user_edited: false,
  });

  return NextResponse.json(notes);
}

// Save user-edited notes
export async function PATCH(req: NextRequest) {
  const { conceptId, notes } = await req.json();
  if (!conceptId || !notes) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const supabase = createAdminClient();
  await supabase.from('notes').update({
    ...notes,
    user_edited: true,
    updated_at: new Date().toISOString(),
  }).eq('concept_id', conceptId);

  return NextResponse.json({ ok: true });
}
