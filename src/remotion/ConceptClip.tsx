import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Html5Audio,
} from 'remotion';
import type { ClipScene, ClipElement } from '@/types';

// ─── Colour palette ────────────────────────────────────────────
const COLORS = {
  teal:   { bg: '#E1F5EE', border: '#0F6E56', text: '#085041' },
  purple: { bg: '#EEEDFE', border: '#5B4FE8', text: '#3C3489' },
  amber:  { bg: '#FAEEDA', border: '#854F0B', text: '#633806' },
  coral:  { bg: '#FAECE7', border: '#993C1D', text: '#712B13' },
  gray:   { bg: '#F1EFE8', border: '#5F5E5A', text: '#2C2C2A' },
} as const;

type ColorKey = keyof typeof COLORS;

// ─── Single animated element ───────────────────────────────────
function Element({ el, elapsed, fps, layout }: {
  el: ClipElement & { value?: string };
  elapsed: number;
  fps: number;
  layout: string;
}) {
  const elStart = (el.animates_in_at || 0) * fps;
  const progress = spring({
    frame: elapsed - elStart,
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const c = COLORS[(el.color as ColorKey)] ?? COLORS.purple;

  if (el.type === 'box') {
    return (
      <div style={{
        background: c.bg,
        border: `2.5px solid ${c.border}`,
        borderRadius: 20,
        padding: '20px 32px',
        fontSize: 28,
        fontWeight: 700,
        color: c.text,
        opacity: progress,
        transform: `scale(${0.7 + 0.3 * progress}) translateY(${(1 - progress) * 20}px)`,
        textAlign: 'center',
        minWidth: 200,
        minHeight: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 4px 20px ${c.border}44`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {el.label}
      </div>
    );
  }

  if (el.type === 'arrow') {
    return (
      <div style={{
        fontSize: 44,
        color: '#5B4FE8',
        opacity: progress,
        fontWeight: 800,
        transform: `scale(${progress})`,
        lineHeight: 1,
        userSelect: 'none',
      }}>
        {layout === 'vertical' ? '↓' : '→'}
      </div>
    );
  }

  if (el.type === 'circle') {
    return (
      <div style={{
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: c.bg,
        border: `3px solid ${c.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 26,
        fontWeight: 700,
        color: c.text,
        opacity: progress,
        transform: `scale(${progress})`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        flexShrink: 0,
      }}>
        {el.label}
      </div>
    );
  }

  if (el.type === 'text_pop') {
    return (
      <div style={{
        fontSize: 72,
        fontWeight: 900,
        color: c.text,
        background: c.bg,
        borderRadius: 24,
        padding: '24px 40px',
        opacity: progress,
        transform: `scale(${0.5 + 0.5 * progress})`,
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        letterSpacing: '-2px',
        boxShadow: `0 4px 20px ${c.border}44`,
      }}>
        {el.label}
      </div>
    );
  }

  if (el.type === 'highlight') {
    return (
      <div style={{
        background: c.bg,
        borderLeft: `6px solid ${c.border}`,
        padding: '20px 28px',
        borderRadius: '0 16px 16px 0',
        fontSize: 30,
        color: c.text,
        opacity: progress,
        transform: `translateX(${interpolate(progress, [0, 1], [-40, 0])}px)`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        width: '100%',
      }}>
        {el.label}
      </div>
    );
  }

  // metric type (value + label stacked)
  if (el.type === ('metric' as string)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: c.bg,
        border: `2px solid ${c.border}`,
        borderRadius: 20,
        padding: '24px 40px',
        opacity: progress,
        transform: `scale(${0.8 + 0.2 * progress})`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: `0 4px 20px ${c.border}44`,
      }}>
        <div style={{ fontSize: 64, fontWeight: 900, color: c.text, lineHeight: 1.1 }}>
          {(el as unknown as { value?: string }).value ?? el.label}
        </div>
        {(el as unknown as { value?: string }).value && (
          <div style={{ fontSize: 24, color: c.border, fontWeight: 600, marginTop: 4 }}>
            {el.label}
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ─── Single scene ──────────────────────────────────────────────
function Scene({ scene, fps }: { scene: ClipScene & { layout?: string }; fps: number }) {
  const frame = useCurrentFrame();
  const elapsed = frame - scene.start_second * fps;
  const layout = (scene as unknown as { layout?: string }).layout ?? 'horizontal';
  const isVertical = layout === 'vertical';

  return (
    <AbsoluteFill style={{
      background: '#0F0F1A',
      padding: '48px 32px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>

      {/* TOP: Conceptra pill + scene heading label */}
      <div style={{
        opacity: interpolate(elapsed, [0, 10], [0, 1], { extrapolateRight: 'clamp' }),
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          background: '#5B4FE8',
          borderRadius: 20,
          padding: '6px 16px',
          fontSize: 20,
          color: '#fff',
          fontWeight: 700,
          letterSpacing: '-0.3px',
        }}>
          Conceptra
        </div>
        <div style={{
          color: '#8888A8',
          fontSize: 18,
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: 520,
        }}>
          {scene.heading}
        </div>
      </div>

      {/* MIDDLE: Heading + body + elements */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 28,
        marginTop: 36,
        marginBottom: 36,
        overflow: 'hidden',
      }}>
        {/* Big heading */}
        <div style={{
          fontSize: 58,
          fontWeight: 800,
          color: '#FFFFFF',
          lineHeight: 1.15,
          letterSpacing: '-1.5px',
          opacity: interpolate(elapsed, [5, 20], [0, 1], { extrapolateRight: 'clamp' }),
          transform: `translateY(${interpolate(elapsed, [5, 20], [40, 0], { extrapolateRight: 'clamp' })}px)`,
        }}>
          {scene.heading}
        </div>

        {/* Body text */}
        {scene.body_text && (
          <div style={{
            fontSize: 30,
            color: '#B0B0C0',
            lineHeight: 1.6,
            opacity: interpolate(elapsed, [15, 30], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            {scene.body_text}
          </div>
        )}

        {/* Animated elements */}
        {scene.elements?.length > 0 && (
          <div style={{
            display: 'flex',
            flexDirection: isVertical ? 'column' : 'row',
            gap: 16,
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: isVertical ? 'nowrap' : 'wrap',
            marginTop: 8,
            opacity: interpolate(elapsed, [20, 35], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
            {scene.elements.map((el, i) => (
              <Element
                key={i}
                el={el as ClipElement & { value?: string }}
                elapsed={elapsed}
                fps={fps}
                layout={layout}
              />
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM: Narration subtitle pill */}
      {scene.narration_segment && (
        <div style={{
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '16px 20px',
          fontSize: 22,
          color: '#D0D0E0',
          lineHeight: 1.5,
          opacity: interpolate(elapsed, [25, 40], [0, 1], { extrapolateRight: 'clamp' }),
          flexShrink: 0,
        }}>
          {scene.narration_segment}
        </div>
      )}

      {/* Watermark */}
      <div style={{
        textAlign: 'right',
        fontSize: 20,
        color: '#5B4FE8',
        fontWeight: 700,
        opacity: 0.8,
        marginTop: 8,
        flexShrink: 0,
      }}>
        conceptra.ai
      </div>

    </AbsoluteFill>
  );
}

// ─── Main composition ──────────────────────────────────────────
export interface ConceptClipProps {
  scenes: ClipScene[];
  audioUrl?: string;
}

export function ConceptClip({ scenes, audioUrl }: ConceptClipProps) {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  if (!scenes || scenes.length === 0) {
    return (
      <AbsoluteFill style={{ background: '#0F0F1A', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 40, color: '#8888A8', fontFamily: 'system-ui, sans-serif' }}>
          No scenes
        </div>
      </AbsoluteFill>
    );
  }

  const currentScene = scenes.find(
    (s) => frame >= s.start_second * fps && frame < s.end_second * fps
  ) ?? scenes[scenes.length - 1];

  const sceneStart = currentScene.start_second * fps;
  const fadeOpacity = interpolate(frame - sceneStart, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      {audioUrl && <Html5Audio src={audioUrl} />}
      <AbsoluteFill style={{ opacity: fadeOpacity }}>
        <Scene scene={currentScene} fps={fps} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
