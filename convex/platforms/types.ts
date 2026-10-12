export interface DailyRow { date: string; spend: number; revenue: number; impressions: number; clicks: number; conversions: number }
export interface AdRow { externalId: string; name: string; format: string; spend: number; revenue: number; ctr: number; conversions: number }
export interface PlatformFetcher {
  daily(externalId: string, token: string, days: number): Promise<DailyRow[]>;
  ads(externalId: string, token: string, days: number): Promise<AdRow[]>;
}
export const isoDaysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
