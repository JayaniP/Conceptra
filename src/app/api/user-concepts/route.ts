/**
 * GET /api/user-concepts?userId=xxx
 * Returns all concepts from papers owned by this user (for pack creation).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ concepts: [] });

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('concepts')
    .select('id, name, one_line, paper_id, paper:papers!inner(id, title, user_id)')
    .eq('paper.user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const concepts = (data ?? []).map((c) => {
    const paper = Array.isArray(c.paper) ? c.paper[0] : c.paper;
    return {
      id: c.id,
      name: c.name,
      one_line: c.one_line,
      paper_id: c.paper_id,
      paper_title: paper?.title ?? null,
    };
  });

  return NextResponse.json({ concepts });
}
