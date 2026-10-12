import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { platform } from "./schema";

/** Ad accounts for a business. Never returns tokens. */
export const listForBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: (ctx, { businessId }) => ctx.db.query("adAccounts").withIndex("by_business", (q) => q.eq("businessId", businessId)).collect(),
});

/** Connect an account with an API key / access token. ChatGPT Ads: key from Ads Manager > Settings. Meta: a long-lived system-user token. */
export const connect = mutation({
  args: { businessId: v.id("businesses"), platform, externalId: v.string(), name: v.optional(v.string()), token: v.string() },
  handler: async (ctx, { token, ...acct }) => {
    const adAccountId = await ctx.db.insert("adAccounts", { ...acct, status: "connected" });
    await ctx.db.insert("credentials", { adAccountId, token });
    return adAccountId;
  },
});

export const disconnect = mutation({
  args: { adAccountId: v.id("adAccounts") },
  handler: async (ctx, { adAccountId }) => {
    for (const c of await ctx.db.query("credentials").withIndex("by_account", (q) => q.eq("adAccountId", adAccountId)).collect()) await ctx.db.delete(c._id);
    await ctx.db.delete(adAccountId);
  },
});

// ── internal (sync only) ──
export const getWithToken = internalQuery({
  args: { adAccountId: v.id("adAccounts") },
  handler: async (ctx, { adAccountId }) => {
    const account = await ctx.db.get(adAccountId);
    const cred = await ctx.db.query("credentials").withIndex("by_account", (q) => q.eq("adAccountId", adAccountId)).unique();
    return account && cred ? { account, token: cred.token } : null;
  },
});

export const listAll = internalQuery({ args: {}, handler: (ctx) => ctx.db.query("adAccounts").collect() });

export const setStatus = internalMutation({
  args: { adAccountId: v.id("adAccounts"), status: v.union(v.literal("connected"), v.literal("error"), v.literal("syncing")), lastError: v.optional(v.string()), synced: v.optional(v.boolean()) },
  handler: async (ctx, { adAccountId, status, lastError, synced }) => {
    await ctx.db.patch(adAccountId, { status, lastError, ...(synced ? { lastSyncedAt: Date.now() } : {}) });
  },
});
