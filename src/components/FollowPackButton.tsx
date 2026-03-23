'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface FollowPackButtonProps {
  packSlug: string;
  initialFollowing: boolean;
  conceptCount: number;
}

// Demo userId — replace with real auth session
function getUserId(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('userId') ?? '';
}

export function FollowPackButton({ packSlug, initialFollowing, conceptCount }: FollowPackButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const userId = getUserId();

  async function handleFollow() {
    if (!userId) {
      window.location.href = '/upload';
      return;
    }
    setLoading(true);
    try {
      const method = following ? 'DELETE' : 'POST';
      const res = await fetch(`/api/packs/${packSlug}/follow`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      if (res.ok) {
        setFollowing(!following);
        if (!following) setDone(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex-shrink-0 px-5 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl text-center">
        ✓ {conceptCount} concepts added to your review queue
      </div>
    );
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={cn(
        'flex-shrink-0 px-5 py-2.5 text-sm font-bold rounded-xl transition-colors',
        following
          ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
      )}
    >
      {loading ? '…' : following ? 'Following ✓' : `Follow pack — add ${conceptCount} concepts`}
    </button>
  );
}
