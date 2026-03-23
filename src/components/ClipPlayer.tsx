'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { Download } from 'lucide-react';
import { ConceptClip } from '@/remotion/ConceptClip';
import type { ClipScript } from '@/types';

interface ClipPlayerProps {
  conceptId: string;
  conceptName: string;
  audioUrl?: string | null;
  conceptNotes?: {
    how_it_works?: string[] | null;
    why_it_matters?: string | null;
  } | null;
}

type AudioState = 'idle' | 'loading' | 'ready' | 'browser' | 'unavailable';

const FPS = 30;

export function ClipPlayer({ conceptId, conceptName, audioUrl: conceptAudioUrl, conceptNotes }: ClipPlayerProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [clipScript, setClipScript] = useState<ClipScript | null>(null);
  const [error, setError] = useState('');

  const [clipAudioUrl, setClipAudioUrl] = useState<string | null>(null);
  const [audioState, setAudioState] = useState<AudioState>('idle');

  const audioBlobRef = useRef<string | null>(null);
  const playerRef = useRef<PlayerRef>(null);

  // Auto-generate on mount
  useEffect(() => {
    generateClip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (audioBlobRef.current) URL.revokeObjectURL(audioBlobRef.current);
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    };
  }, []);

  // ── Web Speech API fallback ─────────────────────────────────
  // When ElevenLabs is unavailable, hook into the Player's play/pause/ended
  // events and drive speechSynthesis in lockstep.
  const narrationRef = useRef<string>('');

  const speakNarration = useCallback(() => {
    if (!narrationRef.current || typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(narrationRef.current);
    u.rate = 0.95;
    u.pitch = 1.0;
    // Pick a natural-sounding voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium'))
    ) ?? voices.find((v) => v.lang.startsWith('en'));
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  }, []);

  useEffect(() => {
    if (audioState !== 'browser' || !playerRef.current) return;

    const player = playerRef.current;

    const onPlay = () => speakNarration();
    const onPause = () => window.speechSynthesis?.pause();
    const onEnded = () => window.speechSynthesis?.cancel();
    const onSeeked = () => {
      window.speechSynthesis?.cancel();
      if (player.isPlaying()) speakNarration();
    };

    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);
    player.addEventListener('ended', onEnded);
    player.addEventListener('seeked', onSeeked);

    return () => {
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
      player.removeEventListener('ended', onEnded);
      player.removeEventListener('seeked', onSeeked);
      window.speechSynthesis?.cancel();
    };
  }, [audioState, speakNarration]);

  // ── Generate scenes ─────────────────────────────────────────
  async function generateClip() {
    if (!conceptNotes) {
      setError('Notes are not yet available for this concept. Please wait for processing to complete.');
      return;
    }
    setState('loading');
    setError('');
    setClipAudioUrl(null);
    setAudioState('idle');
    if (audioBlobRef.current) { URL.revokeObjectURL(audioBlobRef.current); audioBlobRef.current = null; }

    try {
      const res = await fetch('/api/generate-clip-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept_name: conceptName,
          how_it_works: conceptNotes.how_it_works ?? [],
          why_it_matters: conceptNotes.why_it_matters ?? '',
        }),
      });

      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg ?? 'Scene generation failed');
      }

      const script: ClipScript = await res.json();
      setClipScript(script);
      narrationRef.current = script.narration ?? '';
      setState('ready');

      // Kick off audio generation — non-blocking
      generateAudio(script.narration, conceptId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate clip. Try again.');
      setState('idle');
    }
  }

  async function generateAudio(narration: string, conceptId: string) {
    // 1. Use existing concept audio if available
    if (conceptAudioUrl) {
      setClipAudioUrl(conceptAudioUrl);
      setAudioState('ready');
      return;
    }

    setAudioState('loading');

    try {
      const res = await fetch('/api/generate-clip-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ narration, conceptId }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        audioBlobRef.current = blobUrl;
        setClipAudioUrl(blobUrl);
        setAudioState('ready');
        return;
      }
    } catch { /* fall through to browser TTS */ }

    // 2. Browser speech synthesis fallback — always available, no API key needed
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setAudioState('browser');
    } else {
      setAudioState('unavailable');
    }
  }

  // ── Idle ─────────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-4 text-center bg-slate-50 rounded-2xl border border-slate-200">
        {error && (
          <p className="text-sm text-rose-600 max-w-xs bg-rose-50 rounded-xl px-4 py-2">{error}</p>
        )}
        <button
          onClick={generateClip}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-4 bg-slate-50 rounded-2xl border border-slate-200">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">Writing scene script…</p>
          <p className="text-xs text-slate-400 mt-1">Gemini is composing your animated scenes</p>
        </div>
      </div>
    );
  }

  // ── Ready ────────────────────────────────────────────────────
  const durationInFrames = Math.ceil((clipScript!.total_duration_seconds ?? 90) * FPS);

  return (
    <div className="space-y-4">
      {/* Phone frame */}
      <div className="flex justify-center">
        <div
          className="relative rounded-[2rem] overflow-hidden border-[3px] border-slate-800 shadow-2xl bg-black"
          style={{ width: 300 }}
        >
          <Player
            ref={playerRef}
            component={ConceptClip}
            inputProps={{
              scenes: clipScript!.scenes,
              // Only pass audioUrl when using ElevenLabs audio; browser TTS is handled by events
              audioUrl: audioState === 'ready' ? (clipAudioUrl ?? undefined) : undefined,
            }}
            durationInFrames={durationInFrames}
            fps={FPS}
            compositionWidth={1080}
            compositionHeight={1920}
            style={{ width: '100%', display: 'block' }}
            controls
            loop
          />
        </div>
      </div>

      {/* Audio status */}
      <div className="flex items-center justify-center text-xs">
        {audioState === 'loading' && (
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-3 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin inline-block" />
            Generating voice narration…
          </span>
        )}
        {audioState === 'ready' && (
          <span className="text-teal-600 font-medium">🔊 Voice narration ready — press play</span>
        )}
        {audioState === 'browser' && (
          <span className="text-indigo-600 font-medium">🔊 Browser voice — press play to hear narration</span>
        )}
        {audioState === 'unavailable' && (
          <span className="text-slate-400">
            🔇 Add <code className="bg-slate-100 px-1 rounded">ELEVENLABS_API_KEY</code> for voice
          </span>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => {
            if (audioBlobRef.current) { URL.revokeObjectURL(audioBlobRef.current); audioBlobRef.current = null; }
            window.speechSynthesis?.cancel();
            setClipScript(null);
            setClipAudioUrl(null);
            setAudioState('idle');
            setState('idle');
          }}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          ↺ Regenerate
        </button>
        <button
          onClick={() => alert('MP4 download via Remotion Lambda is coming soon. For now, use screen recording to capture the clip above.')}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Download size={12} /> Download as Reel
        </button>
      </div>

      {/* Narration script */}
      {clipScript?.narration && (
        <details className="mt-1">
          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 select-none">
            Show narration script ↓
          </summary>
          <p className="mt-2 text-sm text-slate-600 italic leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-200">
            &ldquo;{clipScript.narration}&rdquo;
          </p>
        </details>
      )}
    </div>
  );
}
