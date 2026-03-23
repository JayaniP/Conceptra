/**
 * PDF Parser utilities for Conceptra
 */

export interface ParsedPaper {
  title: string;
  authors: string[];
  abstract: string;
  fullText: string;
  pageCount: number;
}

/**
 * Extract text from a PDF Buffer.
 */
export async function parsePdf(buffer: Buffer): Promise<ParsedPaper> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>;
  const data = await pdfParse(buffer);
  const text = data.text || '';
  const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);

  const title = lines[0]?.slice(0, 200) ?? 'Untitled Paper';

  const abstractStart = text.toLowerCase().indexOf('abstract');
  const introStart = text.toLowerCase().indexOf('introduction');
  let abstract = '';
  if (abstractStart !== -1) {
    const end = introStart !== -1 ? introStart : abstractStart + 1500;
    abstract = text.slice(abstractStart + 8, end).trim().slice(0, 1500);
  }

  const fullText = text.slice(0, 30000);

  return {
    title,
    authors: [],
    abstract,
    fullText,
    pageCount: data.numpages ?? 0,
  };
}

/** Download a URL and validate that the response is actually a PDF. */
async function fetchPdfBuffer(url: string, label: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Conceptra/1.0; +https://conceptra.ai)',
      Accept: 'application/pdf,*/*',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`${label}: server returned ${res.status} ${res.statusText}`);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
    // Some hosts return text/html for paywalled papers — give a clear error
    throw new Error(
      `${label}: the URL did not return a PDF (got "${contentType}"). ` +
      'The paper may be behind a paywall or the URL may be incorrect.'
    );
  }

  return Buffer.from(await res.arrayBuffer());
}

/**
 * Fetch a PDF from an arXiv URL.
 * Supports:
 *   https://arxiv.org/abs/2307.09288
 *   https://arxiv.org/abs/2307.09288v2
 *   https://arxiv.org/pdf/2307.09288
 *   https://arxiv.org/pdf/2307.09288.pdf
 *   https://arxiv.org/abs/cs.LG/0612054   (old-style)
 */
export async function fetchArxivPdf(url: string): Promise<{ buffer: Buffer; arxivId: string }> {
  // Extract arXiv ID from any known URL shape
  const idMatch =
    url.match(/arxiv\.org\/(?:abs|pdf)\/([0-9]+\.[0-9]+)(?:v\d+)?/) ??
    url.match(/arxiv\.org\/(?:abs|pdf)\/([a-zA-Z.-]+\/[0-9]+)(?:v\d+)?/);

  if (!idMatch) {
    throw new Error(
      'Could not parse an arXiv ID from that URL. ' +
      'Expected format: https://arxiv.org/abs/2307.09288'
    );
  }

  const arxivId = idMatch[1];
  // Try the canonical PDF URL (no .pdf extension — arXiv prefers this now)
  const pdfUrl = `https://arxiv.org/pdf/${arxivId}`;

  const buffer = await fetchPdfBuffer(pdfUrl, `arXiv ${arxivId}`);
  return { buffer, arxivId };
}

/**
 * Resolve a DOI to an open-access PDF buffer.
 * Strategy:
 *   1. Unpaywall API (most reliable for OA papers)
 *   2. Semantic Scholar API (covers many CS/bio papers)
 *   3. Direct doi.org redirect (works if publisher serves PDF directly)
 */
export async function resolveDoi(doi: string): Promise<string> {
  const cleanDoi = doi.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');

  // ── 1. Unpaywall ──────────────────────────────────────────────
  try {
    const uw = await fetch(
      `https://api.unpaywall.org/v2/${encodeURIComponent(cleanDoi)}?email=contact@conceptra.ai`
    );
    if (uw.ok) {
      const data = await uw.json();
      const pdfUrl: string | undefined = data.best_oa_location?.url_for_pdf;
      if (pdfUrl) return pdfUrl;
    }
  } catch { /* try next strategy */ }

  // ── 2. Semantic Scholar ───────────────────────────────────────
  try {
    const ss = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(cleanDoi)}?fields=openAccessPdf`,
      { headers: { Accept: 'application/json' } }
    );
    if (ss.ok) {
      const data = await ss.json();
      const pdfUrl: string | undefined = data.openAccessPdf?.url;
      if (pdfUrl) return pdfUrl;
    }
  } catch { /* try next strategy */ }

  // ── 3. doi.org redirect ───────────────────────────────────────
  // Some publishers (PLOS, eLife, bioRxiv) redirect doi.org straight to a PDF
  const doiUrl = `https://doi.org/${cleanDoi}`;
  const probe = await fetch(doiUrl, {
    method: 'HEAD',
    headers: {
      Accept: 'application/pdf',
      'User-Agent': 'Mozilla/5.0 (compatible; Conceptra/1.0)',
    },
    redirect: 'follow',
  });
  const ct = probe.headers.get('content-type') ?? '';
  if (probe.ok && ct.includes('pdf')) return probe.url;

  throw new Error(
    `No open-access PDF found for DOI "${cleanDoi}". ` +
    'This paper may be behind a paywall. Try uploading the PDF directly.'
  );
}

/**
 * Download a DOI-resolved PDF and return the buffer.
 * Called from process-paper/route.ts.
 */
export async function fetchDoiPdf(doi: string): Promise<{ buffer: Buffer }> {
  const pdfUrl = await resolveDoi(doi);
  const buffer = await fetchPdfBuffer(pdfUrl, `DOI ${doi}`);
  return { buffer };
}
