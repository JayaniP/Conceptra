/**
 * GET /api/export?paperId=xxx&format=markdown|anki
 * Exports concept notes in the requested format.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const paperId = req.nextUrl.searchParams.get('paperId');
  const format = req.nextUrl.searchParams.get('format') ?? 'markdown';

  if (!paperId) return NextResponse.json({ error: 'paperId required' }, { status: 400 });

  const supabase = createAdminClient();
  const { data: paper, error } = await supabase
    .from('papers')
    .select('title, authors, abstract, concepts(name, one_line, excerpt, notes(*))')
    .eq('id', paperId)
    .single();

  if (error) return NextResponse.json({ error: 'Paper not found' }, { status: 404 });

  if (format === 'markdown') {
    const lines: string[] = [
      `# ${paper.title}`,
      '',
      paper.authors?.length ? `**Authors:** ${(paper.authors as string[]).join(', ')}` : '',
      '',
      `## Abstract`,
      paper.abstract ?? '',
      '',
      `---`,
      '',
    ];

    for (const concept of (paper.concepts as Array<Record<string, unknown>>) ?? []) {
      const notes = (concept.notes as Array<Record<string, unknown>>)?.[0];
      lines.push(`## ${concept.name as string}`);
      lines.push(`*${concept.one_line as string}*`);
      lines.push('');
      if (notes) {
        lines.push(`### What it is`);
        lines.push(notes.what_it_is as string ?? '');
        lines.push('');
        lines.push(`### How it works`);
        ((notes.how_it_works as string[]) ?? []).forEach((s, i) => lines.push(`${i + 1}. ${s}`));
        lines.push('');
        lines.push(`### Why it matters`);
        lines.push(notes.why_it_matters as string ?? '');
        lines.push('');
        if ((notes.misconceptions as string[])?.length) {
          lines.push(`### Common misconceptions`);
          ((notes.misconceptions as string[]) ?? []).forEach((m) => lines.push(`- ✗ ${m}`));
          lines.push('');
        }
      }
      lines.push('---');
      lines.push('');
    }

    const markdown = lines.join('\n');
    return new Response(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="conceptra-${paperId}.md"`,
      },
    });
  }

  // Anki CSV format (simple — proper .apkg requires a Python sidecar)
  if (format === 'anki') {
    const rows: string[] = ['Front\tBack'];
    for (const concept of (paper.concepts as Array<Record<string, unknown>>) ?? []) {
      const notes = (concept.notes as Array<Record<string, unknown>>)?.[0];
      if (!notes) continue;
      const front = `${concept.name as string}: ${concept.one_line as string}`;
      const back = [
        `<b>What it is:</b> ${notes.what_it_is as string}`,
        `<b>How it works:</b> ${((notes.how_it_works as string[]) ?? []).map((s, i) => `${i + 1}. ${s}`).join(' ')}`,
        `<b>Why it matters:</b> ${notes.why_it_matters as string}`,
      ].join('<br><br>');
      rows.push(`${front}\t${back}`);
    }

    return new Response(rows.join('\n'), {
      headers: {
        'Content-Type': 'text/tab-separated-values; charset=utf-8',
        'Content-Disposition': `attachment; filename="conceptra-${paperId}-anki.txt"`,
      },
    });
  }

  return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
}
