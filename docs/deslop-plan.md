# Deslop plan — make Florence feel like Florence

Goal: remove the "AI-generated SaaS" tells from the web client and make the UI
read as a deliberate, opinionated market tool. Driven by
`../.reports/AI-SLOP-2026-09-22.md` and `../.reports/WEB_QA-2026-09-22.md`.

## Principles

- **Copy**: no negation-first headlines, no "risksiz"/hype adjectives, no
  "ihtiyacın olan her şey tek yerde", no "istersen…" filler, no hedging
  ("…olabilir") in system messages. Say the mechanism, once, positively.
- **Chrome**: fewer generic icons, fewer decorative pills, more typography and
  spacing. If a heading is self-evident, it gets no subtitle.
- **One reassurance**: "gerçek para kullanılmaz" appears in exactly one place.
- Every visual change is checked with a screenshot before commit.

## Gates (run before every commit)

```bash
npm run typecheck && npm run lint && npm run check:tokens && npm test
```

Playwright visual baselines (`e2e/visual.spec.ts-snapshots`, `consent.spec.ts-snapshots`)
are refreshed **once**, in the final unit, after all visual units land, and the
diff is reviewed by eye.

## Units (one commit each)

Status: **D0–D8 done** (gates green, prod build green, 32/32 Playwright e2e
green). D6 (top navigation) and D8 (symbol chart hero) shipped in **1.0.3**.

- **D0 — plan + branch** (`feat/deslop`). This file. ✅
- **D1 — copy de-slop** (`messages/tr.json`, `messages/en.json`): landing
  badge/title/CTA, remove `symbol.tradeCta.note`, de-hedge error copy, digest
  stale message, consent. Update the e2e/a11y/visual assertions that reference
  the old hero title.
- **D2 — drop redundant page subtitles**: remove the `description` prop from
  `PageHeader` on pages where it restates the title (about, contact, downloads,
  watchlist, digest, profile, data, markets, portfolio, dashboard). Keep only
  where it carries a rule (legal date, kitchen-sink).
- **D3 — `/contact` redesign**: real GitHub mark, labelled + fully clickable
  channel cards, hover/focus states, tighter layout.
- **D4 — sepia theme**: replace the navy `--primary` (and matching
  `--primary-hover`, `--focus-ring`) with a warm ink that fits the paper theme;
  verify with `contrast.test.ts`.
- **D5 — text-only navigation**: drop the per-item Lucide icons from
  `navigation.ts`, `Sidebar.tsx`, `MobileNav.tsx`.
- **D6 — top navigation** ✅ text-only top bar (5 entries, grouped menus), mobile
  drawer kept, `app-shell.test.tsx` + `top-nav.test.tsx`.
- **D7 — refresh Playwright visual baselines** ✅ (done twice: after D2/D3/D5 and
  after D6/D8).
- **D8 — symbol chart hero** ✅ merge `Genel` + `Grafik` into the default tab
  (stat grid + chart), chart stays code-split and is deferred by `LazyMount`;
  fixed the latent `nested-interactive` a11y issue on the chart container.

## Decisions taken (initiative)

- Keep "BIST'i canlı izle" as the first clause of the hero so the existing
  tests keep a meaningful anchor, but drop "risksiz" and add a third beat.
- The "no real money" line lives only in the CTA area (once), never in the hero
  badge.
- Top nav is text-only and grouped; the ⌘K palette stays as the power path.
- Sidebar→top-nav is the last, riskiest unit; it lands only after the copy and
  chrome units are green.

## Open questions (resolved or escalated)

- Exact hero wording — proposed in D1 brief; owner can tweak strings without
  code changes.
- Whether `/about` and `/downloads` gain content (currently sparse) — out of
  scope here; noted in the QA report.

## Post-1.0.3 cleanup (shipped in 1.0.4)

- **D9 — localization**: added a date-only `formatDate` helper; localized the
  legal-page header date and the digest archive dates (no more raw ISO), and
  localized the symbol sector via `symbol.sectors` + `src/lib/markets/sectors.ts`
  (dropped the untranslated `industry`).
- **D10 — copy**: removed the appearance tab's "stored on this device / saved to
  your account" note.
- **D11 — avatars removed**: the profile avatar picker, its fetch/save hooks and
  routes, the 12 placeholder SVGs and the `profile.avatar.*` messages are gone.
  The backend `avatar_id` field/endpoints remain (separate repo) as a follow-up.

## Post-1.0.4 (shipped in 1.0.5)

- **Landing**: removed the hero badge and the fake portfolio mock; the hero now
  shows a real "Piyasada öne çıkanlar" panel fed by
  `/companies/summary?sort=popular` (SSR, resilient). Rebalanced the copy so the
  landing leads with market data + analysis and treats the paper portfolio as
  one feature among several.
- **Copy**: de-hedged the reports/advisor/bot descriptions, fixed the digest
  empty-state grammar, removed the unused `symbol.tabs.chart` key.

## Incident (2026-09-22) — see `../.reports/INCIDENT-2026-09-22.md`

Not a code issue: the VM's host reclaimed ~5.2 GB via **VMware memory
ballooning**, so the 8 GB guest ran on ~2.7 GB and thrashed. Mitigations applied
on the host: swap 2 → 6 GB, `vm.swappiness=10`, and a 5-minute memory watcher
(`/var/log/memwatch.log`). The real fix is provider-side (guaranteed RAM /
disable ballooning) via the support ticket.
