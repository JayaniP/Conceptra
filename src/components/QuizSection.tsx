'use client';

import { useState, useCallback } from 'react';
import { CheckCircle, XCircle, Loader2, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuizQuestion, EvaluationResult } from '@/types';

interface QuizSectionProps {
  /** Pre-loaded questions (may be empty — will fetch on demand) */
  questions: QuizQuestion[];
  conceptId: string;
  conceptName?: string;
  /** Notes needed for on-demand quiz generation */
  conceptNotes?: {
    what_it_is?: string | null;
    how_it_works?: string[] | null;
    why_it_matters?: string | null;
  } | null;
  userId?: string;
  readonly?: boolean;
}

type AnswerState = {
  selectedLetter?: string;   // for MCQ
  shortText?: string;        // for short answer
  submitted: boolean;
  isCorrect?: boolean;
  evaluation?: EvaluationResult;
  evaluating?: boolean;
};

export function QuizSection({
  questions: initialQuestions,
  conceptId,
  conceptName,
  conceptNotes,
  userId,
  readonly = false,
}: QuizSectionProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    initialQuestions.length > 0 ? 'ready' : 'idle'
  );
  const [errorMsg, setErrorMsg] = useState('');

  // answers keyed by question id
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});

  // ── Load quiz on demand ────────────────────────────────────────────
  const loadQuiz = useCallback(async () => {
    setLoadState('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptId,
          // Also pass notes so the API can generate without a separate fetch
          concept_name: conceptName,
          notes: conceptNotes,
        }),
      });
      if (!res.ok) throw new Error('Quiz generation failed');
      const { questions: qs } = await res.json();
      // Normalise — API may return type 'mcq' or 'multiple_choice'
      const normalised: QuizQuestion[] = (qs ?? []).map((q: Record<string, unknown>, i: number) => ({
        ...q,
        type: q.type === 'mcq' ? 'multiple_choice' : q.type,
        sort_order: i,
      })) as QuizQuestion[];
      setQuestions(normalised);
      setAnswers({});
      setLoadState('ready');
    } catch {
      setErrorMsg('Could not generate quiz. Please try again.');
      setLoadState('error');
    }
  }, [conceptId, conceptName, conceptNotes]);

  // ── Submit MCQ ────────────────────────────────────────────────────
  function submitMCQ(qId: string, letter: string, correctLetter: string) {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        selectedLetter: letter,
        submitted: true,
        isCorrect: letter === correctLetter,
      },
    }));
    // Persist attempt to Supabase via API (fire-and-forget)
    if (userId) {
      fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questions.find((q) => q.id === qId)?.question,
          rubric: `Correct answer: ${correctLetter}`,
          userAnswer: letter,
          userId,
          conceptId,
          questionId: qId,
          score: letter === correctLetter ? 3 : 0,
        }),
      }).catch(() => {/* non-fatal */});
    }
  }

  // ── Submit short answer ────────────────────────────────────────────
  async function submitShortAnswer(q: QuizQuestion) {
    const answer = answers[q.id]?.shortText ?? '';
    if (!answer.trim()) return;

    setAnswers((prev) => ({ ...prev, [q.id]: { ...prev[q.id], evaluating: true, submitted: false } }));

    const res = await fetch('/api/evaluate-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: q.question,
        rubric: q.rubric,
        userAnswer: answer,
        userId,
        conceptId,
        questionId: q.id,
      }),
    });
    const evaluation: EvaluationResult = await res.json();

    setAnswers((prev) => ({
      ...prev,
      [q.id]: { shortText: answer, submitted: true, evaluating: false, evaluation },
    }));
  }

  // ── Summary score ──────────────────────────────────────────────────
  const allSubmitted =
    questions.length > 0 && questions.every((q) => answers[q.id]?.submitted);
  const totalScore = Object.values(answers).reduce((sum, a) => {
    if (!a.submitted) return sum;
    if (a.isCorrect !== undefined) return sum + (a.isCorrect ? 3 : 0);
    return sum + (a.evaluation?.score ?? 0);
  }, 0);
  const maxScore = questions.length * 3;

  // ── Render: idle (not yet generated) ──────────────────────────────
  if (loadState === 'idle' || loadState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-4 text-center bg-slate-50 rounded-2xl border border-slate-200">
        <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
          <Brain className="text-indigo-600" size={26} />
        </div>
        <div>
          <p className="font-semibold text-slate-800">Test your understanding</p>
          <p className="text-sm text-slate-500 mt-1">3 adaptive questions · scores saved to your profile</p>
        </div>
        <button
          onClick={loadQuiz}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-md shadow-indigo-200"
        >
          Generate quiz
        </button>
        {errorMsg && <p className="text-sm text-rose-600">{errorMsg}</p>}
      </div>
    );
  }

  if (loadState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-3 bg-slate-50 rounded-2xl border border-slate-200">
        <Loader2 className="animate-spin text-indigo-600" size={28} />
        <p className="text-sm text-slate-600 font-medium">Generating quiz questions…</p>
      </div>
    );
  }

  // ── Render: quiz ready ─────────────────────────────────────────────
  const sorted = [...questions].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return (
    <div className="space-y-6">
      {/* Score summary shown when all answered */}
      {allSubmitted && (
        <div className={cn(
          'flex items-center gap-3 p-4 rounded-2xl font-medium',
          totalScore >= maxScore * 0.7
            ? 'bg-teal-50 border border-teal-200 text-teal-800'
            : 'bg-amber-50 border border-amber-200 text-amber-800'
        )}>
          <span className="text-2xl">
            {totalScore >= maxScore * 0.8 ? '🌟' : totalScore >= maxScore * 0.5 ? '🟢' : '📖'}
          </span>
          <div>
            <p className="font-bold">Score: {totalScore} / {maxScore}</p>
            <p className="text-sm opacity-80">
              {totalScore >= maxScore * 0.8
                ? 'Excellent — you really understand this concept.'
                : totalScore >= maxScore * 0.5
                ? 'Good — a couple of gaps worth revisiting.'
                : 'Keep at it — review the notes and try again.'}
            </p>
          </div>
          {!readonly && (
            <button
              onClick={loadQuiz}
              className="ml-auto text-sm underline opacity-70 hover:opacity-100"
            >
              New questions
            </button>
          )}
        </div>
      )}

      {sorted.map((q, qi) => {
        const state = answers[q.id] ?? { submitted: false };
        const isMCQ = q.type === 'multiple_choice' || q.type === ('mcq' as string);

        return (
          <div key={q.id} className="space-y-3">
            <p className="text-sm font-semibold text-slate-800 leading-snug">
              <span className="text-indigo-500 font-bold mr-1">Q{qi + 1}.</span>
              {q.question}
            </p>

            {/* ── MCQ ─────────────────────────────────────────────────── */}
            {isMCQ && q.options && (
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const letter = String.fromCharCode(65 + oi);
                  const isSelected = state.selectedLetter === letter;
                  const isCorrect = q.correct === letter;
                  const showResult = state.submitted;

                  return (
                    <button
                      key={oi}
                      disabled={state.submitted || readonly}
                      onClick={() => submitMCQ(q.id, letter, q.correct ?? '')}
                      className={cn(
                        'w-full text-left text-sm px-4 py-3 rounded-xl border transition-all duration-200',
                        !showResult && 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 active:scale-[0.99]',
                        showResult && isCorrect && 'border-teal-400 bg-teal-50 text-teal-800 font-medium',
                        showResult && isSelected && !isCorrect && 'border-rose-400 bg-rose-50 text-rose-700',
                        showResult && !isSelected && !isCorrect && 'border-slate-100 opacity-40'
                      )}
                    >
                      <span className="font-bold mr-2 text-slate-500">{letter}.</span>
                      {opt}
                      {showResult && isCorrect && (
                        <CheckCircle size={14} className="inline ml-2 text-teal-600" />
                      )}
                      {showResult && isSelected && !isCorrect && (
                        <XCircle size={14} className="inline ml-2 text-rose-500" />
                      )}
                    </button>
                  );
                })}

                {state.submitted && q.explanation && (
                  <div className="mt-1.5 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-800 leading-relaxed">
                    <span className="font-bold">💡 </span>{q.explanation}
                  </div>
                )}
              </div>
            )}

            {/* ── Short answer ─────────────────────────────────────────── */}
            {!isMCQ && (
              <div className="space-y-2">
                {!state.submitted ? (
                  <>
                    <textarea
                      rows={3}
                      placeholder="Write your answer here…"
                      disabled={readonly || state.evaluating}
                      value={state.shortText ?? ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [q.id]: { ...prev[q.id], shortText: e.target.value },
                        }))
                      }
                      className="w-full border border-slate-300 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
                    />
                    {!readonly && (
                      <button
                        onClick={() => submitShortAnswer(q)}
                        disabled={!state.shortText?.trim() || state.evaluating}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                      >
                        {state.evaluating && <Loader2 size={14} className="animate-spin" />}
                        {state.evaluating ? 'Evaluating…' : 'Submit answer'}
                      </button>
                    )}
                  </>
                ) : state.evaluation ? (
                  <div className="space-y-2">
                    {/* User answer */}
                    <div className="text-sm text-slate-600 italic border-l-2 border-slate-300 pl-3">
                      "{state.shortText}"
                    </div>
                    {/* Score badge */}
                    <div className={cn(
                      'flex items-start gap-2.5 p-3 rounded-xl text-sm',
                      state.evaluation.score >= 2
                        ? 'bg-teal-50 border border-teal-200 text-teal-800'
                        : 'bg-amber-50 border border-amber-200 text-amber-800'
                    )}>
                      <span className="text-lg flex-shrink-0 mt-0.5">
                        {['⚡', '🟡', '🟢', '⭐'][state.evaluation.score]}
                      </span>
                      <div>
                        <p className="font-bold">Score {state.evaluation.score}/3 — {state.evaluation.feedback}</p>
                        <p className="mt-1 text-xs opacity-80">
                          <strong>Ideal:</strong> {state.evaluation.correct_answer}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
