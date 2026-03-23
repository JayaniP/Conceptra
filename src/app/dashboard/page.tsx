import Link from 'next/link';
import { Upload, TrendingUp, Flame, BookOpen, Brain, RefreshCw, Package } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase';
import { formatDate, confidenceColor, confidenceLabel } from '@/lib/utils';

// In production, userId would come from the auth session cookie.
// This page shows a demo dashboard when no user is logged in.
export default async function DashboardPage() {
  // Placeholder — replace with real auth session lookup
  const userId: string | null = null;

  let papers: Array<Record<string, unknown>> = [];
  let dueToday: Array<Record<string, unknown>> = [];
  let stats = { totalConcepts: 0, avgConfidence: 0, streak: 0 };

  if (userId) {
    const supabase = createAdminClient();

    const { data: papersData } = await supabase
      .from('papers')
      .select('id, title, status, created_at, concepts(id, name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    papers = (papersData ?? []) as Array<Record<string, unknown>>;

    const { data: dueData } = await supabase
      .from('concept_confidence')
      .select('*, concept:concepts(name, paper:papers(title))')
      .eq('user_id', userId)
      .lte('next_review_date', new Date().toISOString().split('T')[0])
      .order('confidence_score', { ascending: true })
      .limit(10);
    dueToday = (dueData ?? []) as Array<Record<string, unknown>>;

    const { data: confData } = await supabase
      .from('concept_confidence')
      .select('confidence_score')
      .eq('user_id', userId);

    if (confData && confData.length > 0) {
      const avg = confData.reduce((s: number, r: { confidence_score: number }) => s + r.confidence_score, 0) / confData.length;
      stats = {
        totalConcepts: confData.length,
        avgConfidence: Math.round(avg),
        streak: 0, // would come from users table
      };
    }
  }

  const isLoggedIn = !!userId;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-100 px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-bold text-slate-800">Conceptra</span>
        </Link>
        <div className="flex items-center gap-2">
          {/* Review badge */}
          <Link
            href={userId ? `/review?userId=${userId}` : '/review'}
            className="relative flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-indigo-700 text-sm font-medium rounded-xl hover:bg-indigo-50 transition-colors"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Review</span>
            {dueToday.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                {dueToday.length > 9 ? '9+' : dueToday.length}
              </span>
            )}
          </Link>
          {/* Packs */}
          <Link
            href="/packs"
            className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-indigo-700 text-sm font-medium rounded-xl hover:bg-indigo-50 transition-colors"
          >
            <Package size={14} />
            <span className="hidden sm:inline">Packs</span>
          </Link>
          <Link
            href="/upload"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Upload size={14} /> New paper
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {!isLoggedIn ? (
          /* ── Not logged in state ───────────────────────────────── */
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Brain size={28} className="text-indigo-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Your learning dashboard</h1>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Sign in to track your concept confidence scores, spaced repetition queue, and concept knowledge map.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/upload"
                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Process a paper first →
              </Link>
            </div>
          </div>
        ) : (
          /* ── Logged in dashboard ──────────────────────────────── */
          <div className="space-y-8">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Papers processed', value: papers.length, icon: BookOpen, color: 'text-indigo-600 bg-indigo-50' },
                { label: 'Concepts learned', value: stats.totalConcepts, icon: Brain, color: 'text-teal-600 bg-teal-50' },
                { label: 'Avg confidence', value: `${stats.avgConfidence}%`, icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
                { label: 'Day streak', value: stats.streak, icon: Flame, color: 'text-rose-600 bg-rose-50' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                    <s.icon size={18} />
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Due for review */}
            {dueToday.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-rose-500">🔁</span> Due for review today
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs rounded-full">
                      {dueToday.length}
                    </span>
                  </h2>
                  <Link
                    href={`/review?userId=${userId}`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    <RefreshCw size={13} /> Start review session
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dueToday.map((item: Record<string, unknown>) => {
                    const concept = item.concept as Record<string, unknown> | null;
                    const paper = concept?.paper as Record<string, unknown> | null;
                    const score = item.confidence_score as number;
                    return (
                      <div
                        key={item.id as string}
                        className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
                      >
                        <div className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mb-2 ${confidenceColor(score)}`}>
                          {confidenceLabel(score)} · {score}%
                        </div>
                        <p className="font-semibold text-slate-800 text-sm">{concept?.name as string}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{paper?.title as string}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Papers library */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-900">My papers</h2>
                <Link href="/upload" className="text-sm text-indigo-600 hover:text-indigo-800">
                  + New paper
                </Link>
              </div>

              {papers.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
                  <p className="text-slate-500 mb-4">No papers yet.</p>
                  <Link
                    href="/upload"
                    className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Upload your first paper
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {papers.map((p: Record<string, unknown>) => {
                    const concepts = (p.concepts as Array<Record<string, unknown>>) ?? [];
                    return (
                      <Link
                        key={p.id as string}
                        href={`/paper/${p.id}`}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            p.status === 'done'
                              ? 'bg-teal-100 text-teal-700'
                              : p.status === 'error'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {p.status as string}
                          </span>
                          <span className="text-xs text-slate-400">{concepts.length} concepts</span>
                        </div>
                        <h3 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2">
                          {p.title as string ?? 'Untitled'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-2">{formatDate(p.created_at as string)}</p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
