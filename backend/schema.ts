import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';
export default defineSchema({ ...authTables,
  reportSnapshots: defineTable({
    businessId: v.union(v.literal('1bb'),v.literal('drey-personal')),
    provider: v.union(v.literal('openai'),v.literal('meta'),v.literal('google'),v.literal('stripe'),v.literal('posthog')),
    attemptedAt: v.string(), error: v.union(v.string(),v.null()),
    data: v.optional(v.object({ since: v.string(), until: v.string(), timezone: v.string(), checkedAt: v.string(), metric: v.union(v.literal('spend'),v.literal('captured'),v.literal('pageviews')), currency: v.optional(v.literal('USD')), rows: v.array(v.object({ date: v.string(), value: v.number(), clicks: v.optional(v.number()), impressions: v.optional(v.number()), refunded: v.optional(v.number()) })) })),
  }).index('by_business',['businessId']).index('by_business_provider',['businessId','provider']),
});
