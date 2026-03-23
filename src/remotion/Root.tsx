// Remotion CLI root — used by `npx remotion studio` and Lambda rendering.
// Not imported by the Next.js app directly; the Player uses ConceptClip directly.

import { Composition } from 'remotion';
import { ConceptClip } from './ConceptClip';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="ConceptClip"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component={ConceptClip as React.ComponentType<any>}
    durationInFrames={2700}   // 90 s × 30 fps
    fps={30}
    width={1080}
    height={1920}             // 9:16 vertical — Reels / Shorts / TikTok
    defaultProps={{ scenes: [], audioUrl: undefined }}
  />
);
