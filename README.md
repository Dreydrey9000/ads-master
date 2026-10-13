# Ads Master

Drey's local advertising workspace, with a smoked-glass theme, business switching, and CSV report import/export.

## Use the app

```bash
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3210
```

Open http://127.0.0.1:3210. On this Mac, double-click `Launch Ads Master.command` to start the app and open it. Node.js 22+ is recommended.

1. Select a business or choose **Add business**.
2. Choose **Import report** and download the CSV template.
3. Fill one or more rows using the columns below, then choose the reporting period and import.
4. Review measured spend, attributed revenue, return on ad spend (ROAS), and cost per conversion. Use **Export** to keep a backup.

```csv
platform,spend,revenue,impressions,clicks,conversions
meta,100,400,10000,200,10
openai,50,300,2000,100,5
```

The example above is fictional. Supported platform IDs: `meta`, `google`, `tiktok`, `linkedin`, `openai`, `youtube`. Amounts are USD; counts must be whole numbers. Duplicate platform rows are aggregated. Every import replaces the previous report for that business. Use matching reporting periods and attribution definitions; summed platform-attributed revenue can count the same purchase more than once.

Reports and custom businesses are saved in this browser's local storage. There is no cloud sync, encryption-at-rest feature, multi-user account, or cross-browser persistence. Export reports before clearing browser data. CSVs stay in the browser; the import does not transmit them to an AI provider. Imported platform reports do not supply daily trends, individual creatives, AI recommendations, or pipeline events. Missing information stays empty. Sample mode is explicitly labeled throughout.

## Current boundaries

The original Convex backend and provider adapters remain as **unfinished integration scaffolding**. Do not deploy them or enter real account credentials yet. Account ownership/auth checks, provider API verification, and authenticated end-to-end sync must be implemented and reviewed first. Merely setting `NEXT_PUBLIC_CONVEX_URL` is not a safe production setup. Leave it unset for local report use. This version does not change budgets, publish ads, or connect any ad accounts.

`app/api/insights` is disabled with HTTP 410 and makes no AI requests. The public build forces the Convex URL off, even if an environment variable is accidentally supplied. The named ads and consumer trends in sample mode are illustrative placeholders, not verified current research.

## Development and checks

```bash
npm run typecheck
npm run check:ui
npm run build
npx playwright install chromium
npm run test:ui
```

Browser tests run against the production build, so run `npm run build` first. Playwright covers report validation/aggregation, persistence, business isolation, download, errors, keyboard dialog behavior, responsive overflow at 320/390/720px, reduced motion, and axe accessibility scans. The UI gate rejects browser alerts, raw exception display, and arbitrary Tailwind text sizes. GitHub Actions runs these checks when this branch is pushed.

- [Architecture diagram (editable Mermaid)](docs/diagrams/workspace.mmd)
- [Rendered architecture diagram](docs/diagrams/workspace.svg)
- [Local UI standard](docs/UI-STANDARD.md)
- [Engineering changelog](CHANGELOG.md)
- [Original architecture](docs/ARCHITECTURE.md) and [roadmap](docs/ROADMAP.md) describe the original wider plan, not verified live integrations.

Source structure: `components/Dashboard.tsx` owns workspace selection; `Overview.tsx` presents results; `ImportReport.tsx` validates and previews CSVs through `lib/reports.ts`; `GlassDialog.tsx` uses the browser's native accessible modal behavior; `app/globals.css` owns shared glass, metal, motion, and responsive styles.

## Preview

![Desktop glass workspace with illustrative data](docs/screenshots/desktop.png)

[Mobile screenshot](docs/screenshots/mobile.png)

## Hosted workspace

- App: https://ads.dreythomas.com
- Drey personal workspace: https://ads.dreythomas.com/drey (starts empty)

Both links use the same app and browser-local storage. The personal link selects Drey's Personal Ads; it is not a private account or a separate database. Reports from localhost must be exported and imported on the hosted domain. No reports are uploaded to Vercel.

Deployment uses Vercel project `ads-master` in scope `dreys-projects-277f634a`. Link explicitly with `vercel link --yes --project ads-master --scope dreys-projects-277f634a`, run the checks above, then deploy with `vercel deploy --prod --scope dreys-projects-277f634a`. No provider secrets or environment variables are required. Cloudflare manages the `ads` DNS record; do not change the apex or other subdomains.

This is a personal reporting tool, not a customer account service. A future plugin could validate an exported campaign CSV and open the app, but browser-local reports are not accessible to an authenticated MCP workflow. Plugin packaging is deferred until a useful customer workflow and account boundaries are implemented; nothing has been submitted or published as a plugin.
