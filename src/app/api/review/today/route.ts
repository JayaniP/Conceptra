/**
 * GET /api/review/today?userId=xxx
 * Returns all concept_confidence entries due for review today.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ due: [], count: 0 });
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('concept_confidence')
    .select(`
      id, user_id, concept_id, box_level, next_review_date, streak_days,
      concept:concepts (
        id, name, one_line, svg_visual,
        quiz_questions (*),
        paper:papers ( id, title )
      )
    `)
    .eq('user_id', userId)
    .lte('next_review_date', today)
    .order('next_review_date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ due: data ?? [], count: (data ?? []).length });
}
