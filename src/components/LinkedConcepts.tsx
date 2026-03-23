'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase';

interface LinkedConceptsProps {
  conceptId: string;
  userId?: string;
}

interface LinkRow {
  concept_id_b: string;
  similarity_score: number;
  linked_concept: {
    id: string;
    name: string;
    one_line: string | null;
    paper_id: string;
    paper: { id: string; title: string | null } | { id: string; title: string | null }[];
  };
}

export function LinkedConcepts({ conceptId, userId }: LinkedConceptsProps) {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    // Fetch links client-side via Supabase
    async function fetchLinks() {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('concept_links')
        .select(`
          concept_id_b,
          similarity_score,
          linked_concept:concepts!concept_id_b (
            id, name, one_line, paper_id,
            paper:papers ( id, title )
          )
        `)
        .eq('concept_id_a', conceptId)
        .eq('user_id', userId)
        .order('similarity_score', { ascending: false })
        .limit(4);

      setLinks((data as unknown as LinkRow[]) ?? []);
      setLoading(false);
    }

    fetchLinks();
  }, [conceptId, userId]);

  if (loading || links.length === 0) return null;

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Also appears in your library
      </p>
      <div className="space-y-2">
        {links.map((link) => {
          const c = link.linked_concept;
          const paper = Array.isArray(c.paper) ? c.paper[0] : c.paper;
          return (
            <Link
              key={link.concept_id_b}
              href={`/paper/${c.paper_id}#concept-${c.id}`}
              className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors group"
            >
              <span className="text-base flex-shrink-0 mt-0.5">📄</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-700 group-hover:text-indigo-700 truncate">
                  {c.name}
                </p>
                {paper && (
                  <p className="text-xs text-slate-400 truncate">{paper.title}</p>
                )}
              </div>
              <span className="ml-auto text-xs text-slate-300 flex-shrink-0 font-mono">
                {Math.round(link.similarity_score * 100)}%
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
