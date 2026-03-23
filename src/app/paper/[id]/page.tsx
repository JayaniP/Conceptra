import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase';
import { ConceptCard } from '@/components/ConceptCard';
import { ShareButton } from '@/components/ShareButton';
import { ExportMenu } from '@/components/ExportMenu';
import { ConceptSidebar } from '@/components/ConceptSidebar';
import { PaperSoulCard } from '@/components/PaperSoulCard';
import type { Paper } from '@/types';

const NOTION_ERRORS: Record<string, string> = {
  access_denied: 'Notion access was denied. Please try again.',
  token_failed: 'Failed to connect to Notion. Check your NOTION_CLIENT_ID and NOTION_CLIENT_SECRET.',
  paper_not_found: 'Could not find the paper data to export.',
  page_creation_failed: 'Failed to create Notion page. Make sure your integration has write access.',
  no_accessible_page: 'No accessible Notion pages found. Share at least one page with your integration.',
};

interface PageProps {
  params: { id: string };
  searchParams: { notionError?: string };
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('papers')
    .select('title, abstract')
    .eq('id', params.id)
    .single();

  return {
    title: data ? `${data.title} — Conceptra` : 'Paper — Conceptra',
    description: data?.abstract?.slice(0, 160),
  };
}

export default async function PaperPage({ params, searchParams }: PageProps) {
  const notionErrorMsg = searchParams.notionError
    ? (NOTION_ERRORS[searchParams.notionError] ?? 'Notion export failed. Please try again.')
    : null;
  const supabase = createAdminClient();

  const { data: paper, error } = await supabase
    .from('papers')
    .select(`
      *,
      concepts (
        *,
        notes (*),
        quiz_questions (*)
      )
    `)
    .eq('id', params.id)
    .single();

  if (error || !paper) notFound();

  const typedPaper = paper as unknown as Paper;
  const concepts = (typedPaper.concepts ?? [])
    .sort((a, b) => (a.importance_rank ?? 0) - (b.importance_rank ?? 0));

  return (
    <div className="min-h-screen bg-slate-50">
      {notionErrorMsg && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-sm text-rose-700 text-center">
          {notionErrorMsg}
        </div>
      )}
      {/* ── Sticky header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="hidden sm:block font-bold text-slate-800">Conceptra</span>
          </Link>

          {/* Paper title (truncated on mobile) */}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-slate-800 truncate">
              {typedPaper.title ?? 'Processing…'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex-1 bg-slate-200 rounded-full h-1 max-w-[160px]">
                <div
                  className="bg-indigo-500 h-1 rounded-full"
                  style={{ width: concepts.length > 0 ? '100%' : '30%' }}
                />
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">{concepts.length} concepts</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <ShareButton paperId={params.id} paperTitle={typedPaper.title ?? undefined} />
            <ExportMenu paperId={params.id} />
          </div>
        </div>
      </header>

      {/* ── Mobile: horizontal concept pill row ──────────────────── */}
      {concepts.length > 0 && (
        <div className="lg:hidden bg-white border-b border-slate-100 px-4 py-2.5 overflow-x-auto">
          <div className="flex gap-2 w-max">
            {concepts.map((c) => (
              <a
                key={c.id}
                href={`#concept-${c.id}`}
                className="flex-shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-xs font-medium rounded-full transition-colors whitespace-nowrap"
              >
                {c.importance_rank}. {c.name}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex gap-8">
        {/* ── Left sidebar (desktop only) ─────────────────────────── */}
        <aside className="hidden lg:block w-60 xl:w-64 flex-shrink-0">
          <div className="sticky top-20 space-y-4">
            {/* Paper meta */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="font-bold text-slate-900 text-sm leading-snug mb-2">
                {typedPaper.title}
              </h2>
              {typedPaper.authors && typedPaper.authors.length > 0 && (
                <p className="text-xs text-slate-500 mb-3">
                  {typedPaper.authors.slice(0, 3).join(', ')}
                  {typedPaper.authors.length > 3 ? ' et al.' : ''}
                </p>
              )}
              {typedPaper.abstract && (
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-4">
                  {typedPaper.abstract}
                </p>
              )}
            </div>

            {/* Concept index with Intersection Observer highlighting */}
            {concepts.length > 0 && (
              <ConceptSidebar concepts={concepts} />
            )}
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 space-y-5 sm:space-y-6">
          {typedPaper.status === 'processing' && (
            <ProcessingState />
          )}

          {typedPaper.status === 'error' && (
            <ErrorState message={typedPaper.error_msg} />
          )}

          {typedPaper.status === 'done' && concepts.length === 0 && (
            <div className="text-center py-20 text-slate-500">
              No concepts were extracted. The paper may be too short or unreadable.
              <Link href="/upload" className="block mt-3 text-sm text-indigo-600 hover:underline">
                Try a different paper
              </Link>
            </div>
          )}

          <PaperSoulCard
            initialSoul={typedPaper.soul ?? null}
            paperId={params.id}
            paperCreatedAt={typedPaper.created_at}
          />

          {concepts.map((concept) => (
            <ConceptCard
              key={concept.id}
              concept={concept}
              readonly={false}
            />
          ))}
        </main>
      </div>
    </div>
  );
}

function ProcessingState() {
  return (
    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-5" />
      <p className="font-semibold text-slate-800">Processing your paper…</p>
      <p className="text-sm text-slate-400 mt-1">This usually takes 45–60 seconds</p>
      <p className="text-xs text-slate-400 mt-4">This page will update automatically once ready.</p>
    </div>
  );
}

function ErrorState({ message }: { message: string | null }) {
  return (
    <div className="text-center py-16 bg-rose-50 rounded-3xl border border-rose-200">
      <p className="text-2xl mb-3">😕</p>
      <p className="font-semibold text-rose-700">Processing failed</p>
      <p className="text-sm text-rose-600 mt-1 max-w-sm mx-auto">
        {message ?? 'An unexpected error occurred. Please try again.'}
      </p>
      <Link
        href="/upload"
        className="mt-4 inline-block px-5 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-xl hover:bg-rose-700 transition-colors"
      >
        Try again
      </Link>
    </div>
  );
}
