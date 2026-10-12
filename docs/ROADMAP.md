# Roadmap

## Phase 1 — Foundation (this repo)
- [x] Dashboard UI: overview, AI insights, winning ads, spend trends, connections
- [x] Multi-business switcher + template config + "Add business" flow
- [x] Sales tab (goal, funnel, deals by ad source) for sales businesses
- [x] Small animated charts
- [x] Connector interface + draft ChatGPT Ads and Meta connectors
- [x] LLM insights endpoint (falls back to demo)

## Phase 2 — Real data
- [x] Database on **Convex**: businesses, adAccounts, credentials, metricsDaily, ads, insights, salesEvents, syncRuns
- [x] Connect ChatGPT Ads + Meta from the Connections tab (account ID + key/token)
- [x] Nightly sync cron (3 AM ET) + "Sync now" → `metricsDaily` / `ads`
- [x] Nightly AI insights cron + "Refresh AI insights", stored per business
- [x] Sales webhook `POST /sales-event` fills the Sales tab (Calendly, GHL, Zapier, Stripe)
- [ ] Auth: Convex Auth (lock every function to the signed-in owner) — do this before deploying publicly
- [ ] Encrypt stored tokens; Meta OAuth button instead of pasted tokens
- [ ] Fetchers for Google Ads, TikTok, LinkedIn, YouTube (`convex/platforms/`)
- [ ] Verify ChatGPT Ads endpoint paths against learn.chatgpt.com/ads docs

## Phase 3 — Research
- [ ] Winning ads feed from Foreplay API/MCP + Meta Ad Library, filtered by each business's category
- [ ] Consumer spend trends: Census monthly retail, BEA PCE, plus a card-spend data provider; map categories → businesses
- [ ] "How this affects you" AI summary per business

## Phase 4 — Action
- [ ] One-click actions (pause ad, shift budget) with approval
- [ ] Weekly email/Slack digest
- [ ] Creative generator from winning hooks
