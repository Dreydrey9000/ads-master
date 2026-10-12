import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * POST {CONVEX_SITE_URL}/sales-event   header: x-ads-master-secret: $SALES_WEBHOOK_SECRET
 * body: { "business": "dreys-coaching", "stage": "lead|booked|showed|closed", "amount": 2500, "platform": "meta", "contact": "jane@x.com" }
 * Point Calendly / GoHighLevel / Zapier / Stripe automations here to fill the Sales tab.
 */
const http = httpRouter();
http.route({
  path: "/sales-event",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const secret = process.env.SALES_WEBHOOK_SECRET;
    if (!secret || req.headers.get("x-ads-master-secret") !== secret) return new Response("unauthorized", { status: 401 });
    const b = await req.json();
    const businesses = await ctx.runQuery(api.businesses.list, {});
    const biz = businesses.find((x) => x.slug === b.business);
    if (!biz) return new Response("unknown business", { status: 404 });
    if (!["lead", "booked", "showed", "closed"].includes(b.stage)) return new Response("bad stage", { status: 400 });
    await ctx.runMutation(api.sales.log, { businessId: biz._id, stage: b.stage, amount: b.amount, platform: b.platform, contact: b.contact });
    return Response.json({ ok: true });
  }),
});
export default http;
