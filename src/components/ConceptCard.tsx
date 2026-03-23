'use client';

import { useState } from 'react';
import { XAIVisual } from './XAIVisual';
import { ClipPlayer } from './ClipPlayer';
import { NotesSection } from './NotesSection';
import { QuizSection } from './QuizSection';
import { LinkedConcepts } from './LinkedConcepts';
import { cn, confidenceLabel, confidenceColor } from '@/lib/utils';
import type { Concept, Notes } from '@/types';

interface ConceptCardProps {
  concept: Concept;
  userId?: string;
  readonly?: boolean;
}

type Tab = 'visual' | 'clip' | 'notes' | 'quiz';

export function ConceptCard({ concept, userId, readonly = false }: ConceptCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('visual');

  // Supabase one-to-many joins return arrays even for one-to-one relations
  const notes: Notes | null = Array.isArray(concept.notes)
    ? ((concept.notes as unknown as Notes[])[0] ?? null)
    : (concept.notes ?? null);
  const confidence = concept.confidence;

  // Build notes object for sub-components
  const notesForChild = notes
    ? {
        what_it_is: notes.what_it_is,
        how_it_works: notes.how_it_works,
        why_it_matters: notes.why_it_matters,
      }
    : null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'visual', label: '🎨 Visual' },
    { id: 'clip',   label: '▶ Clip' },
    { id: 'notes',  label: '📝 Notes' },
    { id: 'quiz',   label: '🧠 Quiz' },
  ];

  return (
    <div
      id={`concept-${concept.id}`}
      className="rounded-3xl border border-slate-200 overflow-hidden shadow-sm bg-white scroll-mt-24"
    >
      {/* ── Card header ───────────────────────────────────────────── */}
      <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-0 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                Concept {concept.importance_rank}
              </span>
              {confidence && (
                <span className={cn('text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap', confidenceColor(confidence.confidence_score))}>
                  {confidenceLabel(confidence.confidence_score)} · {confidence.confidence_score}%
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">{concept.name}</h2>
            {concept.one_line && (
              <p className="mt-1 text-sm text-slate-500">{concept.one_line}</p>
            )}
          </div>
        </div>

        {/* Tab bar — horizontal scroll on mobile */}
        <div className="flex gap-0.5 -mb-px overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-shrink-0 px-3 sm:px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all border-b-2 whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50/60'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────────── */}
      <div className="p-5 sm:p-6">

        {/* Visual tab */}
        {activeTab === 'visual' && (
          concept.svg_visual ? (
            <XAIVisual
              svg={concept.svg_visual}
              conceptId={concept.id}
              conceptName={concept.name}
              readonly={readonly}
            />
          ) : (
            <EmptyState message="XAI visual is being generated…" />
          )
        )}

        {/* Clip tab */}
        {activeTab === 'clip' && (
          <ClipPlayer
            conceptId={concept.id}
            conceptName={concept.name}
            audioUrl={concept.audio_url}
            conceptNotes={notesForChild}
          />
        )}

        {/* Notes tab */}
        {activeTab === 'notes' && (
          notes ? (
            <NotesSection
              notes={notes}
              conceptId={concept.id}
              readonly={readonly}
            />
          ) : (
            <EmptyState message="Notes not yet generated for this concept." />
          )
        )}

        {/* Quiz tab */}
        {activeTab === 'quiz' && (
          <QuizSection
            questions={concept.quiz_questions ?? []}
            conceptId={concept.id}
            conceptName={concept.name}
            conceptNotes={notesForChild}
            userId={userId}
            readonly={readonly}
          />
        )}

        {/* Linked concepts — shown on notes and visual tabs */}
        {(activeTab === 'notes' || activeTab === 'visual') && userId && (
          <LinkedConcepts conceptId={concept.id} userId={userId} />
        )}

        {/* Source excerpt (all tabs) */}
        {concept.excerpt && (
          <details className="mt-4">
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 select-none">
              View source excerpt from paper ↓
            </summary>
            <blockquote className="mt-2 pl-3 border-l-2 border-slate-300 text-xs text-slate-500 italic leading-relaxed">
              {concept.excerpt}
            </blockquote>
          </details>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-slate-400">
      {message}
    </div>
  );
}
