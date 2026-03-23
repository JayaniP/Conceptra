import Anthropic from '@anthropic-ai/sdk';

// Singleton client
let client: Anthropic | null = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
    client = new Anthropic({ apiKey });
  }
  return client;
}

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
const MIN_INTERVAL_MS = Number.parseInt(
  process.env.ANTHROPIC_MIN_REQUEST_INTERVAL_MS ?? '0',
  10
);
let lastRequestAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err: unknown) {
  if (!err) return false;
  const message =
    typeof err === 'string'
      ? err
      : err instanceof Error
        ? err.message
        : JSON.stringify(err);
  return /429|Too Many Requests|quota|rate limit|overloaded/i.test(message);
}

async function generateText(
  system: string,
  user: string,
  maxTokens: number,
  temperature = 0.2
): Promise<string> {
  if (Number.isFinite(MIN_INTERVAL_MS) && MIN_INTERVAL_MS > 0) {
    const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
  }

  const maxRetries = 2;
  let attempt = 0;
  while (true) {
    attempt++;
    lastRequestAt = Date.now();
    try {
      const msg = await getClient().messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
        temperature,
      });
      const block = msg.content[0];
      return block.type === 'text' ? block.text : '';
    } catch (err) {
      if (!isRetryableError(err) || attempt > maxRetries) throw err;
      await sleep((attempt + 1) * 2000);
    }
  }
}

function repairJson(text: string) {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/,\s*([}\]])/g, '$1');
}

function extractJsonCandidate(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const startsWithJson = /^[{\[]/.test(trimmed);
  const endsWithJson = /[}\]]$/.test(trimmed);
  if (startsWithJson && endsWithJson) return trimmed;

  const firstObj = trimmed.indexOf('{');
  const lastObj = trimmed.lastIndexOf('}');
  const firstArr = trimmed.indexOf('[');
  const lastArr = trimmed.lastIndexOf(']');

  const objCandidate = firstObj !== -1 && lastObj > firstObj
    ? trimmed.slice(firstObj, lastObj + 1)
    : null;
  const arrCandidate = firstArr !== -1 && lastArr > firstArr
    ? trimmed.slice(firstArr, lastArr + 1)
    : null;

  return objCandidate ?? arrCandidate;
}

function cleanJson(text: string) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  const attempts = [cleaned, repairJson(cleaned)];

  const candidate = extractJsonCandidate(cleaned);
  if (candidate) {
    attempts.push(candidate, repairJson(candidate));
  }

  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch {
      // keep trying
    }
  }

  throw new Error('Anthropic response did not contain valid JSON');
}

/**
 * Call Anthropic and expect a JSON response.
 */
export async function callAnthropicJSON<T>(
  system: string,
  user: string,
  maxTokens = 2048
): Promise<T> {
  let text = await generateText(system, user, maxTokens, 0.2);

  if (!text?.trim()) throw new Error('Anthropic response was empty');

  try {
    return cleanJson(text) as T;
  } catch {
    // Retry once with stricter instructions
    const retryUser = `${user}\n\nReturn ONLY valid JSON. No markdown, no commentary.`;
    text = await generateText(system, retryUser, maxTokens, 0.1);

    if (!text?.trim()) throw new Error('Anthropic response was empty');

    try {
      return cleanJson(text) as T;
    } catch {
      const snippet = text.slice(0, 300).replace(/\s+/g, ' ');
      throw new Error(`Anthropic response did not contain valid JSON. Snippet: ${snippet}`);
    }
  }
}

/**
 * Call Anthropic and return raw text response.
 */
export async function callAnthropicText(
  system: string,
  user: string,
  maxTokens = 2048
): Promise<string> {
  return generateText(system, user, maxTokens);
}
