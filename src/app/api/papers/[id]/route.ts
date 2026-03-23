/**
 * GET /api/papers/[id]
 * Returns a paper with all concepts, notes, quiz questions and confidence scores.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient();
  const { id } = params;

  const { data: paper, error } = await supabase
    .from('papers')
    .select(`
      *,
      concepts (
        *,
        notes (*),
        quiz_questions (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(paper);
}
