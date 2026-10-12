# Roadmap

## Phase 1 — Foundation (this repo)
- [x] Dashboard UI: overview, AI insights, winning ads, spend trends, connections
- [x] Multi-business switcher + template config + "Add business" flow
- [x] Sales tab (goal, funnel, deals by ad source) for sales businesses
- [x] Small animated charts
- [x] Connector interface + draft ChatGPT Ads and Meta connectors
- [x] LLM insights endpoint (falls back to demo)

## Phase 2 — Real data
- [ ] Auth + database (Supabase): users, businesses, ad accounts
- [ ] OAuth "Connect" buttons for Meta, Google, TikTok, LinkedIn; API key entry for ChatGPT Ads
- [ ] Nightly sync job → `daily_metrics`
- [ ] Insights endpoint reads real data, stores history

## Phase 3 — Research
- [ ] Winning ads feed from Foreplay API/MCP + Meta Ad Library, filtered by each business's category
- [ ] Consumer spend trends: Census monthly retail, BEA PCE, plus a card-spend data provider; map categories → businesses
- [ ] "How this affects you" AI summary per business

## Phase 4 — Action
- [ ] One-click actions (pause ad, shift budget) with approval
- [ ] Weekly email/Slack digest
- [ ] Creative generator from winning hooks
