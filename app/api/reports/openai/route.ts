import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { makeFunctionReference } from 'convex/server';
import { fetchPersonalReport } from '@/lib/openai-ads';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const headers = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie, Authorization' };
export async function GET() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return Response.json({ error: 'NOT_CONFIGURED' }, { status: 503, headers });
  const token = await convexAuthNextjsToken();
  if (!token) return Response.json({ error: 'SIGN_IN' }, { status: 401, headers });
  let viewer: { id: string; isOwner: boolean } | null;
  try { viewer = await fetchQuery(makeFunctionReference<'query', Record<string, never>, typeof viewer>('viewer:current'), {}, { token }); }
  catch { return Response.json({ error: 'SIGN_IN' }, { status: 401, headers }); }
  if (!viewer?.isOwner) return Response.json({ error: 'OWNER_ONLY' }, { status: 403, headers });
  try { return Response.json(await fetchPersonalReport(), { headers }); }
  catch (error) {
    const known = ['NOT_CONFIGURED', 'RECONNECT', 'RATE_LIMITED', 'ACCOUNT_MISMATCH', 'INVALID_REPORT', 'INCOMPLETE_REPORT'];
    const code = error instanceof Error && known.includes(error.message) ? error.message : 'PROVIDER_ERROR';
    return Response.json({ error: code }, { status: code === 'RATE_LIMITED' ? 429 : 503, headers });
  }
}
