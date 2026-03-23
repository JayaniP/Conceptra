/**
 * POST /api/generate-visual
 * Regenerates the XAI SVG visual for a concept.
 *
 * Body: { conceptId }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { callAnthropicText } from '@/lib/anthropic';
import { XAI_VISUAL_SYSTEM, xaiVisualUser } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  const { conceptId } = await req.json();
  if (!conceptId) return NextResponse.json({ error: 'conceptId required' }, { status: 400 });

  const supabase = createAdminClient();

  const { data: concept, error } = await supabase
    .from('concepts')
    .select('name, excerpt')
    .eq('id', conceptId)
    .single();

  if (error) return NextResponse.json({ error: 'Concept not found' }, { status: 404 });

  const svgRaw = await callAnthropicText(
    XAI_VISUAL_SYSTEM,
    xaiVisualUser(concept.name, concept.excerpt ?? ''),
    2048
  );
  const svgVisual = svgRaw.startsWith('<svg') ? svgRaw : svgRaw.slice(svgRaw.indexOf('<svg'));

  await supabase.from('concepts').update({ svg_visual: svgVisual }).eq('id', conceptId);

  return NextResponse.json({ svg: svgVisual });
}
