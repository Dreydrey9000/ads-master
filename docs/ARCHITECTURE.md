# Architecture

```
 Ad platforms ──► connectors (lib/connectors/*) ──► normalized metrics/ads ──┐
 Ad libraries (Foreplay, Meta Ad Library) ──► winning-ads feed ─────────────┤──► AI insights (api/insights) ──► Dashboard
 Spend data (BEA, Census retail, card-spend APIs) ──► trends per category ──┘
```

## Connectors
Every platform implements `AdConnector` (`lib/types.ts`): `isConfigured()`, `getMetrics()`, `getAds()`.

| Platform | API | Status |
|---|---|---|
| ChatGPT Ads (OpenAI) | Advertiser API + Insights API — key from Ads Manager > Settings. Docs: https://learn.chatgpt.com/ads/api-overview | Draft in `openai-ads.ts` (verify endpoint paths) |
| Meta | Marketing API Insights | Draft in `meta.ts` |
| Google Ads / YouTube | Google Ads API (GAQL) | Stub |
| TikTok | Marketing API reporting | Stub |
| LinkedIn | adAnalytics | Stub |

### ChatGPT Ads notes
- Ads Manager reports impressions, clicks, spend, CTR, avg CPC, avg CPM, conversions.
- Conversions via OpenAI Pixel / Conversions API. Clicks carry `oppref` (not gclid) — keep UTMs on landing URLs.
- Spend lags ~7–8h, conversions 24–48h. Don't let the AI judge a campaign on day one.
- Community read-only MCP exists: HYPD-AI/openai-ads-mcp (useful reference).

## Data model (implemented in Convex, see `convex/schema.ts`)
`workspace → business → ad_account(platform) → campaign → ad → daily_metrics`

## Backend: Convex (Phase 2)
```
convex/
  schema.ts        tables + indexes
  businesses.ts    list / create / syncFromConfig (config file stays the template's source of truth)
  accounts.ts      connect / disconnect ad accounts (tokens go to `credentials`, never returned to the client)
  platforms/       one fetcher per ad platform (meta.ts, openai.ts; add google/tiktok/linkedin/youtube here)
  sync.ts          syncAccount → upserts metricsDaily + ads; syncAll (cron); syncBusiness ("Sync now")
  insights.ts      LLM good/bad/ugly per business, stored with history; rule-based fallback
  dashboard.ts     one live query returning the exact shapes the UI already uses
  sales.ts         log Leads → Booked → Showed → Closed
  http.ts          POST /sales-event webhook
  crons.ts         07:00 UTC sync, 08:00 UTC insights
```
The UI (`lib/live.ts`) uses live Convex data wherever it exists and falls back to demo data everywhere else, so the app works with zero setup.
