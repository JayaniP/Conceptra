'use client';

import { useState } from 'react';
import { Maximize2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XAIVisualProps {
  svg: string;
  conceptId: string;
  conceptName: string;
  readonly?: boolean;
}

/** Remove <path> elements whose d attribute contains malformed curve commands. */
function sanitiseSvg(raw: string): string {
  // Q/C/S commands need specific number counts; a trailing command letter
  // with no numbers before it produces the browser error. Strip those paths.
  return raw.replace(/<path([^>]*)\bd="([^"]*)"([^>]*)>/gi, (match, _pre, d, _post) => {
    // Malformed: a curve command (Q/C/S/T/A) immediately followed by another
    // command letter or end-of-string with fewer numbers than required.
    if (/[QqCcSsTtAa]\s*[MmZzLlHhVvQqCcSsTtAa]/.test(d)) return '';
    return match;
  });
}

export function XAIVisual({ svg, conceptId, conceptName, readonly = false }: XAIVisualProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentSvg, setCurrentSvg] = useState(() => sanitiseSvg(svg));

  async function regenerate() {
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/generate-visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptId }),
      });
      const { svg: newSvg } = await res.json();
      if (newSvg) setCurrentSvg(newSvg);
    } catch {
      // silent fail
    } finally {
      setIsRegenerating(false);
    }
  }

  return (
    <>
      <div className="relative group rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700">
        {/* SVG diagram */}
        <div
          className="w-full"
          dangerouslySetInnerHTML={{ __html: currentSvg }}
        />

        {/* Overlay controls */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {!readonly && (
            <button
              onClick={regenerate}
              disabled={isRegenerating}
              title="Regenerate diagram"
              className={cn(
                'p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors',
                isRegenerating && 'animate-spin'
              )}
            >
              <RefreshCw size={14} />
            </button>
          )}
          <button
            onClick={() => setFullscreen(true)}
            title="Fullscreen"
            className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <Maximize2 size={14} />
          </button>
        </div>

        <p className="px-4 py-2 text-xs text-slate-400 text-center border-t border-slate-700/50">
          XAI Mechanism Diagram · {conceptName}
        </p>
      </div>

      {/* Fullscreen modal */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
          onClick={() => setFullscreen(false)}
        >
          <div
            className="max-w-5xl w-full bg-slate-900 rounded-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold">{conceptName} — Mechanism Diagram</h3>
              <button
                onClick={() => setFullscreen(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div dangerouslySetInnerHTML={{ __html: currentSvg }} />
          </div>
        </div>
      )}
    </>
  );
}
