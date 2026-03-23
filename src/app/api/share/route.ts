/**
 * GET  /api/share?slug=xxx   → fetch shared pack by slug
 * POST /api/share            → create a shared pack for a paper
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { generateSlug } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('shared_packs')
    .select(`*, paper:papers(*, concepts(*, notes(*), quiz_questions(*)))`)
    .eq('slug', slug)
    .single();

  if (error) return NextResponse.json({ error: 'Pack not found' }, { status: 404 });

  // Increment view count
  await supabase.from('shared_packs').update({ view_count: data.view_count + 1 }).eq('id', data.id);

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { paperId } = await req.json();
  if (!paperId) return NextResponse.json({ error: 'paperId required' }, { status: 400 });

  const supabase = createAdminClient();

  // Check if a pack already exists
  const { data: existing } = await supabase
    .from('shared_packs')
    .select('slug')
    .eq('paper_id', paperId)
    .single();

  if (existing) return NextResponse.json({ slug: existing.slug });

  const slug = generateSlug(8);
  const { data, error } = await supabase
    .from('shared_packs')
    .insert({ paper_id: paperId, slug })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ slug: data.slug });
}
