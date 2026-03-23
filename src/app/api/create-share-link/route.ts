/**
 * POST /api/create-share-link
 *
 * Creates a shareable study pack link with a human-readable slug.
 * Format: paper-title-slug-nanoid6  e.g. "hindsight-x7k2p1"
 *
 * Request body: { paper_id }
 * Returns: { url: string, slug: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { nanoid } from 'nanoid';

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // strip non-alphanumeric
    .trim()
    .replace(/\s+/g, '-')           // spaces → hyphens
    .replace(/-+/g, '-')            // collapse multiple hyphens
    .slice(0, 30);                  // max 30 chars for readability
}

export async function POST(req: NextRequest) {
  const { paper_id } = await req.json();
  if (!paper_id) {
    return NextResponse.json({ error: 'paper_id is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Return existing pack if one already exists
  const { data: existing } = await supabase
    .from('shared_packs')
    .select('slug')
    .eq('paper_id', paper_id)
    .single();

  if (existing?.slug) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://conceptra.ai';
    return NextResponse.json({ slug: existing.slug, url: `${baseUrl}/pack/${existing.slug}` });
  }

  // Fetch paper title to build the slug
  const { data: paper } = await supabase
    .from('papers')
    .select('title')
    .eq('id', paper_id)
    .single();

  const titlePart = paper?.title ? toSlug(paper.title) : 'paper';
  const slug = `${titlePart}-${nanoid(6)}`;

  const { data, error } = await supabase
    .from('shared_packs')
    .insert({ paper_id, slug, view_count: 0 })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://conceptra.ai';
  return NextResponse.json({ slug: data.slug, url: `${baseUrl}/pack/${data.slug}` });
}
