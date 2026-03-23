/**
 * POST /api/evaluate-answer
 *
 * Evaluates a short-answer quiz response using Gemini.
 * Also updates the user's concept_confidence score.
 *
 * Body JSON:
 *   { question, rubric, userAnswer, userId, conceptId, questionId }
 */

import { NextRequest, NextResponse } from 'next/server';
import { callAnthropicJSON } from '@/lib/anthropic';
import { EVALUATION_SYSTEM, evaluationUser } from '@/lib/prompts';
import { createAdminClient } from '@/lib/supabase';
import { nextReviewDate } from '@/lib/utils';
import type { EvaluationResult } from '@/types';

export async function POST(req: NextRequest) {
  const { question, rubric, userAnswer, userId, conceptId, questionId } =
    await req.json();

  if (!question || !rubric || !userAnswer) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const result = await callAnthropicJSON<EvaluationResult>(
    EVALUATION_SYSTEM,
    evaluationUser(question, rubric, userAnswer),
    512
  );

  // Persist attempt + update confidence
  if (userId && conceptId && questionId) {
    const supabase = createAdminClient();

    await supabase.from('quiz_attempts').insert({
      user_id: userId,
      concept_id: conceptId,
      question_id: questionId,
      user_answer: userAnswer,
      score: result.score,
      feedback: result.feedback,
    });

    // Update confidence score (weighted moving average, +20 per point, -10 for 0)
    const delta = result.score >= 2 ? result.score * 20 : -10;

    const { data: existing } = await supabase
      .from('concept_confidence')
      .select('*')
      .eq('user_id', userId)
      .eq('concept_id', conceptId)
      .single();

    if (existing) {
      const newScore = Math.max(0, Math.min(100, existing.confidence_score + delta));
      const reviewCount = existing.review_count + 1;
      await supabase
        .from('concept_confidence')
        .update({
          confidence_score: newScore,
          last_reviewed: new Date().toISOString(),
          next_review_due: nextReviewDate(result.score, reviewCount).toISOString(),
          review_count: reviewCount,
        })
        .eq('id', existing.id);
    } else {
      const initialScore = Math.max(0, result.score * 20);
      await supabase.from('concept_confidence').insert({
        user_id: userId,
        concept_id: conceptId,
        confidence_score: initialScore,
        next_review_due: nextReviewDate(result.score, 0).toISOString(),
        review_count: 1,
      });
    }
  }

  return NextResponse.json(result);
}
