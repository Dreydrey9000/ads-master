/**
 * POST /api/insights  { businessId }
 * Sends a business's ad data to an LLM and returns good / bad / ugly insights.
 * Falls back to demo insights when no OPENAI_API_KEY is set.
 */
import { NextResponse } from "next/server";
import { getAds, getInsights, getMetrics, SPEND_TRENDS } from "@/lib/data/demo";
import { BUSINESSES } from "@/ads-master.config";

const SYSTEM = `You are Ads Master, a senior performance marketer. Given ad metrics across platforms and consumer spend trends,
return JSON {"insights":[{"verdict":"good|bad|ugly","platform":"...","title":"...","detail":"...","action":"..."}]}.
Be blunt and specific: numbers, what to change, what to pause, where to move budget, and how spending trends affect this business.`;

export async function POST(req: Request) {
  const { businessId } = await req.json();
  const b = BUSINESSES.find((x) => x.id === businessId);
  if (!b) return NextResponse.json({ error: "unknown business" }, { status: 404 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ insights: getInsights(b), source: "demo" });

  const payload = { business: b, metrics: getMetrics(b), ads: getAds(b), trends: SPEND_TRENDS };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.INSIGHTS_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: JSON.stringify(payload) }],
    }),
  });
  const json = await res.json();
  const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
  return NextResponse.json({ insights: parsed.insights ?? [], source: "ai" });
}
