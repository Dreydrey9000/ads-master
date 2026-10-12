import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { platform, stage } from "./schema";

export const log = mutation({
  args: { businessId: v.id("businesses"), stage, amount: v.optional(v.number()), platform: v.optional(platform), contact: v.optional(v.string()), at: v.optional(v.number()) },
  handler: (ctx, { at, ...e }) => ctx.db.insert("salesEvents", { ...e, at: at ?? Date.now() }),
});

export const recent = query({
  args: { businessId: v.id("businesses") },
  handler: (ctx, { businessId }) => ctx.db.query("salesEvents").withIndex("by_business_at", (q) => q.eq("businessId", businessId)).order("desc").take(50),
});
