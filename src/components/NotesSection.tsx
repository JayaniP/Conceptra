'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit3, Check, X } from 'lucide-react';
import type { Notes } from '@/types';

interface NotesSectionProps {
  notes: Notes;
  conceptId: string;
  readonly?: boolean;
}

export function NotesSection({ notes, conceptId, readonly = false }: NotesSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes);
  const [saving, setSaving] = useState(false);

  async function saveEdits() {
    setSaving(true);
    try {
      await fetch('/api/generate-notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptId, notes: draft }),
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="font-semibold text-slate-800">📝 Structured Notes</span>
        <div className="flex items-center gap-2">
          {!readonly && !editing && expanded && (
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <Edit3 size={14} />
            </button>
          )}
          {expanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="p-5 space-y-5">
          {/* What it is */}
          <section>
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">What it is</h4>
            {editing ? (
              <textarea
                className="w-full text-sm text-slate-700 border border-slate-300 rounded-lg p-2 resize-none"
                rows={3}
                value={draft.what_it_is ?? ''}
                onChange={(e) => setDraft({ ...draft, what_it_is: e.target.value })}
              />
            ) : (
              <p className="text-sm text-slate-700 leading-relaxed">{draft.what_it_is}</p>
            )}
          </section>

          {/* How it works */}
          <section>
            <h4 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">How it works</h4>
            <ol className="space-y-1.5">
              {(draft.how_it_works ?? []).map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs flex items-center justify-center font-bold mt-0.5">
                    {i + 1}
                  </span>
                  {editing ? (
                    <input
                      className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm"
                      value={step}
                      onChange={(e) => {
                        const updated = [...(draft.how_it_works ?? [])];
                        updated[i] = e.target.value;
                        setDraft({ ...draft, how_it_works: updated });
                      }}
                    />
                  ) : (
                    <span className="leading-relaxed">{step}</span>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {/* Why it matters */}
          <section>
            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Why it matters</h4>
            {editing ? (
              <textarea
                className="w-full text-sm text-slate-700 border border-slate-300 rounded-lg p-2 resize-none"
                rows={3}
                value={draft.why_it_matters ?? ''}
                onChange={(e) => setDraft({ ...draft, why_it_matters: e.target.value })}
              />
            ) : (
              <p className="text-sm text-slate-700 leading-relaxed">{draft.why_it_matters}</p>
            )}
          </section>

          {/* Common misconceptions */}
          {(draft.misconceptions ?? []).length > 0 && (
            <section>
              <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">Common misconceptions</h4>
              <ul className="space-y-1.5">
                {(draft.misconceptions ?? []).map((m, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <span className="text-rose-500 flex-shrink-0 mt-0.5">✗</span>
                    <span className="leading-relaxed">{m}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Save / cancel buttons */}
          {editing && (
            <div className="flex gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={saveEdits}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Check size={14} /> {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => { setEditing(false); setDraft(notes); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
