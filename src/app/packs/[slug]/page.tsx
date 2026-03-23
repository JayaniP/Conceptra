import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase';
import { ConceptCard } from '@/components/ConceptCard';
import { FollowPackButton } from '@/components/FollowPackButton';
import type { Concept } from '@/types';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('packs')
    .select('title, description')
    .eq('slug', params.slug)
    .single();

  const title = data ? `${data.title} — Conceptra Pack` : 'Concept Pack — Conceptra';
  return { title, description: data?.description ?? 'A curated concept pack on Conceptra.' };
}

export default async function PackDetailPage({ params }: PageProps) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('packs')
    .select(`
      *,
      pack_concepts (
        position,
        concept:concepts (
          id, name, one_line, svg_visual, excerpt, importance_rank,
          notes (*),
          quiz_questions (*)
        )
      )
    `)
    .eq('slug', params.slug)
    .eq('is_public', true)
    .single();

  if (error || !data) notFound();

  // Increment view count
  await supabase.from('packs').update({ view_count: data.view_count + 1 }).eq('id', data.id);

  // Sort concepts by position
  const packConcepts = [...(data.pack_concepts ?? [])].sort(
    (a: { position: number }, b: { position: number }) => a.position - b.position
  );
  const concepts = packConcepts.map(
    (pc: { concept: Concept }) => pc.concept
  ).filter(Boolean) as Concept[];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Branding banner */}
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

      {/* Pack header */}
      <header className="bg-white border-b border-slate-100 py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs text-indigo-500 font-semibold uppercase tracking-wider mb-2">
            Concept Pack · {concepts.length} concepts
          </div>
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 mb-1">{data.title}</h1>
              {data.description && (
                <p className="text-sm text-slate-500 max-w-2xl">{data.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                <span>👥 {data.follower_count} follower{data.follower_count !== 1 ? 's' : ''}</span>
                <span>👁 {data.view_count} views</span>
              </div>
            </div>
            {/* Follow button — client component */}
            <FollowPackButton
              packSlug={params.slug}
              initialFollowing={false}
              conceptCount={concepts.length}
            />
          </div>
        </div>
      </header>

      {/* Concepts */}
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        {concepts.map((concept, index) => {
          const isGated = index >= 2;
          return isGated ? (
            <div key={concept.id} className="relative rounded-3xl overflow-hidden">
              <div className="blur-sm pointer-events-none">
                <ConceptCard concept={concept} readonly />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/70 to-transparent flex items-end justify-center pb-10">
                <div className="text-center">
                  <p className="font-bold text-slate-900 text-lg mb-2">
                    Follow this pack to unlock all {concepts.length} concepts
                  </p>
                  <p className="text-sm text-slate-500 mb-4">Free — adds all concepts to your daily review queue</p>
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
            <ConceptCard key={concept.id} concept={concept} readonly />
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="bg-indigo-600 py-16 px-6 mt-10">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-indigo-200 text-sm mb-2">Learn anything. Remember everything.</p>
          <h2 className="text-2xl font-extrabold text-white mb-4">Conceptra</h2>
          <p className="text-indigo-200 mb-6">
            Upload any research paper. Get XAI diagrams, animated clips, notes, quizzes, and a spaced repetition queue — in 60 seconds.
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
