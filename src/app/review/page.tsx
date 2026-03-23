'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ReviewCard } from '@/components/ReviewCard';
import type { QuizQuestion } from '@/types';

interface ReviewItem {
  id: string;
  concept_id: string;
  box_level: number;
  streak_days: number;
  concept: {
    id: string;
    name: string;
    one_line: string | null;
    svg_visual: string | null;
    quiz_questions?: QuizQuestion[];
    paper?: { id: string; title: string | null };
  };
}

// ── Placeholder userId — replace with real auth ───────────────
// e.g. const userId = useSession()?.user?.id
const DEMO_USER_ID = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.search).get('userId') ?? ''
  : '';

export default function ReviewPage() {
  const [userId] = useState(DEMO_USER_ID);
  const [due, setDue] = useState<ReviewItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetch(`/api/review/today?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => { setDue(data.due ?? []); setLoading(false); });
  }, [userId]);

  async function handleResult(passed: boolean) {
    const item = due[current];
    if (!item) return;

    await fetch('/api/review/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, concept_id: item.concept_id, passed }),
    });

    setCompleted((c) => c + 1);

    if (current + 1 >= due.length) {
      setDone(true);
    } else {
      setCurrent((i) => i + 1);
    }
  }

  // ── Not logged in ────────────────────────────────────────────
  if (!userId) {
    return (
      <Shell>
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🧠</div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Daily review</h2>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            Sign in to see your concepts due for review today. The Leitner spaced repetition system
            schedules reviews at the optimal moment before you forget.
          </p>
          <Link
            href="/upload"
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Process a paper first →
          </Link>
        </div>
      </Shell>
    );
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <Shell>
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </Shell>
    );
  }

  // ── All done ─────────────────────────────────────────────────
  if (done || due.length === 0) {
    return (
      <Shell>
        <div className="text-center py-20 max-w-sm mx-auto">
          <div className="text-6xl mb-4">{due.length === 0 ? '🌙' : '🎉'}</div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
            {due.length === 0 ? 'All caught up!' : `Session complete — ${completed} reviewed`}
          </h2>
          <p className="text-slate-500 mb-8">
            {due.length === 0
              ? 'No concepts due today. Come back tomorrow.'
              : 'Great work. Your Leitner boxes have been updated.'}
          </p>

          {/* Box summary */}
          {done && (
            <div className="grid grid-cols-5 gap-2 mb-8">
              {[
                { label: 'Box 1', sub: '1 day', color: 'bg-rose-50 border-rose-200 text-rose-700' },
                { label: 'Box 2', sub: '3 days', color: 'bg-amber-50 border-amber-200 text-amber-700' },
                { label: 'Box 3', sub: '7 days', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
                { label: 'Box 4', sub: '14 days', color: 'bg-teal-50 border-teal-200 text-teal-700' },
                { label: '⭐ Mastered', sub: '30 days', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
              ].map((b) => (
                <div key={b.label} className={`border rounded-xl p-2 text-center ${b.color}`}>
                  <div className="text-xs font-bold">{b.label}</div>
                  <div className="text-xs opacity-70">{b.sub}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Back to dashboard
            </Link>
            <Link href="/upload" className="text-sm text-slate-500 hover:text-slate-700">
              Process another paper →
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  // ── Review session ────────────────────────────────────────────
  const item = due[current];

  return (
    <Shell>
      {/* Progress bar */}
      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-8">
        <div
          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${(completed / due.length) * 100}%` }}
        />
      </div>

      <ReviewCard
        item={item}
        index={current}
        total={due.length}
        onResult={handleResult}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-bold text-slate-800">Conceptra</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
          Dashboard
        </Link>
      </nav>
      <div className="max-w-lg mx-auto px-6 py-10">
        {children}
      </div>
    </div>
  );
}
