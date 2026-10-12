export type PlatformId = "meta" | "google" | "tiktok" | "linkedin" | "openai" | "youtube";

export interface Platform {
  id: PlatformId;
  name: string;
  color: string;
  status: "connected" | "demo" | "not_connected";
}

export interface SalesConfig {
  enabled: boolean;
  avgDealSize?: number;
  goalMonthly?: number;
}

export interface BusinessConfig {
  id: string;
  name: string;
  industry: string;
  emoji?: string;
  platforms: PlatformId[];
  sales?: SalesConfig;
}
export type Business = BusinessConfig;

export interface SalesFunnel {
  stages: { name: string; value: number }[];
  closedRevenue: number;
  goal: number;
  daily: number[]; // closed $ per day, last 14 days
  bySource: { platform: PlatformId; deals: number; revenue: number }[];
}

export interface PlatformMetrics {
  platform: PlatformId;
  spend: number;
  revenue: number;
  impressions: number;
  clicks: number;
  conversions: number;
  trend: number[]; // daily ROAS, last 14 days
}

export interface Ad {
  id: string;
  businessId: string;
  platform: PlatformId;
  name: string;
  format: "video" | "image" | "carousel" | "search" | "chat";
  spend: number;
  roas: number;
  ctr: number;
  cpa: number;
  verdict: "good" | "bad" | "ugly";
}

export interface Insight {
  verdict: "good" | "bad" | "ugly";
  title: string;
  detail: string;
  action: string;
  platform?: PlatformId;
}

export interface WinningAd {
  brand: string;
  platform: PlatformId;
  hook: string;
  angle: string;
  runningDays: number;
  category: string;
}

export interface SpendTrend {
  category: string;
  change: number; // % year over year
  note: string;
  impact: "tailwind" | "headwind" | "neutral";
}

/** Every ad platform implements this so the dashboard never cares where data came from. */
export interface AdConnector {
  platform: PlatformId;
  isConfigured(): boolean;
  getMetrics(accountId: string, days: number): Promise<PlatformMetrics>;
  getAds(accountId: string, days: number): Promise<Ad[]>;
}
