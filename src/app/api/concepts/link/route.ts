/**
 * POST /api/concepts/link
 * Internal — called after concept extraction to find similar concepts in user's library.
 * Body: { concept_id, user_id }
 *
 * Uses Jaccard text similarity (MVP).
 * Production: swap for OpenAI text-embedding-3-small + pgvector cosine similarity.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { conceptSimilarity } from '@/lib/text-similarity';

const SIMILARITY_THRESHOLD = 0.35; // Jaccard is stricter than cosine; tune as needed

export async function POST(req: NextRequest) {
  const { concept_id, user_id } = await req.json();
  if (!concept_id || !user_id) {
    return NextResponse.json({ error: 'concept_id and user_id required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 1. Get the new concept
  const { data: newConcept } = await supabase
    .from('concepts')
    .select('id, name, one_line')
    .eq('id', concept_id)
    .single();

  if (!newConcept) return NextResponse.json({ linked: 0 });

  // 2. Get all other concepts in the user's library
  const { data: existing } = await supabase
    .from('concepts')
    .select('id, name, one_line, paper:papers!inner(user_id)')
    .eq('paper.user_id', user_id)
    .neq('id', concept_id);

  if (!existing || existing.length === 0) return NextResponse.json({ linked: 0 });

  // 3. Compute similarity and collect matches above threshold
  const matches = existing
    .map((c) => ({
      id: c.id,
      score: conceptSimilarity(newConcept, { name: c.name, one_line: c.one_line }),
    }))
    .filter((m) => m.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // top 5 matches

  if (matches.length === 0) return NextResponse.json({ linked: 0 });

  // 4. Upsert bidirectional links
  const inserts = matches.flatMap((m) => [
    { user_id, concept_id_a: concept_id, concept_id_b: m.id, similarity_score: m.score },
    { user_id, concept_id_a: m.id, concept_id_b: concept_id, similarity_score: m.score },
  ]);

  await supabase
    .from('concept_links')
    .upsert(inserts, { onConflict: 'user_id,concept_id_a,concept_id_b' });

  return NextResponse.json({ linked: matches.length });
}
