'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ConceptOption {
  id: string;
  name: string;
  one_line: string | null;
  paper_title: string | null;
  paper_id: string;
}

// Demo userId — replace with real auth session
function getUserId(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('userId') ?? '';
}

export default function CreatePackPage() {
  const router = useRouter();
  const [userId] = useState(getUserId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [concepts, setConcepts] = useState<ConceptOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load user's concepts
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/user-concepts?userId=${userId}`)
      .then((r) => r.json())
      .then((data: { concepts: ConceptOption[] }) => {
        setConcepts(data.concepts ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  function toggleConcept(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title || selected.size === 0) {
      setError('Add a title and select at least one concept.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId || null,
          title,
          description: description || null,
          concept_ids: Array.from(selected),
        }),
      });
      const { pack, error: err } = await res.json();
      if (err) throw new Error(err);
      router.push(`/packs/${pack.slug}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create pack.');
      setSaving(false);
    }
  }

  // Group concepts by paper
  const byPaper: Record<string, ConceptOption[]> = {};
  for (const c of concepts) {
    const key = c.paper_title ?? c.paper_id;
    if (!byPaper[key]) byPaper[key] = [];
    byPaper[key].push(c);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-100 px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-bold text-slate-800">Conceptra</span>
        </Link>
        <Link href="/packs" className="text-sm text-slate-500 hover:text-slate-700">← Packs</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Create a concept pack</h1>
        <p className="text-slate-500 text-sm mb-8">
          Curate concepts from your library into a shareable pack. Others can follow it to add all concepts to their daily review queue.
        </p>

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Pack title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Best papers on transformer attention"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this pack about? Who is it for?"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Concept picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">
                Select concepts <span className="text-indigo-500 font-bold">({selected.size} selected)</span>
              </label>
            </div>

            {!userId ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                Sign in to select concepts from your library, or process a paper first.
              </div>
            ) : loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : concepts.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-500 text-center">
                No concepts yet.{' '}
                <Link href="/upload" className="text-indigo-600 hover:underline">
                  Process a paper first →
                </Link>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {Object.entries(byPaper).map(([paperTitle, cs]) => (
                  <div key={paperTitle}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 truncate">
                      {paperTitle}
                    </p>
                    <div className="space-y-1.5">
                      {cs.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleConcept(c.id)}
                          className={cn(
                            'w-full text-left px-3 py-2.5 rounded-xl border transition-all text-sm',
                            selected.has(c.id)
                              ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              'w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center',
                              selected.has(c.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                            )}>
                              {selected.has(c.id) && (
                                <span className="text-white text-xs leading-none">✓</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 truncate">{c.name}</p>
                              {c.one_line && (
                                <p className="text-xs text-slate-400 truncate">{c.one_line}</p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-4 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving || selected.size === 0 || !title}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-2xl transition-colors"
          >
            {saving ? 'Creating…' : `Create pack with ${selected.size} concept${selected.size !== 1 ? 's' : ''}`}
          </button>
        </form>
      </div>
    </div>
  );
}
