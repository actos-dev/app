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

Status: **D0–D5 and D7 done** on `feat/deslop` (gates green, prod build green,
32/32 Playwright e2e green). **D6 (top navigation) is the next unit.**

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
- **D6 — top navigation** *(next phase)*: replace the left rail with a text-only
  top nav, 11 items collapsed into ~4 grouped menus; keep `MobileNav`; update
  `app-shell.test.tsx`.
- **D7 — refresh Playwright visual baselines** after D2/D3/D5/D6.

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
