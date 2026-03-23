/**
 * POST /api/generate-clip-scenes
 *
 * Body: { concept_name, how_it_works, why_it_matters }
 * Returns: ClipScript JSON (scenes + narration for Remotion)
 */

import { NextRequest, NextResponse } from 'next/server';
import { callAnthropicJSON } from '@/lib/anthropic';
import type { ClipScript } from '@/types';

const SYSTEM = `You write scripts for short animated explainer videos in the style of Kurzgesagt — simple, flat cartoon animation where each concept step plays out visually. You output a JSON scene list that a Remotion animation engine will render.`;

function userPrompt(conceptName: string, howItWorks: string[], whyItMatters: string) {
  return `Concept: ${conceptName}
How it works: ${howItWorks.map((s, i) => `${i + 1}. ${s}`).join('\n')}
Why it matters: ${whyItMatters}

Generate a clip script with 6-8 scenes. Return ONLY this JSON:
{
  "title": "concept name",
  "total_duration_seconds": 90,
  "narration": "full 200-word narration script read aloud over the entire clip",
  "scenes": [
    {
      "id": "s1",
      "start_second": 0,
      "end_second": 12,
      "narration_segment": "the part of narration spoken during this scene",
      "visual_type": "title_card",
      "layout": "horizontal",
      "heading": "short heading shown on screen",
      "body_text": "1-2 lines of supporting text shown on screen",
      "elements": [
        { "type": "box", "label": "Input Data", "color": "teal", "animates_in_at": 0.5 },
        { "type": "arrow", "color": "gray", "animates_in_at": 1.0 },
        { "type": "box", "label": "Process", "color": "purple", "animates_in_at": 1.4 },
        { "type": "arrow", "color": "gray", "animates_in_at": 1.9 },
        { "type": "box", "label": "Output", "color": "amber", "animates_in_at": 2.3 }
      ],
      "background_color": "#0F0F1A"
    }
  ]
}

CRITICAL RULES — follow exactly:
1. Every scene MUST have 3-5 elements. Never fewer than 3. A scene with 1-2 elements looks empty and broken.
2. background_color MUST always be "#0F0F1A" (dark) for every scene.
3. Add "layout": "vertical" for top-to-bottom process flows. Add "layout": "horizontal" for comparisons and side-by-side layouts.

Element patterns to use:

For process flow scenes (layout: "vertical"):
  { type: "box", label: "Step 1", color: "purple", animates_in_at: 0.3 },
  { type: "arrow", color: "gray", animates_in_at: 0.8 },
  { type: "box", label: "Step 2", color: "teal", animates_in_at: 1.1 },
  { type: "arrow", color: "gray", animates_in_at: 1.6 },
  { type: "box", label: "Step 3", color: "amber", animates_in_at: 1.9 }

For comparison scenes (layout: "horizontal"):
  { type: "box", label: "Option A", color: "coral", animates_in_at: 0.3 },
  { type: "text_pop", label: "VS", color: "amber", animates_in_at: 0.8 },
  { type: "box", label: "Option B", color: "teal", animates_in_at: 1.3 }
  (add 2 more highlight elements below)

For metric/result scenes, use type "metric" with a "value" field (the big number) and "label" field:
  { type: "metric", value: "10x", label: "Faster", color: "teal", animates_in_at: 0.3 }

visual_type options: title_card | flow_diagram | comparison | highlight_box | metric_reveal
element type options: box (rounded rect), arrow (connecting arrow), circle, text_pop (large bold text), highlight (left-border strip), metric (big number + label)
Colors: teal, purple, amber, coral, gray
animates_in_at = seconds from scene start when this element appears

Make scenes visually varied — use different visual_types, layouts, and colour combinations. Return ONLY the JSON.`;
}

export async function POST(req: NextRequest) {
  try {
    const { concept_name, how_it_works, why_it_matters } = await req.json();

    if (!concept_name) {
      return NextResponse.json({ error: 'concept_name is required' }, { status: 400 });
    }

    const clipScript = await callAnthropicJSON<ClipScript>(
      SYSTEM,
      userPrompt(concept_name, how_it_works ?? [], why_it_matters ?? ''),
      3000
    );

    return NextResponse.json(clipScript);
  } catch (err) {
    console.error('/api/generate-clip-scenes error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Scene generation failed' },
      { status: 500 }
    );
  }
}
