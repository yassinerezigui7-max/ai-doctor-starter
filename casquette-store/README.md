# Casquette Store

One-product cash-on-delivery landing page for Algeria. French UI, 58 wilayas with
per-wilaya shipping, orders land in a Google Sheet. No cart, no payment gateway —
the order form *is* the checkout.

```bash
npm install
npm run assets     # build images + manifest from the photo folder
npm run dev        # http://localhost:3000
```

The form works immediately: with no order endpoint configured it runs in **mock
mode** (900 ms simulated request, always succeeds, payload logged to the console).
Wire up the sheet when you're ready — see [GOOGLE_SHEETS.md](GOOGLE_SHEETS.md).

---

## The two files you'll actually edit

**[`src/config/site.config.ts`](src/config/site.config.ts)** — everything
commercial. Price, compare-at price, quantity discounts, colours, WhatsApp
number, quantity limits, delivery labels, phone rules, SEO domain. Change a price
here and it updates the hero, the sticky bar, the summary, the submit button
label and the submitted payload. Values are schema-validated at build time, so a
typo fails `npm run build` rather than the live page.

**[`src/config/copy.fr.ts`](src/config/copy.fr.ts)** — every user-facing string,
behind a `t()` helper. No component hardcodes text; drop in `copy.ar.ts` later
for a second language.

Also useful:

| File | What's in it |
|---|---|
| [`src/data/wilayas.ts`](src/data/wilayas.ts) | All 58 wilayas + home/desk shipping prices (`desk: null` = no stopdesk) |
| [`src/data/communes.ts`](src/data/communes.ts) | 1 524 communes, pipe-separated per wilaya |
| [`src/data/reviews.ts`](src/data/reviews.ts) | **Placeholder reviews — replace before launch** |
| [`src/styles/tokens.css`](src/styles/tokens.css) | The entire colour/shape/motion system |

## Commands

```bash
npm run dev        # dev server
npm run assets     # regenerate images + gallery manifest (idempotent, cached)
npm run build      # production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest — pricing, phone normalization, order IDs
```

## How the photos work

`npm run assets` reads the raw folder (default:
`/Users/mac/ai-doctor-starter-1/website gombita `, override with `ASSETS_DIR`),
and for each photo works out its dimensions, dominant subject colour and a blur
placeholder. It then:

- **infers the colour variant** by LAB-matching the subject against your config
  swatches;
- **picks the hero** — portrait beats square beats landscape, then resolution,
  then how much of the frame the product fills, with filename hints
  (`hero|main|principal|1|cover`) breaking ties — and **prints its reasoning**;
- **orders the gallery**: one strong shot per colour first, close-ups last;
- emits AVIF + WebP at 7 widths plus `og.jpg` and the icons;
- writes the typed manifest `src/data/gallery.generated.ts`.

It never touches your originals, is cached by content hash, and if the folder is
missing it fails loudly *and* writes a placeholder manifest so the dev server
still boots. Rerun it whenever you add or replace photos.

## How an order travels

```
form → validate (zod) → POST /api/order → recompute money server-side
     → Apps Script (shared-secret header) → row in your sheet
```

The browser never sees the Apps Script URL, and money is always recomputed on the
server from the bundled wilaya data — editing prices in devtools changes nothing
that reaches your sheet. Orders are hard to lose: the draft is saved to
`localStorage` as it's typed, failed requests retry with backoff, and an order
that fails while offline is queued and sent automatically when the connection
returns. Each order ID is generated once per form session and reused across
retries, and the Apps Script refuses to append an ID it already has — so a
double-tap, a retry and a queued resend still produce exactly one row.

## Architecture notes

Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4. Server
components by default; `'use client'` only where interactivity lives (hero colour
selector, carousel, order form, sticky bar). Static-first — the one server
dependency is the `/api/order` proxy, and the rest stays
`output: 'export'`-compatible.

All money flows through a single unit-tested `computeTotals()` in
[`src/lib/format.ts`](src/lib/format.ts), used by the summary UI, the submit
button label *and* the submitted payload, so those can never disagree.

Read [DECISIONS.md](DECISIONS.md) before changing anything structural — it
documents every assumption, including **the green colour variant having no
photos** and the bundle-size trade-offs.

## Before launch

See the checklist in [DEPLOYMENT.md](DEPLOYMENT.md). The short version: set your
real domain, replace the placeholder reviews, deploy the Apps Script, and confirm
one test order lands in the sheet with its phone number's leading zero intact.
