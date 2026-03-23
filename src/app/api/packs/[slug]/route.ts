/**
 * GET /api/packs/[slug]  — fetch a single pack with all concepts
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = createAdminClient();
  const userId = req.nextUrl.searchParams.get('userId');

  const { data, error } = await supabase
    .from('packs')
    .select(`
      *,
      pack_concepts (
        id, position,
        concept:concepts (
          id, name, one_line, svg_visual, excerpt, importance_rank,
          notes (*),
          quiz_questions (*),
          paper:papers ( id, title )
        )
      )
    `)
    .eq('slug', params.slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
  }

  // Increment view count
  await supabase
    .from('packs')
    .update({ view_count: data.view_count + 1 })
    .eq('id', data.id);

  // Check if user follows this pack
  let isFollowing = false;
  if (userId) {
    const { data: follow } = await supabase
      .from('pack_follows')
      .select('id')
      .eq('user_id', userId)
      .eq('pack_id', data.id)
      .single();
    isFollowing = !!follow;
  }

  return NextResponse.json({ pack: { ...data, is_following: isFollowing } });
}
