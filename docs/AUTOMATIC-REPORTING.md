# Automatic reporting operations

The DreyOS user timer runs hourly with up to two minutes of jitter and catches up after downtime. Its existing refresh process reads personal Stripe and ChatGPT Ads, plus 1BB Stripe, ChatGPT Ads and PostHog. The push script sends only aggregate daily reporting fields to Ads Master, which refreshes personal Meta and Google in parallel and saves seven independent snapshots in Convex.

## Security and scope

- `REPORT_SYNC_SECRET` is a random secret of at least 32 characters, stored privately in Vercel production and Convex production and at `~/.config/dreyos/ads-master-sync.key` on the DreyOS server (0600). Never use `NEXT_PUBLIC_` or a browser to transfer it.
- Both ingress routes validate the bearer secret before any provider read or database write. Bodies are bounded to 200 KB; business, account, provider, currency, dates and numeric rows are validated. Unknown fields are discarded.
- `backend/reporting:dashboard` requires the authenticated owner. Select a business explicitly; the response contains only its source aggregates. No customer records, keys, ad creative or account credentials are stored in the snapshot table.
- A provider failure retains its last successful snapshot and records the failed attempt. An older successful report cannot replace a newer one. Reports older than three hours are visibly delayed, even if a job cannot reach the app at all.
- No campaign, budget, payment or provider-access writes exist in the refresh path. TikTok and LinkedIn remain deferred.

## Deployment sequence

1. Run type checking, UI gate, build, and Playwright tests. Configure the shared secret using secret stdin/file handling.
2. Deploy `backend/` with the existing Convex production deployment. The schema is additive; existing auth tables remain unchanged.
3. Deploy the frontend and Next.js `/api/reports/sync` route through the existing Vercel project.
4. Copy `scripts/push-growth-reports.mjs` and updated `scripts/refresh-growth.mjs` into the DreyOS checkout, owned by its service user. Keep the existing hourly timer.
5. Run `systemctl --user start dreyos-growth-refresh.service` as the DreyOS service user. Verify its private status JSON has `adsMaster.status: synced`, `saved: 7`, and no failures. Check both business views and last-update timestamps in the signed-in app.

Rollback: restore the previous DreyOS refresh script to stop pushes; restore the previous frontend deployment. The additive snapshot table can remain private and unused. Never roll back or rotate auth credentials for this feature.

## Reading the numbers

ChatGPT Ads from DreyOS covers seven completed New York days. Meta/Google cover 30 completed New York days. Stripe covers 30 completed UTC days and reports captured amounts plus refunds from those payments, before fees and costs. PostHog covers seven completed UTC days, including repeat visits and member pages. Do not add mismatched windows or call payments attributed revenue, ROAS, profit, or available funds. Missing daily rows are unknown, not inferred zeroes. Charts include accessible daily tables.

The top next step is deterministic guidance: repair missing/failed/delayed reporting first, inspect conversions after reported clicks, otherwise prepare a bounded Growth review. It does not automatically launch an ad or replace Drey's required exact-creative review.
