/**
 * GET /api/export/notion/callback?code=xxx&state=paperId
 *
 * Handles the Notion OAuth callback:
 * 1. Exchanges the authorisation code for an access token
 * 2. Fetches the paper + concepts from Supabase
 * 3. Creates a Notion page with all the concepts and notes
 * 4. Redirects the user to the newly created page in Notion
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

interface NotionRichText {
  type: 'text';
  text: { content: string };
  annotations?: { bold?: boolean };
}

function richText(content: string, bold = false): NotionRichText {
  return { type: 'text', text: { content }, ...(bold ? { annotations: { bold: true } } : {}) };
}

function paragraph(text: string) {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: { rich_text: [richText(text)] },
  };
}

function heading2(text: string) {
  return {
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [richText(text)] },
  };
}

function heading3(text: string) {
  return {
    object: 'block',
    type: 'heading_3',
    heading_3: { rich_text: [richText(text)] },
  };
}

function bulletItem(text: string) {
  return {
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: [richText(text)] },
  };
}

function numberedItem(text: string) {
  return {
    object: 'block',
    type: 'numbered_list_item',
    numbered_list_item: { rich_text: [richText(text)] },
  };
}

function divider() {
  return { object: 'block', type: 'divider', divider: {} };
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const paperId = req.nextUrl.searchParams.get('state');
  const error = req.nextUrl.searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(`${appUrl}/paper/${paperId}?notionError=access_denied`);
  }
  if (!code || !paperId) {
    return NextResponse.redirect(`${appUrl}?notionError=missing_params`);
  }

  const clientId = process.env.NOTION_CLIENT_ID!;
  const clientSecret = process.env.NOTION_CLIENT_SECRET!;
  const redirectUri = `${appUrl}/api/export/notion/callback`;

  // ── 1. Exchange code for access token ─────────────────────────
  const tokenRes = await fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error('Notion token exchange failed:', err);
    return NextResponse.redirect(`${appUrl}/paper/${paperId}?notionError=token_failed`);
  }

  const tokenData = await tokenRes.json();
  const accessToken: string = tokenData.access_token;
  const workspaceId: string = tokenData.workspace_id;

  // ── 2. Fetch paper + concepts from Supabase ────────────────────
  const supabase = createAdminClient();
  const { data: paper, error: dbError } = await supabase
    .from('papers')
    .select('title, authors, abstract, concepts(name, one_line, excerpt, notes(*))')
    .eq('id', paperId)
    .single();

  if (dbError || !paper) {
    return NextResponse.redirect(`${appUrl}/paper/${paperId}?notionError=paper_not_found`);
  }

  // ── 3. Build Notion blocks ─────────────────────────────────────
  const blocks: object[] = [];

  // Abstract section
  if (paper.abstract) {
    blocks.push(heading2('Abstract'));
    blocks.push(paragraph(paper.abstract));
    blocks.push(divider());
  }

  // Concepts
  const concepts = (paper.concepts as Array<Record<string, unknown>>) ?? [];
  for (const concept of concepts) {
    const notes = (concept.notes as Array<Record<string, unknown>>)?.[0];

    blocks.push(heading2(concept.name as string));
    blocks.push(paragraph(`📌 ${concept.one_line as string}`));
    blocks.push(paragraph(''));

    if (notes) {
      if (notes.what_it_is) {
        blocks.push(heading3('What it is'));
        blocks.push(paragraph(notes.what_it_is as string));
      }

      const howItWorks = notes.how_it_works as string[] | undefined;
      if (howItWorks?.length) {
        blocks.push(heading3('How it works'));
        howItWorks.forEach((step) => blocks.push(numberedItem(step)));
      }

      if (notes.why_it_matters) {
        blocks.push(heading3('Why it matters'));
        blocks.push(paragraph(notes.why_it_matters as string));
      }

      const misconceptions = notes.misconceptions as string[] | undefined;
      if (misconceptions?.length) {
        blocks.push(heading3('Common misconceptions'));
        misconceptions.forEach((m) => blocks.push(bulletItem(`✗ ${m}`)));
      }
    }

    blocks.push(divider());
  }

  // Notion API max 100 blocks per request — chunk if needed
  const CHUNK_SIZE = 100;

  // ── 4. Create the Notion page ──────────────────────────────────
  const pageRes = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      parent: { workspace: true },
      properties: {
        title: {
          title: [richText(paper.title as string)],
        },
      },
      children: blocks.slice(0, CHUNK_SIZE),
    }),
  });

  if (!pageRes.ok) {
    // Workspace-level creation might be restricted; try searching for an accessible parent
    const searchRes = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ filter: { value: 'page', property: 'object' }, page_size: 1 }),
    });

    if (!searchRes.ok) {
      console.error('Notion page creation failed:', await pageRes.text());
      return NextResponse.redirect(`${appUrl}/paper/${paperId}?notionError=page_creation_failed`);
    }

    const searchData = await searchRes.json();
    const parentPageId = searchData.results?.[0]?.id;
    if (!parentPageId) {
      return NextResponse.redirect(`${appUrl}/paper/${paperId}?notionError=no_accessible_page`);
    }

    const retryRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { page_id: parentPageId },
        properties: { title: { title: [richText(paper.title as string)] } },
        children: blocks.slice(0, CHUNK_SIZE),
      }),
    });

    if (!retryRes.ok) {
      console.error('Notion page creation (retry) failed:', await retryRes.text());
      return NextResponse.redirect(`${appUrl}/paper/${paperId}?notionError=page_creation_failed`);
    }

    const retryPage = await retryRes.json();
    return NextResponse.redirect(retryPage.url);
  }

  const page = await pageRes.json();

  // Append remaining blocks if there were more than 100
  if (blocks.length > CHUNK_SIZE) {
    for (let i = CHUNK_SIZE; i < blocks.length; i += CHUNK_SIZE) {
      await fetch(`https://api.notion.com/v1/blocks/${page.id}/children`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({ children: blocks.slice(i, i + CHUNK_SIZE) }),
      });
    }
  }

  // ── 5. Redirect to the new Notion page ────────────────────────
  return NextResponse.redirect(page.url);
}
