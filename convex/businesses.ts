import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { platform } from "./schema";

const salesArg = v.optional(v.object({ enabled: v.boolean(), avgDealSize: v.optional(v.number()), goalMonthly: v.optional(v.number()) }));

export const list = query({
  args: {},
  handler: (ctx) => ctx.db.query("businesses").collect(),
});

/** Upsert the businesses from ads-master.config.ts so config stays the template's source of truth. */
export const syncFromConfig = mutation({
  args: { businesses: v.array(v.object({
    id: v.string(), name: v.string(), industry: v.string(), emoji: v.optional(v.string()),
    platforms: v.array(platform), sales: salesArg,
  })) },
  handler: async (ctx, { businesses }) => {
    for (const b of businesses) {
      const doc = { slug: b.id, name: b.name, industry: b.industry, emoji: b.emoji, platforms: b.platforms, sales: b.sales };
      const existing = await ctx.db.query("businesses").withIndex("by_slug", (q) => q.eq("slug", b.id)).unique();
      if (existing) await ctx.db.patch(existing._id, doc);
      else await ctx.db.insert("businesses", doc);
    }
  },
});

export const create = mutation({
  args: { slug: v.string(), name: v.string(), industry: v.string(), emoji: v.optional(v.string()), platforms: v.array(platform), sales: salesArg },
  handler: async (ctx, b) => {
    const existing = await ctx.db.query("businesses").withIndex("by_slug", (q) => q.eq("slug", b.slug)).unique();
    if (existing) throw new Error(`A business with id "${b.slug}" already exists`);
    return ctx.db.insert("businesses", b);
  },
});
