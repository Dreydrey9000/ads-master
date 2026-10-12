/**
 * Stubs for platforms not wired yet. Each one needs the same 3 methods as meta.ts.
 * - Google Ads: GAQL via googleads.googleapis.com (needs developer token + OAuth)
 * - TikTok: business-api.tiktok.com/open_api/v1.3/report/integrated/get/
 * - LinkedIn: api.linkedin.com/rest/adAnalytics
 * - YouTube: reports through Google Ads (campaign type VIDEO)
 */
import type { AdConnector, PlatformId } from "../types";

const stub = (platform: PlatformId, envKey: string): AdConnector => ({
  platform,
  isConfigured: () => Boolean(process.env[envKey]),
  async getMetrics() { throw new Error(`${platform} connector not implemented yet`); },
  async getAds() { throw new Error(`${platform} connector not implemented yet`); },
});

export const google = stub("google", "GOOGLE_ADS_DEVELOPER_TOKEN");
export const tiktok = stub("tiktok", "TIKTOK_ACCESS_TOKEN");
export const linkedin = stub("linkedin", "LINKEDIN_ACCESS_TOKEN");
export const youtube = stub("youtube", "GOOGLE_ADS_DEVELOPER_TOKEN");
