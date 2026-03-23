/**
 * POST /api/generate-clip-audio
 * Converts a clip narration script to speech via ElevenLabs
 * and returns the audio as a streaming response so the browser
 * can create an object URL directly.
 *
 * Body: { narration: string, conceptId: string }
 * Returns: audio/mpeg stream  — or  { error } if no API key
 */
import { NextRequest, NextResponse } from 'next/server';
import { textToSpeech } from '@/lib/elevenlabs';

export async function POST(req: NextRequest) {
  const { narration, conceptId: _conceptId } = await req.json();

  if (!narration) {
    return NextResponse.json({ error: 'narration required' }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 503 });
  }

  try {
    const audioBuffer = await textToSpeech(narration, {
      modelId: 'eleven_turbo_v2',
      stability: 0.45,
      similarityBoost: 0.75,
    });

    return new Response(audioBuffer.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.byteLength),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'TTS generation failed';
    console.error('[generate-clip-audio]', msg);
    return NextResponse.json({ error: msg }, { status: 503 }); // 503 = not available
  }
}
