'use client';

import { useEffect, useState } from 'react';
import { X, Zap } from 'lucide-react';

const FREE_PAPER_LIMIT = 3;
const STORAGE_KEY = 'conceptra_papers_used';

/**
 * Tracks how many papers the anonymous user has processed (via localStorage).
 * After FREE_PAPER_LIMIT papers, shows the upgrade modal.
 *
 * Call `incrementPaperCount()` after a paper finishes processing.
 * Renders nothing when under the limit.
 */
export function FreeTierModal() {
  const [show, setShow] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const stored = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
    setCount(stored);
    if (stored >= FREE_PAPER_LIMIT) setShow(true);
  }, []);

  if (!show) return null;

  const stripeUrl = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? '/api/checkout' // handled by Stripe checkout API route
    : 'mailto:hello@conceptra.ai?subject=Pro upgrade';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 px-8 py-8 text-white text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
            <Zap size={26} className="text-white" />
          </div>
          <h2 className="text-2xl font-extrabold mb-2">You've used your 3 free papers</h2>
          <p className="text-indigo-200 text-sm">
            Upgrade to Pro for unlimited papers, Notion export, and spaced repetition.
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {/* Feature list */}
          <ul className="space-y-3 mb-6">
            {[
              '✅ Unlimited papers — no cap, ever',
              '✅ Full concept graphs across all your papers',
              '✅ Notion & Anki export',
              '✅ Spaced repetition review queue',
              '✅ Priority processing (faster results)',
            ].map((f) => (
              <li key={f} className="text-sm text-slate-700">{f}</li>
            ))}
          </ul>

          {/* Price */}
          <div className="bg-indigo-50 rounded-2xl p-4 text-center mb-6">
            <span className="text-3xl font-extrabold text-indigo-700">£9</span>
            <span className="text-indigo-500 font-medium"> / month</span>
            <p className="text-xs text-indigo-400 mt-1">Cancel any time · no commitment</p>
          </div>

          {/* CTA */}
          <a
            href={stripeUrl}
            className="block w-full text-center py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-indigo-200 mb-3"
          >
            Upgrade to Pro — £9/mo
          </a>

          <button
            onClick={() => setShow(false)}
            className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Maybe later
          </button>
        </div>

        {/* Close */}
        <button
          onClick={() => setShow(false)}
          className="absolute top-4 right-4 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

/**
 * Call this from the upload flow after a paper successfully finishes processing.
 * Returns the new count.
 */
export function incrementPaperCount(): number {
  const current = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
  const next = current + 1;
  localStorage.setItem(STORAGE_KEY, String(next));
  return next;
}

/**
 * Returns true if the user has hit the free limit.
 */
export function isAtFreeLimit(): boolean {
  const stored = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
  return stored >= FREE_PAPER_LIMIT;
}
