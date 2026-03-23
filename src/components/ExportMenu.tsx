'use client';

import { useState } from 'react';
import { Download, ChevronDown, FileText, BookOpen, ExternalLink } from 'lucide-react';

interface ExportMenuProps {
  paperId: string;
}

export function ExportMenu({ paperId }: ExportMenuProps) {
  const [open, setOpen] = useState(false);

  function exportMarkdown() {
    window.open(`/api/export?paperId=${paperId}&format=markdown`, '_blank');
    setOpen(false);
  }

  function exportAnki() {
    window.open(`/api/export?paperId=${paperId}&format=anki`, '_blank');
    setOpen(false);
  }

  function openNotion() {
    // Notion OAuth redirect — requires NOTION_CLIENT_ID in env
    window.location.href = `/api/export/notion?paperId=${paperId}`;
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
      >
        <Download size={14} /> Export <ChevronDown size={12} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-40 w-48 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
            <button
              onClick={exportMarkdown}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <FileText size={14} className="text-slate-400" /> Markdown (.md)
            </button>
            <button
              onClick={exportAnki}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
            >
              <BookOpen size={14} className="text-slate-400" /> Anki deck (.apkg)
            </button>
            <button
              onClick={openNotion}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left border-t border-slate-100"
            >
              <ExternalLink size={14} className="text-slate-400" /> Export to Notion
            </button>
          </div>
        </>
      )}
    </div>
  );
}
