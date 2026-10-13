# Engineering changelog

## Glass workspace — October 12, 2026

- Replaced the top-tab shell with a responsive sidebar, frosted panels, mint accents and metallic actions.
- Added local CSV import with validation, per-business persistence and report export. A report replaces only the selected business's previous import.
- Preserved the original sample dashboard with explicit provenance and separate empty states for real data.
- Added accessible dialogs, ad search, reduced-motion handling, storage failure feedback, mobile layouts, and local/CI checks.
- Fixed duplicate chart gradient IDs and zero-denominator handling.
- Direct provider connections and production deployment remain pending authentication and provider verification. No campaigns or budgets changed.

Validation: production build, TypeScript, UI/copy gates and all 10 Playwright tests passed. Browser checks include rendered chart graphics, desktop/mobile accessibility, 320/390/720px overflow, report isolation, storage errors and dialog focus restoration. Production dependency audit reported zero vulnerabilities. Local verification only; GitHub CI and deployment have not run.

- Corrected app ownership branding to “By Drey” in the sidebar and footer.

## Hosted personal workspace

- Added `/drey`, an empty personal ads workspace with browser-local CSV reports.
- Prepared `ads.dreythomas.com` on Vercel with Cloudflare DNS.
- Disabled the unauthenticated AI endpoint and forced unfinished Convex hooks off in public builds.
- Added personal-route persistence, isolation, accessibility and disabled-endpoint checks.
