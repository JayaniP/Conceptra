/**
 * GET /api/og/[slug]
 *
 * Generates a beautiful Open Graph image for a shared study pack.
 * Used as og:image on /pack/[slug] pages — appears on Twitter/LinkedIn cards.
 *
 * Uses @vercel/og (ImageResponse) — no canvas dependency, runs at the edge.
 */

import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  // Fetch pack + paper info
  let paperTitle = 'Research Paper';
  let conceptCount = 0;
  let firstConceptName = '';

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('shared_packs')
      .select('paper:papers(title, concepts(name))')
      .eq('slug', slug)
      .single();

    if (data) {
      const paper = data.paper as unknown as { title: string; concepts: { name: string }[] } | null;
      paperTitle = paper?.title ?? 'Research Paper';
      conceptCount = paper?.concepts?.length ?? 0;
      firstConceptName = paper?.concepts?.[0]?.name ?? '';
    }
  } catch {
    // Use defaults if DB unavailable
  }

  // Truncate long titles
  const displayTitle =
    paperTitle.length > 80 ? paperTitle.slice(0, 77) + '…' : paperTitle;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '1200px',
          height: '630px',
          padding: '60px',
          background: 'linear-gradient(135deg, #EEEDFE 0%, #F0F4FF 50%, #E8F4F0 100%)',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {/* Top: Conceptra brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: '22px',
            }}
          >
            C
          </div>
          <span style={{ fontSize: '28px', color: '#4F46E5', fontWeight: 700 }}>
            Conceptra
          </span>
        </div>

        {/* Middle: Paper title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#6366F1',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            Study Pack · {conceptCount} concepts explained visually
          </div>
          <div
            style={{
              fontSize: displayTitle.length > 50 ? '42px' : '52px',
              fontWeight: 700,
              color: '#1F1F2E',
              lineHeight: 1.15,
            }}
          >
            {displayTitle}
          </div>
          {firstConceptName && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '8px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#14B8A6',
                }}
              />
              <span style={{ fontSize: '22px', color: '#5F5E5A' }}>
                Including: {firstConceptName}
              </span>
            </div>
          )}
        </div>

        {/* Bottom: Tagline */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: '20px', color: '#0F6E56', fontWeight: 600 }}>
            conceptra.ai — research papers, finally understood
          </div>
          <div
            style={{
              padding: '10px 24px',
              background: '#4F46E5',
              borderRadius: '12px',
              color: 'white',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            Free to try →
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
