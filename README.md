# Ads Master

**Every ad platform. Every business. One brain.**

Ads Master is the command center for running ads across multiple businesses:

- **All platforms in one place** — Meta, Google Ads, TikTok, YouTube, LinkedIn, and **ChatGPT Ads (OpenAI Ads Manager)**
- **Multiple businesses** on one account, switch with one tap
- **AI insights — the good, the bad, the ugly** — what's working, what's slipping, what's burning money, and exactly what to change
- **Winning ads research** — what's crushing right now in your categories (hooks, angles, how long they've been running)
- **Consumer spend trends** — where people are spending money and how it affects *your* business (the gap no other tool fills)

## Make it yours (template)

1. Open **`ads-master.config.ts`** — rename the app, list your businesses, pick each one's platforms.
2. Set `sales: { enabled: true, avgDealSize, goalMonthly }` on any business you do sales for → it gets a **Sales** tab (goal ring, pipeline funnel, deals by ad source).
3. Or skip the file: anyone can tap **+ Add business** in the app.

## Run it

```bash
npm install
cp .env.example .env.local   # add keys as you get them; missing ones show demo data
npm run dev                  # http://localhost:3000
```

### Go live with Convex
```bash
npx convex dev               # log in, create the project; writes NEXT_PUBLIC_CONVEX_URL to .env.local
npx convex env set OPENAI_API_KEY sk-...        # AI insights
npx convex env set SALES_WEBHOOK_SECRET <random> # Sales tab webhook
npm run dev
```
Then open **Connections**, connect ChatGPT Ads or Meta, and hit **Sync now**. Data syncs nightly at 3 AM ET after that.
Sales events: `POST https://<your-deployment>.convex.site/sales-event` with header `x-ads-master-secret` and
`{"business":"dreys-coaching","stage":"closed","amount":2500,"platform":"meta"}`.

## Stack

Next.js 14 (App Router) · Convex · TypeScript · Tailwind · Recharts · lucide icons

## Structure

```
app/                 pages + API routes
  api/insights/      LLM "good / bad / ugly" insights endpoint
components/          Dashboard UI
lib/types.ts         shared types + AdConnector interface
lib/connectors/      one file per ad platform (openai-ads.ts, meta.ts, stubs.ts)
lib/data/demo.ts     demo data generator (works for any business)
ads-master.config.ts the one file to edit for your own setup
components/charts.tsx small animated charts (area, donut, bars, goal ring, funnel)
docs/                vision, architecture, roadmap
```

See [`docs/VISION.md`](docs/VISION.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/ROADMAP.md`](docs/ROADMAP.md).
