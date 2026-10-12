import type { Platform } from "./types";

export const PLATFORMS: Platform[] = [
  { id: "meta", name: "Meta", color: "#1877f2", status: "demo" },
  { id: "google", name: "Google Ads", color: "#34a853", status: "demo" },
  { id: "tiktok", name: "TikTok", color: "#ff0050", status: "demo" },
  { id: "openai", name: "ChatGPT Ads", color: "#10a37f", status: "demo" },
  { id: "linkedin", name: "LinkedIn", color: "#0a66c2", status: "demo" },
  { id: "youtube", name: "YouTube", color: "#ff0000", status: "demo" },
];

export const platformById = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));
