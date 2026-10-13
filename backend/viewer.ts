import { queryGeneric } from 'convex/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { isReportOwner } from '../lib/report-access';
export const current = queryGeneric({ args: {}, handler: async ctx => {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  const user = await ctx.db.get(userId);
  const owner = process.env.AUTH_OWNER_EMAIL;
  return { id: userId, isOwner: isReportOwner(user?.email?.toLowerCase(), owner?.toLowerCase()) };
} });
