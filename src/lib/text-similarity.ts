/**
 * Simple Jaccard-based text similarity for concept linking.
 * Production upgrade: replace with OpenAI text-embedding-3-small + pgvector.
 */

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)   // skip very short words
  );
}

/**
 * Jaccard similarity between two strings.
 * Returns 0–1 (1 = identical token sets).
 */
export function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

/**
 * Compute similarity between two concept descriptors.
 * Uses both name and one_line for richer matching.
 */
export function conceptSimilarity(
  a: { name: string; one_line?: string | null },
  b: { name: string; one_line?: string | null }
): number {
  const textA = `${a.name} ${a.one_line ?? ''}`;
  const textB = `${b.name} ${b.one_line ?? ''}`;

  // Boost exact or near-exact name matches
  const nameSim = jaccardSimilarity(a.name, b.name);
  const fullSim = jaccardSimilarity(textA, textB);

  return Math.max(nameSim * 0.7 + fullSim * 0.3, fullSim);
}
