/**
 * POST   /api/packs/[slug]/follow  — follow a pack (imports concepts into review queue)
 * DELETE /api/packs/[slug]/follow  — unfollow
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { user_id } = await req.json();
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // Get pack with concept IDs
  const { data: pack, error } = await supabase
    .from('packs')
    .select('id, pack_concepts(concept_id)')
    .eq('slug', params.slug)
    .single();

  if (error || !pack) {
    return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
  }

  // Record follow
  const { error: followError } = await supabase
    .from('pack_follows')
    .upsert({ user_id, pack_id: pack.id }, { onConflict: 'user_id,pack_id' });

  if (followError) {
    return NextResponse.json({ error: followError.message }, { status: 500 });
  }

  // Add all concepts to review queue at box 1
  const conceptIds = (pack.pack_concepts ?? []).map((pc: { concept_id: string }) => pc.concept_id);
  const inserts = conceptIds.map((concept_id: string) => ({
    user_id,
    concept_id,
    box_level: 1,
    next_review_date: today,
    confidence_score: 20,
    last_reviewed: new Date().toISOString(),
    next_review_due: new Date().toISOString(),
    review_count: 0,
    streak_days: 0,
  }));

  if (inserts.length > 0) {
    await supabase
      .from('concept_confidence')
      .upsert(inserts, { onConflict: 'user_id,concept_id', ignoreDuplicates: true });
  }

  // Increment follower count
  await supabase.rpc('increment_pack_followers', { pack_id: pack.id });

  return NextResponse.json({ success: true, concepts_added: conceptIds.length });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { user_id } = await req.json();
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const supabase = createAdminClient();

  const { data: pack } = await supabase
    .from('packs')
    .select('id')
    .eq('slug', params.slug)
    .single();

  if (!pack) return NextResponse.json({ error: 'Pack not found' }, { status: 404 });

  await supabase
    .from('pack_follows')
    .delete()
    .eq('user_id', user_id)
    .eq('pack_id', pack.id);

  await supabase.rpc('decrement_pack_followers', { pack_id: pack.id });

  return NextResponse.json({ success: true });
}
