/**
 * ElevenLabs TTS integration for Conceptra narration clips
 */

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? '21m00Tcm4TlvDq8ikWAM'; // Rachel

export interface TTSOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}

/**
 * Convert text to speech using ElevenLabs and return audio as Buffer.
 */
export async function textToSpeech(text: string, options: TTSOptions = {}): Promise<Buffer> {
  const {
    voiceId = DEFAULT_VOICE_ID,
    modelId = 'eleven_turbo_v2',
    stability = 0.5,
    similarityBoost = 0.75,
  } = options;

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not set');

  const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: { stability, similarity_boost: similarityBoost },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error ${response.status}: ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Upload audio buffer to Supabase Storage and return the public URL.
 */
export async function uploadAudioToSupabase(
  supabaseAdmin: ReturnType<typeof import('./supabase').createAdminClient>,
  audioBuffer: Buffer,
  conceptId: string
): Promise<string> {
  const fileName = `audio/${conceptId}.mp3`;

  const { error } = await supabaseAdmin.storage
    .from('conceptra-assets')
    .upload(fileName, audioBuffer, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

  if (error) throw new Error(`Supabase storage upload failed: ${error.message}`);

  const { data } = supabaseAdmin.storage.from('conceptra-assets').getPublicUrl(fileName);
  return data.publicUrl;
}
