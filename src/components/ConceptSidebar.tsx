'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Concept } from '@/types';

interface ConceptSidebarProps {
  concepts: Concept[];
}

export function ConceptSidebar({ concepts }: ConceptSidebarProps) {
  const [activeId, setActiveId] = useState<string>(concepts[0]?.id ?? '');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Intersection Observer — highlights the concept card currently in view
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the entry that is most visible (highest intersectionRatio)
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          const id = visible[0].target.id.replace('concept-', '');
          setActiveId(id);
        }
      },
      {
        rootMargin: '-10% 0px -60% 0px', // trigger when card enters upper 40% of viewport
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    // Observe every concept card
    concepts.forEach((c) => {
      const el = document.getElementById(`concept-${c.id}`);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [concepts]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
        Concepts
      </h3>
      <ul className="space-y-0.5">
        {concepts.map((c) => {
          const isActive = activeId === c.id;
          return (
            <li key={c.id}>
              <a
                href={`#concept-${c.id}`}
                className={cn(
                  'flex items-start gap-2 px-2.5 py-2 rounded-xl text-xs transition-all duration-200',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                )}
              >
                <span
                  className={cn(
                    'flex-shrink-0 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold mt-0.5',
                    isActive
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  )}
                >
                  {c.importance_rank}
                </span>
                <span className="leading-snug line-clamp-2">{c.name}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
