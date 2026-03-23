import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase';
import { ConceptCard } from '@/components/ConceptCard';
import type { SharedPack } from '@/types';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('shared_packs')
    .select('paper:papers(title, abstract, concepts(name))')
    .eq('slug', params.slug)
    .single();

  const paper = (data as unknown as SharedPack)?.paper;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://conceptra.ai';
  const ogImageUrl = `${appUrl}/api/og/${params.slug}`;
  const title = paper ? `${paper.title} — Conceptra Study Pack` : 'Study Pack — Conceptra';
  const description = `Explore ${paper?.title ?? 'this paper'} with XAI visual diagrams and interactive concept cards. Powered by Conceptra.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${appUrl}/pack/${params.slug}`,
      siteName: 'Conceptra',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${paper?.title ?? 'Research paper'} — Conceptra Study Pack`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      site: '@conceptra_ai',
    },
  };
}

export default async function PackPage({ params }: PageProps) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('shared_packs')
    .select(`
      *,
      paper:papers (
        *,
        concepts (
          *,
          notes (*),
          quiz_questions (*)
        )
      )
    `)
    .eq('slug', params.slug)
    .single();

  if (error || !data) notFound();

  // Increment view count
  await supabase.from('shared_packs').update({ view_count: data.view_count + 1 }).eq('id', data.id);

  const pack = data as unknown as SharedPack;
  const paper = pack.paper!;
  const concepts = paper.concepts ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top branding banner */}
      <div className="bg-indigo-600 text-white py-3 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <p className="text-sm">
            <span className="font-bold">Conceptra</span> — Research papers, finally understood
          </p>
          <Link
            href="/upload"
            className="flex-shrink-0 px-4 py-1.5 bg-white text-indigo-600 text-sm font-bold rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Try free →
          </Link>
        </div>
      </div>

      {/* Paper header */}
      <header className="bg-white border-b border-slate-100 py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs text-indigo-500 font-semibold uppercase tracking-wider mb-2">
            Study Pack · {concepts.length} concepts
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">{paper.title}</h1>
          {paper.authors && paper.authors.length > 0 && (
            <p className="text-sm text-slate-500">
              {paper.authors.slice(0, 4).join(', ')}
              {paper.authors.length > 4 ? ' et al.' : ''}
            </p>
          )}
          {paper.abstract && (
            <p className="mt-4 text-sm text-slate-600 leading-relaxed max-w-3xl line-clamp-3">
              {paper.abstract}
            </p>
          )}
        </div>
      </header>

      {/* Concepts */}
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        {concepts
          .sort((a, b) => (a.importance_rank ?? 0) - (b.importance_rank ?? 0))
          .map((concept, index) => {
            // Non-authenticated users see 2 full concept cards, then blur gate
            const isGated = index >= 2;

            return isGated ? (
              <div key={concept.id} className="relative rounded-3xl overflow-hidden">
                <div className="blur-sm pointer-events-none">
                  <ConceptCard concept={concept} readonly={true} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/70 to-transparent flex items-end justify-center pb-10">
                  <div className="text-center">
                    <p className="font-bold text-slate-900 text-lg mb-2">
                      Sign up free to see all {concepts.length} concepts
                    </p>
                    <p className="text-sm text-slate-500 mb-4">
                      3 papers free · No credit card required
                    </p>
                    <Link
                      href="/upload"
                      className="inline-block px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
                    >
                      Get started free →
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <ConceptCard key={concept.id} concept={concept} readonly={true} />
            );
          })}
      </div>

      {/* Footer CTA */}
      <div className="bg-indigo-600 py-16 px-6 mt-10">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-indigo-200 text-sm mb-2">Created with</p>
          <h2 className="text-2xl font-extrabold text-white mb-4">Conceptra</h2>
          <p className="text-indigo-200 mb-6">
            Upload your own research paper and get XAI diagrams, clips, notes, and quizzes in 60 seconds.
          </p>
          <Link
            href="/upload"
            className="inline-block px-8 py-4 bg-white text-indigo-600 font-bold rounded-2xl hover:bg-indigo-50 transition-colors shadow-xl"
          >
            Try Conceptra free →
          </Link>
        </div>
      </div>
    </div>
  );
}
