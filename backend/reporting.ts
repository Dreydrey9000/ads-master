import { makeFunctionReference } from 'convex/server';
import { query, internalMutation, httpAction } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { isReportOwner } from '../lib/report-access';
import { retainedSnapshot, validateUpdates, type DashboardSource, type ReportUpdate } from '../lib/dashboard-report';
import { authorizedSync, boundedBody } from '../lib/sync-security';

export const dashboard = query({
  args: { businessId: v.union(v.literal('1bb'), v.literal('drey-personal')) },
  handler: async (ctx, { businessId }): Promise<DashboardSource[] | null> => {
    const id = await getAuthUserId(ctx); if (!id) return null;
    const user = await ctx.db.get(id);
    if (!isReportOwner(user?.email?.toLowerCase(), process.env.AUTH_OWNER_EMAIL?.toLowerCase())) return null;
    const rows = await ctx.db.query('reportSnapshots').withIndex('by_business', q => q.eq('businessId',businessId)).take(8);
    return rows.map(r => ({ businessId: r.businessId, provider: r.provider, attemptedAt: r.attemptedAt, error: r.error, ...(r.data ? { data: r.data } : {}) }));
  },
});
export const save = internalMutation({ args: { updates: v.any() }, handler: async (ctx, args) => {
  const updates = validateUpdates(args.updates);
  const attemptedAt = new Date().toISOString();
  for (const item of updates) {
    const old = await ctx.db.query('reportSnapshots').withIndex('by_business_provider', q => q.eq('businessId',item.businessId).eq('provider',item.provider)).unique();
    const value = retainedSnapshot(old?.data, item, attemptedAt);
    if (!value) continue;
    if (old) await ctx.db.patch(old._id,value); else await ctx.db.insert('reportSnapshots',value);
  }
  return { saved: updates.length };
} });
export const ingest = httpAction(async (ctx, req) => {
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!authorizedSync(req.headers.get('authorization'), process.env.REPORT_SYNC_SECRET)) return Response.json({ error: 'UNAUTHORIZED' }, { status: 401, headers });
  let updates: ReportUpdate[];
  try { updates = validateUpdates(await boundedBody(req)); } catch { return Response.json({ error: 'INVALID_REPORT' }, { status: 400, headers }); }
  const result = await ctx.runMutation(makeFunctionReference<'mutation', { updates: ReportUpdate[] }, { saved: number }>('reporting:save'), { updates });
  return Response.json(result,{ headers });
});
