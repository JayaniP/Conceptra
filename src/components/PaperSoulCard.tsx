'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export interface PaperSoul {
  knowledge_gap: string;
  novel_approach: string;
  central_claim: string;
  hero_data_point: string;
  main_limitation: string;
  real_world_impact: string;
}

const ANCHORS = [
  {
    key: 'knowledge_gap',
    label: 'Why it exists',
    sublabel: 'The problem the world could not solve before',
    color: '#EEEDFE',
    border: '#5B4FE8',
    text: '#3C3489',
    dot: '#5B4FE8',
  },
  {
    key: 'novel_approach',
    label: 'The secret sauce',
    sublabel: 'What makes this approach different',
    color: '#E1F5EE',
    border: '#0F6E56',
    text: '#085041',
    dot: '#0F6E56',
  },
  {
    key: 'central_claim',
    label: 'The key finding',
    sublabel: 'The single most important result',
    color: '#FAEEDA',
    border: '#854F0B',
    text: '#633806',
    dot: '#854F0B',
  },
  {
    key: 'hero_data_point',
    label: 'The proof',
    sublabel: 'The number that proves it works',
    color: '#EAF3DE',
    border: '#3B6D11',
    text: '#27500A',
    dot: '#3B6D11',
  },
  {
    key: 'main_limitation',
    label: 'The catch',
    sublabel: 'When this might not apply',
    color: '#FAECE7',
    border: '#993C1D',
    text: '#712B13',
    dot: '#993C1D',
  },
  {
    key: 'real_world_impact',
    label: 'So what?',
    sublabel: 'How this changes things for people',
    color: '#E6F1FB',
    border: '#185FA5',
    text: '#0C447C',
    dot: '#185FA5',
  },
] as const;

function SkeletonCard() {
  return (
    <div className="border border-slate-200 rounded-2xl p-6 mb-8 bg-slate-50">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
        <span className="text-xs font-bold text-indigo-600 tracking-widest">PAPER AT A GLANCE</span>
        <span className="text-xs text-slate-400 ml-1">Extracting…</span>
      </div>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="h-14 bg-slate-100 rounded-lg mb-2 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

const POLL_MAX = 15; // 45 seconds total
const FRESH_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export function PaperSoulCard({
  initialSoul,
  paperId,
  paperCreatedAt,
}: {
  initialSoul: PaperSoul | null;
  paperId: string;
  paperCreatedAt: string;
}) {
  // Only show skeleton for papers processed in the last 10 minutes
  const isPaperFresh = Date.now() - new Date(paperCreatedAt).getTime() < FRESH_WINDOW_MS;

  const [soul, setSoul] = useState<PaperSoul | null>(initialSoul);
  const [loading, setLoading] = useState(!initialSoul && isPaperFresh);

  useEffect(() => {
    if (initialSoul || !isPaperFresh) return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      const { data } = await supabase
        .from('papers')
        .select('soul')
        .eq('id', paperId)
        .single();

      if (data?.soul) {
        setSoul(data.soul as PaperSoul);
        setLoading(false);
        clearInterval(interval);
      } else if (attempts >= POLL_MAX) {
        setLoading(false);
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [paperId, initialSoul, isPaperFresh]);

  if (loading) return <SkeletonCard />;
  if (!soul) return null;

  return (
    <div className="border border-indigo-200 rounded-2xl p-6 mb-8 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
        <span className="text-xs font-bold text-indigo-600 tracking-widest">PAPER AT A GLANCE</span>
        <span className="text-xs text-slate-400 ml-1">6 things experts look for</span>
      </div>

      {/* 6 anchor rows */}
      <div className="flex flex-col gap-2">
        {ANCHORS.map((anchor) => (
          <div
            key={anchor.key}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              background: anchor.color,
              border: `1px solid ${anchor.border}22`,
              borderLeft: `3px solid ${anchor.border}`,
              borderRadius: '0 8px 8px 0',
              padding: '10px 14px',
            }}
          >
            {/* Label column */}
            <div style={{ minWidth: 120, flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: anchor.dot, letterSpacing: '0.04em' }}>
                {anchor.label.toUpperCase()}
              </div>
              <div style={{ fontSize: 11, color: anchor.text, opacity: 0.7, marginTop: 1 }}>
                {anchor.sublabel}
              </div>
            </div>
            {/* Value */}
            <div style={{ fontSize: 13, color: anchor.text, lineHeight: 1.55, flex: 1 }}>
              {soul[anchor.key as keyof PaperSoul]}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 text-right text-xs text-slate-400">
        Extracted by Conceptra · conceptra.ai
      </div>
    </div>
  );
}
