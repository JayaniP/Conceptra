/**
 * POST /api/generate-quiz
 * Generates quiz questions for a concept.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { callAnthropicJSON } from '@/lib/anthropic';
import { QUIZ_GENERATION_SYSTEM, quizGenerationUser } from '@/lib/prompts';
import type { GeneratedQuiz } from '@/types';

export async function POST(req: NextRequest) {
  const { conceptId } = await req.json();
  if (!conceptId) return NextResponse.json({ error: 'conceptId required' }, { status: 400 });

  const supabase = createAdminClient();

  const { data: concept, error } = await supabase
    .from('concepts')
    .select('name, notes(*)')
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

  const quiz = await callAnthropicJSON<GeneratedQuiz>(
    QUIZ_GENERATION_SYSTEM,
    quizGenerationUser(concept.name, notesJson),
    1024
  );

  // Delete existing questions and insert fresh ones
  await supabase.from('quiz_questions').delete().eq('concept_id', conceptId);

  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    await supabase.from('quiz_questions').insert({
      concept_id: conceptId,
      type: q.type,
      question: q.question,
      options: q.options ?? null,
      correct: q.correct ?? null,
      explanation: q.explanation ?? null,
      rubric: q.rubric ?? null,
      sort_order: i,
    });
  }

  return NextResponse.json(quiz);
}
