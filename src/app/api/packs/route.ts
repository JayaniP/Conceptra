/**
 * GET  /api/packs          — list public packs (sorted by followers)
 * POST /api/packs          — create a new pack
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { generateSlug } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const userId = req.nextUrl.searchParams.get('userId');
  const limit = Number(req.nextUrl.searchParams.get('limit') ?? '24');

  const { data, error } = await supabase
    .from('packs')
    .select(`
      id, title, description, slug, follower_count, view_count, created_at, user_id,
      pack_concepts ( concept_id )
    `)
    .eq('is_public', true)
    .order('follower_count', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If userId provided, mark which ones the user follows
  let followedSlugs = new Set<string>();
  if (userId) {
    const { data: follows } = await supabase
      .from('pack_follows')
      .select('pack_id')
      .eq('user_id', userId);
    const followedIds = new Set((follows ?? []).map((f) => f.pack_id));
    followedSlugs = new Set(
      (data ?? []).filter((p) => followedIds.has(p.id)).map((p) => p.slug)
    );
  }

  const packs = (data ?? []).map((p) => ({
    ...p,
    concept_count: p.pack_concepts?.length ?? 0,
    is_following: followedSlugs.has(p.slug),
  }));

  return NextResponse.json({ packs });
}

export async function POST(req: NextRequest) {
  const { user_id, title, description, concept_ids, is_public = true } = await req.json();

  if (!title || !concept_ids?.length) {
    return NextResponse.json({ error: 'title and concept_ids required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const slug = generateSlug(10);

  const { data: pack, error } = await supabase
    .from('packs')
    .insert({ user_id: user_id ?? null, title, description: description ?? null, slug, is_public })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insert pack_concepts
  const packConcepts = (concept_ids as string[]).map((cid, i) => ({
    pack_id: pack.id,
    concept_id: cid,
    position: i,
  }));
  await supabase.from('pack_concepts').insert(packConcepts);

  return NextResponse.json({ pack });
}
