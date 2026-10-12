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

## Data model (next step: Postgres/Supabase)
`workspace → business → ad_account(platform) → campaign → ad → daily_metrics`
