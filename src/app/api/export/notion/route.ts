/**
 * GET /api/export/notion?paperId=xxx
 *
 * Initiates the Notion OAuth flow. After the user grants access,
 * Notion redirects to /api/export/notion/callback with a code.
 *
 * Setup required in your Notion integration settings:
 *   Redirect URI: {NEXT_PUBLIC_APP_URL}/api/export/notion/callback
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const paperId = req.nextUrl.searchParams.get('paperId');
  if (!paperId) {
    return NextResponse.json({ error: 'paperId required' }, { status: 400 });
  }

  const clientId = process.env.NOTION_CLIENT_ID;
  if (!clientId || clientId === '...') {
    return NextResponse.json(
      { error: 'Notion integration not configured. Set NOTION_CLIENT_ID in your environment.' },
      { status: 503 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const redirectUri = `${appUrl}/api/export/notion/callback`;

  const authUrl = new URL('https://api.notion.com/v1/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('owner', 'user');
  authUrl.searchParams.set('state', paperId);

  return NextResponse.redirect(authUrl.toString());
}
