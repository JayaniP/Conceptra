/**
 * POST /api/extract-paper-soul
 *
 * Extracts six critical expert-level facts from a research paper and saves
 * them to papers.soul (jsonb).
 *
 * Body (JSON): { paper_text: string, paper_id: string }
 * Response:    { soul: PaperSoul }
 */

import { NextResponse } from 'next/server';
import { callAnthropicJSON } from '@/lib/anthropic';
import type { PaperSoul } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  const { paper_text, paper_id } = await req.json();

  if (!paper_text || !paper_id) {
    return NextResponse.json({ error: 'paper_text and paper_id are required' }, { status: 400 });
  }

  const soul = await callAnthropicJSON<PaperSoul>(
    'You extract six critical facts from a research paper. Read the specific sections indicated for each field. Be precise and concrete. Every answer must be one sentence maximum.',
    `Paper text:
${paper_text.slice(0, 12000)}

Extract these six facts. Return ONLY valid JSON, nothing else:
{
  "knowledge_gap": "The specific problem the world could not solve before this paper — from last 2-3 sentences of the Introduction",
  "novel_approach": "The unique method or trick different from all prior work — from end of Introduction or start of Methods",
  "central_claim": "The single most important finding in one sentence — from Abstract or first paragraph of Discussion",
  "hero_data_point": "The one number or percentage that proves it worked — must contain a specific number e.g. '83.6% accuracy vs 39% baseline' — from Results or Abstract",
  "main_limitation": "The condition under which findings might not hold — from Limitations subsection of Discussion",
  "real_world_impact": "How this changes things for people or the field — from last paragraph of Conclusion"
}

Rules:
- Every value must be exactly one sentence
- hero_data_point MUST contain at least one specific number
- If you cannot find a field in the specified location search the full text
- Never return null for any field — always find the best available answer
- Return ONLY the JSON object, no markdown, no explanation`,
    1000
  );

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase
    .from('papers')
    .update({ soul })
    .eq('id', paper_id);

  return NextResponse.json({ soul });
}
