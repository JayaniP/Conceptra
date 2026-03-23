'use client';

import { useState } from 'react';
import { Share2, Check, Copy, Twitter, Linkedin } from 'lucide-react';

interface ShareButtonProps {
  paperId: string;
  paperTitle?: string;
}

export function ShareButton({ paperId, paperTitle }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function getOrCreateShare() {
    setLoading(true);
    try {
      const res = await fetch('/api/create-share-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper_id: paperId }),
      });
      const data = await res.json();
      setShareUrl(data.url);
      setSlug(data.slug);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const tweetText = paperTitle
    ? `Just processed "${paperTitle}" with @Conceptra — check out the XAI concept cards 🧠`
    : 'Just processed a research paper with @Conceptra — check out the concept cards 🧠';

  return (
    <>
      <button
        onClick={getOrCreateShare}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
      >
        {loading
          ? <span className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          : <Share2 size={14} />
        }
        Share
      </button>

      {open && shareUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">C</span>
              </div>
              <h3 className="font-bold text-slate-900">Share this study pack</h3>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Anyone with this link can view all concept cards — no login required.
            </p>

            {/* URL input + copy */}
            <div className="flex gap-2 mb-5">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-slate-50 font-mono text-slate-700"
              />
              <button
                onClick={copyLink}
                className="px-3 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            {copied && (
              <p className="text-xs text-teal-600 font-medium -mt-3 mb-4">✓ Copied to clipboard!</p>
            )}

            {/* Social share */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">Share on social</p>
              <div className="flex gap-3">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}&hashtags=MachineLearning,ResearchPapers`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <Twitter size={14} /> Post on X
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#0077B5] text-white text-sm font-medium rounded-xl hover:bg-[#006097] transition-colors"
                >
                  <Linkedin size={14} /> LinkedIn
                </a>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="mt-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(tweetText + '\n' + shareUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                <span className="text-base">💬</span> Share on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
