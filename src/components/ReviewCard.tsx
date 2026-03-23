'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
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
    paper?: { id: string; title: string | null } | { id: string; title: string | null }[];
  };
}

interface ReviewCardProps {
  item: ReviewItem;
  index: number;
  total: number;
  onResult: (passed: boolean) => void;
}

const BOX_LABELS: Record<number, string> = { 1: '1d', 2: '3d', 3: '7d', 4: '14d', 5: 'Mastered' };

export function ReviewCard({ item, index, total, onResult }: ReviewCardProps) {
  const [phase, setPhase] = useState<'show' | 'quiz' | 'result'>('show');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [passed, setPassed] = useState(false);

  const concept = item.concept;
  // Unwrap paper (Supabase may return array)
  const paper = Array.isArray(concept.paper) ? concept.paper[0] : concept.paper;

  // Pick first MCQ from stored questions, else skip to result
  const questions = concept.quiz_questions ?? [];
  const mcq = questions.find((q) => q.type === 'multiple_choice' || q.type === ('mcq' as string));

  function handleStart() {
    if (mcq) {
      setPhase('quiz');
    } else {
      // No stored question — treat as seen
      handleAnswer(true);
    }
  }

  function handleAnswer(correct: boolean) {
    setPassed(correct);
    setPhase('result');
  }

  function handleMCQ(letter: string) {
    if (selectedLetter) return;
    setSelectedLetter(letter);
    handleAnswer(letter === (mcq?.correct ?? ''));
  }

  function handleContinue() {
    onResult(passed);
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4 text-xs text-slate-400">
        <span>{index + 1} / {total}</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((b) => (
            <div
              key={b}
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                item.box_level >= b
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-400'
              )}
            >
              {BOX_LABELS[b]}
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Source pill */}
        <div className="px-5 pt-5">
          {paper && (
            <span className="text-xs text-indigo-500 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded-full">
              {paper.title ?? 'Paper'}
            </span>
          )}
          <h2 className="text-xl font-extrabold text-slate-900 mt-2 leading-snug">{concept.name}</h2>
          {concept.one_line && (
            <p className="text-sm text-slate-500 mt-1">{concept.one_line}</p>
          )}
        </div>

        {/* SVG visual */}
        {concept.svg_visual && (
          <div
            className="mx-5 mt-4 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700"
            dangerouslySetInnerHTML={{ __html: concept.svg_visual }}
          />
        )}

        <div className="p-5">
          {/* Phase: SHOW — just remind, then quiz */}
          {phase === 'show' && (
            <button
              onClick={handleStart}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition-colors"
            >
              {mcq ? 'Take the quiz →' : 'Mark as reviewed →'}
            </button>
          )}

          {/* Phase: QUIZ */}
          {phase === 'quiz' && mcq && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-800 leading-snug">
                <span className="text-indigo-500 font-bold mr-1">Q.</span>
                {mcq.question}
              </p>
              <div className="space-y-2">
                {(mcq.options ?? []).map((opt, oi) => {
                  const letter = String.fromCharCode(65 + oi);
                  const isSelected = selectedLetter === letter;
                  const isCorrect = mcq.correct === letter;
                  const showResult = !!selectedLetter;
                  return (
                    <button
                      key={oi}
                      disabled={!!selectedLetter}
                      onClick={() => handleMCQ(letter)}
                      className={cn(
                        'w-full text-left text-sm px-4 py-3 rounded-xl border transition-all',
                        !showResult && 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50',
                        showResult && isCorrect && 'border-teal-400 bg-teal-50 text-teal-800 font-medium',
                        showResult && isSelected && !isCorrect && 'border-rose-400 bg-rose-50 text-rose-700',
                        showResult && !isSelected && !isCorrect && 'opacity-40'
                      )}
                    >
                      <span className="font-bold mr-2 text-slate-400">{letter}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Phase: RESULT */}
          {phase === 'result' && (
            <div className="space-y-4">
              <div className={cn(
                'flex items-center gap-3 p-4 rounded-2xl font-medium text-sm',
                passed
                  ? 'bg-teal-50 border border-teal-200 text-teal-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              )}>
                <span className="text-2xl">{passed ? '✅' : '📖'}</span>
                <div>
                  <p className="font-bold">{passed ? 'Correct!' : 'Keep studying'}</p>
                  <p className="text-xs opacity-80 mt-0.5">
                    {passed
                      ? `Moving to box ${Math.min(item.box_level + 1, 5)} — next review in ${BOX_LABELS[Math.min(item.box_level + 1, 5)]}`
                      : 'Back to box 1 — review again tomorrow'}
                  </p>
                </div>
              </div>
              {mcq?.explanation && (
                <div className="text-xs text-indigo-800 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 leading-relaxed">
                  <span className="font-bold">💡 </span>{mcq.explanation}
                </div>
              )}
              <button
                onClick={handleContinue}
                className="w-full py-3 bg-slate-900 hover:bg-slate-700 text-white font-semibold rounded-2xl transition-colors"
              >
                Next concept →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Streak */}
      {item.streak_days > 0 && (
        <p className="text-center text-xs text-amber-600 mt-3">
          🔥 {item.streak_days} day streak on this concept
        </p>
      )}
    </div>
  );
}
