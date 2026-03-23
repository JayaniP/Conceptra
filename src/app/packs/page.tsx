import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase';
import { Plus, Users } from 'lucide-react';

export const metadata = {
  title: 'Concept Packs — Conceptra',
  description: 'Browse and follow curated research concept packs. Get all concepts into your spaced repetition queue with one click.',
};

export default async function PacksPage() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('packs')
    .select('id, title, description, slug, follower_count, created_at, pack_concepts(concept_id)')
    .eq('is_public', true)
    .order('follower_count', { ascending: false })
    .limit(48);

  const packs = (data ?? []).map((p) => ({
    ...p,
    concept_count: p.pack_concepts?.length ?? 0,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-100 px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-bold text-slate-800">Conceptra</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/packs/create" className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors">
            <Plus size={14} /> Create pack
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Concept Packs</h1>
          <p className="text-slate-500 mt-1">
            Curated collections of research concepts. Follow a pack to add all concepts to your daily review queue.
          </p>
        </div>

        {packs.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 border-dashed">
            <p className="text-2xl mb-3">📦</p>
            <p className="font-semibold text-slate-700 mb-2">No packs yet</p>
            <p className="text-sm text-slate-400 mb-6">Be the first to create a concept pack from your papers.</p>
            <Link
              href="/packs/create"
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Create the first pack →
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {packs.map((pack) => (
              <Link
                key={pack.id}
                href={`/packs/${pack.slug}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors leading-snug line-clamp-2">
                    {pack.title}
                  </h2>
                  <span className="flex-shrink-0 text-xs bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">
                    {pack.concept_count} concepts
                  </span>
                </div>
                {pack.description && (
                  <p className="text-sm text-slate-500 line-clamp-2 flex-1">{pack.description}</p>
                )}
                <div className="flex items-center gap-1 mt-4 text-xs text-slate-400">
                  <Users size={12} />
                  <span>{pack.follower_count} follower{pack.follower_count !== 1 ? 's' : ''}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
