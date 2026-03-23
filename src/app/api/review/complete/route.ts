/**
 * POST /api/review/complete
 * Body: { user_id, concept_id, passed }
 * Updates box_level and next_review_date using Leitner algorithm.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

const BOX_INTERVALS: Record<number, number> = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };

export async function POST(req: NextRequest) {
  const { user_id, concept_id, passed } = await req.json();
  if (!user_id || !concept_id) {
    return NextResponse.json({ error: 'user_id and concept_id required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // Get current entry
  const { data: current } = await supabase
    .from('concept_confidence')
    .select('box_level, streak_days, confidence_score, review_count')
    .eq('user_id', user_id)
    .eq('concept_id', concept_id)
    .single();

  const currentBox = current?.box_level ?? 1;
  const newBox = passed ? Math.min(currentBox + 1, 5) : 1;
  const daysUntilReview = BOX_INTERVALS[newBox];

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + daysUntilReview);

  // Update confidence score (0–100) proportional to box level
  const newConfidenceScore = Math.min(100, Math.round((newBox / 5) * 100));
  const newStreak = passed ? (current?.streak_days ?? 0) + 1 : 0;

  await supabase
    .from('concept_confidence')
    .upsert({
      user_id,
      concept_id,
      box_level: newBox,
      next_review_date: nextReview.toISOString().split('T')[0],
      last_quiz_date: today,
      streak_days: newStreak,
      confidence_score: newConfidenceScore,
      last_reviewed: new Date().toISOString(),
      next_review_due: nextReview.toISOString(),
      review_count: (current?.review_count ?? 0) + 1,
    }, { onConflict: 'user_id,concept_id' });

  return NextResponse.json({
    new_box: newBox,
    next_review: nextReview.toISOString().split('T')[0],
    days_until_review: daysUntilReview,
    mastered: newBox === 5,
  });
}
