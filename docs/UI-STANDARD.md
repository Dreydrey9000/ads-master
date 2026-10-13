# Ads Master UI standard

Inherits `/Users/andrethomas/.claude/UI-STANDARD.md` when available. This is an internal personal advertising workspace; this iteration belongs in the engineering changelog, not a customer announcement.

- Smoked translucent surfaces, mint action accent, metallic controls, visible focus, and 40–44px main touch targets.
- Native modal dialog provides focus containment, Escape and focus restoration. Labels are persistent. Errors remain beside the action and preserve entered values.
- Reduced motion disables entrances and transitions; chart animations are disabled. Real file parsing has a thinking orb and status text. No fabricated progress.
- Sample and real data never silently fill gaps in one another. Imports have a named period. Report values stay local and missing data has a distinct empty state.
- `npm run check:ui` enforces a zero baseline for blocking browser dialogs, raw exception display patterns, and arbitrary Tailwind text sizes. `npm run test:ui` checks behavior, overflow and axe WCAG AA violations.
- This is a local version, not a production release. Customer distribution requires authenticated backend ownership, verified connectors, a product update and launch review.
