import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const platform = v.union(
  v.literal("meta"), v.literal("google"), v.literal("tiktok"),
  v.literal("linkedin"), v.literal("openai"), v.literal("youtube"),
);
export const verdict = v.union(v.literal("good"), v.literal("bad"), v.literal("ugly"));
export const stage = v.union(v.literal("lead"), v.literal("booked"), v.literal("showed"), v.literal("closed"));

export default defineSchema({
  businesses: defineTable({
    slug: v.string(),
    name: v.string(),
    industry: v.string(),
    emoji: v.optional(v.string()),
    platforms: v.array(platform),
    sales: v.optional(v.object({
      enabled: v.boolean(),
      avgDealSize: v.optional(v.number()),
      goalMonthly: v.optional(v.number()),
    })),
  }).index("by_slug", ["slug"]),

  // One row per connected ad account. Secrets live in `credentials`, never here.
  adAccounts: defineTable({
    businessId: v.id("businesses"),
    platform,
    externalId: v.string(), // e.g. act_123 for Meta, the ChatGPT Ads account id
    name: v.optional(v.string()),
    status: v.union(v.literal("connected"), v.literal("error"), v.literal("syncing")),
    lastSyncedAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
  }).index("by_business", ["businessId"]),

  // Write-only from the client. Only internal functions read these.
  credentials: defineTable({
    adAccountId: v.id("adAccounts"),
    token: v.string(),
  }).index("by_account", ["adAccountId"]),

  metricsDaily: defineTable({
    businessId: v.id("businesses"),
    adAccountId: v.id("adAccounts"),
    platform,
    date: v.string(), // YYYY-MM-DD
    spend: v.number(),
    revenue: v.number(),
    impressions: v.number(),
    clicks: v.number(),
    conversions: v.number(),
  })
    .index("by_business_date", ["businessId", "date"])
    .index("by_account_date", ["adAccountId", "date"]),

  ads: defineTable({
    businessId: v.id("businesses"),
    adAccountId: v.id("adAccounts"),
    platform,
    externalId: v.string(),
    name: v.string(),
    format: v.string(),
    spend: v.number(),
    revenue: v.number(),
    ctr: v.number(),
    conversions: v.number(),
    updatedAt: v.number(),
  })
    .index("by_business", ["businessId"])
    .index("by_account_external", ["adAccountId", "externalId"]),

  insights: defineTable({
    businessId: v.id("businesses"),
    createdAt: v.number(),
    source: v.union(v.literal("ai"), v.literal("rules")),
    items: v.array(v.object({
      verdict,
      title: v.string(),
      detail: v.string(),
      action: v.string(),
      platform: v.optional(platform),
    })),
  }).index("by_business", ["businessId", "createdAt"]),

  // Leads → Booked → Showed → Closed, from the app, a CRM, or the /sales-event webhook.
  salesEvents: defineTable({
    businessId: v.id("businesses"),
    stage,
    at: v.number(),
    amount: v.optional(v.number()),
    platform: v.optional(platform),
    contact: v.optional(v.string()),
  }).index("by_business_at", ["businessId", "at"]),

  syncRuns: defineTable({
    adAccountId: v.id("adAccounts"),
    startedAt: v.number(),
    finishedAt: v.optional(v.number()),
    ok: v.optional(v.boolean()),
    error: v.optional(v.string()),
  }).index("by_account", ["adAccountId", "startedAt"]),
});
