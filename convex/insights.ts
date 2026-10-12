import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { businessSnapshot } from "./lib";
import { platform, verdict } from "./schema";
import type { ActionCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

type Snapshot = { business: Doc<"businesses"> | null; metrics: { platform: string }[]; ads: any[] };

const SYSTEM = `You are Ads Master, a senior performance marketer. Given one business's ad metrics across platforms (last 30 days),
return JSON {"insights":[{"verdict":"good|bad|ugly","platform":"meta|google|tiktok|linkedin|openai|youtube","title":"...","detail":"...","action":"..."}]}.
3–4 per verdict. Be blunt and specific: real numbers, what to scale, what to fix, what to kill, and where to move budget.
"good" = working, scale it. "bad" = fixable. "ugly" = burning money, stop it.`;

const item = v.object({ verdict, title: v.string(), detail: v.string(), action: v.string(), platform: v.optional(platform) });

export const snapshot = internalQuery({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => ({ business: await ctx.db.get(businessId), ...(await businessSnapshot(ctx, businessId)) }),
});

export const save = internalMutation({
  args: { businessId: v.id("businesses"), source: v.union(v.literal("ai"), v.literal("rules")), items: v.array(item) },
  handler: (ctx, a) => ctx.db.insert("insights", { ...a, createdAt: Date.now() }),
});

async function run(ctx: ActionCtx, businessId: Id<"businesses">): Promise<void> {
  const snap: Snapshot = await ctx.runQuery(internal.insights.snapshot, { businessId });
  if (!snap.business || snap.metrics.length === 0) return;
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    // No LLM key: plain rules so the tab still has something true to say.
    const items: any[] = snap.ads.slice(0, 9).map((a: any) => ({
      verdict: a.verdict, platform: a.platform, title: a.name,
      detail: `${a.roas}x ROAS on $${Math.round(a.spend)} spend, ${a.ctr}% CTR.`,
      action: a.verdict === "good" ? "Raise budget 20% and test 2 new hooks on this angle." : a.verdict === "bad" ? "Keep the offer, swap the creative's first 3 seconds." : "Pause it and move the budget to your best ad.",
    }));
    await ctx.runMutation(internal.insights.save, { businessId, source: "rules", items });
    return;
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.INSIGHTS_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: JSON.stringify({ business: { name: snap.business.name, industry: snap.business.industry }, metrics: snap.metrics, ads: snap.ads.slice(0, 40) }) }],
    }),
  });
  const json = await res.json();
  const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
  const items = (parsed.insights ?? []).filter((i: any) => ["good", "bad", "ugly"].includes(i.verdict)).map((i: any) => ({
    verdict: i.verdict, title: String(i.title ?? ""), detail: String(i.detail ?? ""), action: String(i.action ?? ""),
    ...(["meta", "google", "tiktok", "linkedin", "openai", "youtube"].includes(i.platform) ? { platform: i.platform } : {}),
  }));
  if (items.length) await ctx.runMutation(internal.insights.save, { businessId, source: "ai", items });
}

/** "Refresh insights" button. */
export const generate = action({ args: { businessId: v.id("businesses") }, handler: async (ctx, { businessId }): Promise<void> => run(ctx, businessId) });

export const generateAll = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    const accounts: Doc<"adAccounts">[] = await ctx.runQuery(internal.accounts.listAll, {});
    for (const id of new Set(accounts.map((a) => a.businessId))) await run(ctx, id);
  },
});
