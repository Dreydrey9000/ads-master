/**
 * ─────────────────────────────────────────────────────────────
 *  ADS MASTER — TEMPLATE CONFIG
 *  This is the only file you need to edit to make Ads Master yours.
 *  Add a business, pick its platforms, and (optionally) turn on the
 *  Sales tab for businesses where you run a sales pipeline.
 *  Users can also add businesses from the UI ("+ Add business").
 * ─────────────────────────────────────────────────────────────
 */
import type { BusinessConfig } from "./lib/types";

export const APP = {
  name: "Ads Master",
  tagline: "Every platform. Every business. One brain.",
  currency: "USD",
};

export const BUSINESSES: BusinessConfig[] = [
  {
    id: "1bb",
    name: "1 Button Business",
    industry: "AI coaching",
    emoji: "🚀",
    platforms: ["meta", "google", "openai", "youtube", "linkedin"],
  },
  {
    id: "viral-editz",
    name: "Viral Editz",
    industry: "Video editing agency",
    emoji: "🎬",
    platforms: ["meta", "tiktok", "openai", "youtube"],
  },
  {
    id: "dreys-coaching",
    name: "Drey's Coaching",
    industry: "Coaching (sales)",
    emoji: "💰",
    platforms: ["meta", "google", "openai", "linkedin"],
    sales: { enabled: true, avgDealSize: 2500, goalMonthly: 40000 },
  },
];
