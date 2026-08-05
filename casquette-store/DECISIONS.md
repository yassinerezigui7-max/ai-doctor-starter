# DECISIONS.md

Every assumption, judgement call and deviation, with the reasoning. Anything
listed here can be changed — the point is that you know it was a choice.

---

## 1. What the photo folder actually contained (this shaped the build)

The brief said `~/Desktop/website gombita/`. The real path is
`/Users/mac/ai-doctor-starter-1/website gombita ` — **with a trailing space** in
the directory name. `scripts/prepare-assets.mjs` defaults to that exact path and
accepts an `ASSETS_DIR` override; no renaming is ever required of you.

Eight files, all portrait:

| File | Size | Inferred |
|---|---|---|
| `my own image 3.png` | 866×1104 | blue — **hero** |
| `my own image 1.png` | 938×1080 | blue |
| `my own image 5.png` | 884×1094 | black |
| `my own image 6.png` | 920×1174 | black |
| `my own image7.png` | 900×1060 | black |
| `my own image 2.png` | 906×1150 | blue (back view; classified once the swatch was sampled — §14) |
| `my own image 4.png` | 952×1186 | blue — role `detail` (emblem close-up) |
| `image loggo GB00109564.png` | 1080×1920 | the brand mark — own pipeline, see §1b |

### 1a. There are no green photos — the green variant is a swatch chip
Config still lists blue/green/black as the brief specified, but nothing can show
a green cap because no green cap was photographed. Rather than break, every
variant feature degrades:

- the hero chip for green renders as a **solid swatch** instead of a photo;
- selecting green **keeps the current hero image** (no fade to nothing);
- the gallery filter chip for green is **not rendered at all**
  (`VARIANTS_WITH_PHOTOS` drives this).

**To fix properly:** drop green photos into the folder and run `npm run assets`,
or delete the green entry from `site.config.ts`. Both are one-line changes.

### 1b. The logo is the header mark, recoloured from off-white to `--primary`
`image loggo…png` is routed out of the product pipeline by filename
(`/log(o|go)/i`) and handled by its own branch in `prepare-assets.mjs`.

The mark measured **rgb(244, 242, 239), L\*=95.6** — near-white, and invisible if
dropped straight onto the page. It sits on a **fully transparent canvas**
(87% of the source pixels are alpha 0), which made the recolour exact rather than
approximate: the alpha channel is already a clean mask, so the script fills a
solid `--primary` rectangle and joins that alpha. No tracing, no duotone
guesswork, no halo. The recolour is conditional — `L* > 60` triggers it, so a
dark logo dropped in later is left alone — and the decision is printed on every
run.

Pipeline: `trim({threshold: 5})` → 747×720 bounding box → tint → resize to 2× the
40 px render height → `/images/logo.png` (83×80). Rendered at **32 px mobile /
40 px desktop**, centred, `alt="{config.store.name}"`, with explicit width/height
(measured CLS 0). Contrast is `--primary` on `--bg` = **12.65:1** on the current
navy-on-white palette.

The same trimmed mark generates `favicon.ico` (32), `apple-touch-icon.png` (180)
and `icon.svg` (256), each centred at 76% on a `--bg` plate. Both the tint and
the plate colour are read from `tokens.css` at run time (§15), so the mark
followed the palette change automatically.

`config.store.logo` is `{ src, width, height } | null`; setting it to `null`
restores the text wordmark with no other edit. The script prints the exact config
line whenever the numbers change.

### 1c. Colour inference works on the *subject*, not the average pixel
Studio shots are ~70% light background, so an average-colour match sent
everything to "unassigned". The script now segments subject pixels (LAB distance
from the corner-sampled background) and matches the **subject mean** against your
config swatches. Close-ups invert the logic — there the fabric *is* the
background — which is what makes `image 4` classify as blue rather than
"unassigned".

### 1d. About the photographs themselves
These are professional studio shots that prominently feature a third-party
crocodile emblem. As instructed, no brand name, logo or emblem appears anywhere
in the code, copy or metadata; the product title is the plain-text
`"Casquette Premium"` you control in one place. **Confirm you hold the rights to
use these photographs commercially** — that is not something the code can
resolve.

---

## 2. Deviations from the brief (and why)

### 2a. Bundle budget: 175 KB initial JS, not ≤100 KB — missed, with numbers
Measured on the production build (`encodedBodySize`, i.e. gzipped, of every JS
resource fetched before `loadEventEnd`):

| Chunk | Gzipped | What it is |
|---|---|---|
| `1upe53…` | 69.3 KB | react-dom |
| `0cmz8ya…` | 47.8 KB | React + Next App Router client runtime |
| `14mumt5…` | 13.5 KB | Next runtime |
| `3hd2sbn…` | 12.0 KB | **app code** + embla-carousel |
| `2rvcdy9…` | 10.4 KB | **app code** (sections, providers) |
| `3_kh1s1…`, `25jnrhe…`, `turbopack…`, `0y81fwj…` | 22.6 KB | Next runtime + **app code** |
| **Initial total** | **175.6 KB** | |
| *(deferred, after load)* | *92.9 KB* | order form: zod + react-hook-form + 1 524 communes |

**Roughly 27 KB of that is my code; ~148 KB is the React + Next App Router
runtime**, which is the floor for this stack — the budget is unreachable with
Next.js App Router no matter how the page is written. Two real optimisations were
made rather than declaring it impossible:

1. **zod out of the client config path.** `site.config.ts` used to run
   `configSchema.parse()` at import time, so every component that read the config
   dragged zod (~64 KB) into the initial bundle. The schema now lives in
   `site.config.schema.ts` and is called only from `app/layout.tsx` — a server
   component — so an invalid config still **fails `next build`, not the page**,
   exactly as the brief requires, but zod never ships to the browser for config.
2. **The order form is deferred** (`OrderFormLoader`), moving zod,
   react-hook-form and the commune dataset — 92.9 KB — off the critical path. It
   is fetched at the first idle moment after hydration *and* when the section
   comes within 600 px, so it is ready long before anyone scrolls to it.

If the budget is hard, the stack has to change (Astro/Preact islands, or plain
HTML+JS). Say the word and I'll cost that out.

### 2b. Lighthouse was not run — the one deliverable I could not produce
`lighthouse.json` does not exist. The Lighthouse CLI needs to drive its own
Chrome instance; in this environment that timed out, and launching a separate
Chrome was declined. I will not paste scores I did not measure.

What I *did* verify on the production build, in a real browser:

- **CLS from the deferred form: 0.** The skeleton is sized row-for-row against
  the real form — 1036 px vs 1037 px at 1280 px wide, 1036 vs 1033 at 375 px —
  and the swap happens off-screen during idle.
- **Every image reserves its box** (explicit width/height + `aspect-[4/5]`/
  `[3/4]` frames + LQIP), so no image can shift layout.
- Paint metrics (LCP/FCP) could not be measured: the automation pane runs with
  `document.visibilityState === "hidden"`, and browsers suppress paint timings
  for hidden documents. The numbers it does report are meaningless artefacts.

**Run it yourself** (takes ~40 s):

```bash
npm run build && npx next start -p 3100
npx lighthouse http://localhost:3100/ --output=json --output=html \
  --output-path=./lighthouse --form-factor=mobile --screenEmulation.mobile \
  --only-categories=performance,accessibility,best-practices,seo
```

Expect Performance to be dragged down by the JS baseline in §2a; accessibility,
best-practices and SEO should score at or near 100 given the audit in §3.

### 2c. Palette: white · near-black · navy `#133458` — measured contrast

The warm scheme was replaced wholesale; nothing cream or brown remains, including
the shadow tints (re-based from `rgba(28,25,23,…)` to `rgba(15,20,23,…)` — same
geometry, neutral cast).

| Pair | Ratio | Required | |
|---|---|---|---|
| `--ink` on `--bg` | 18.54:1 | 4.5 | PASS |
| `--ink` on `--surface` | 17.29:1 | 4.5 | PASS |
| `--ink` on `--surface-alt` | 16.35:1 | 4.5 | PASS |
| `--muted` on `--bg` | **6.00:1** | 4.5 | PASS |
| `--muted` on `--surface` | 5.60:1 | 4.5 | PASS |
| `--muted` on `--surface-alt` | 5.29:1 | 4.5 | PASS |
| `--primary` on `--bg` | 12.65:1 | 4.5 | PASS |
| `--primary` on `--surface` | 11.80:1 | 4.5 | PASS |
| `--white` on `--primary` | 12.65:1 | 4.5 | PASS |
| `--white` on `--primary-press` | 15.63:1 | 4.5 | PASS |
| `--success` on `--bg` | 7.70:1 | 4.5 | PASS |
| `--white` on `--success` | 7.70:1 | 4.5 | PASS |
| `--danger` on `--bg` | 8.33:1 | 4.5 | PASS |
| `--danger` on `--surface` | 7.77:1 | 4.5 | PASS |
| `--white` on `--danger` | 8.33:1 | 4.5 | PASS |
| `--line-strong` on `--bg` | 3.51:1 | 3.0 | PASS |
| `--line-strong` on `--surface` | 3.27:1 | 3.0 | PASS |
| `--line-strong` on `--surface-alt` | 3.10:1 | 3.0 | PASS |
| `--line` on `--bg` | 1.25:1 | decorative | — |
| `--surface-alt` on `--bg` | 1.13:1 | decorative | — |

**One requirement could not be met as written.** `--line: #E2E6EB` measures
**1.25:1** on `--bg`; no hex that light can also clear 3:1. So the two-token split
is kept: `--line` is your specified hex, used only for decorative hairlines
(section rules, card edges, the summary's dashed rule), and **`--line-strong`
(`#7E8A99`)** carries every interactive boundary — inputs, selects, radio cards,
chips, stepper, carousel dots, secondary buttons, avatars. That is what actually
satisfies WCAG 1.4.11. If you want a single token, `--line` has to darken to at
least `#7E8A99` and every hairline gets heavier.

Other palette knock-ons fixed in the same pass: review cards moved from
`bg-white` to `bg-surface` (a white card on a white page has no edge), the WhyBuy
band from `bg-surface/50` to `bg-surface-alt`, header/footer rules from
`border-line/60` to full `--line`, and the sticky-bar scrim from `primary/12` to
`--primary-tint`.

### 2d. One extra dependency: vitest (dev-only)
The brief mandates unit tests for pricing and phone normalisation but names no
runner. vitest is a devDependency and ships nothing to the browser. 24 tests
cover `computeTotals()`, quantity discounts, the stopdesk fallback, DA
formatting, phone normalisation across `+213`/`00213`/`0`, landline rejection,
cross-wilaya commune rejection and order-ID format/uniqueness.

### 2e. `next/image` with a custom loader
Renditions are pre-generated by the asset script at fixed widths, and
`src/lib/imageLoader.ts` maps any requested width onto the nearest one. This
keeps the whole site `output: 'export'`-compatible (no runtime image optimiser)
while still using `next/image` for lazy-loading, `sizes`, LQIP and priority
hints. Widths `128` and `256` were added to the brief's list for the colour chips.

---

## 3. Accessibility audit (measured on the production build)

| Check | Result |
|---|---|
| Images without `alt` | 0 |
| Interactive elements without an accessible name | 0 |
| `<h1>` count / skipped heading levels | 1 / none |
| Duplicate `id`s | 0 |
| Focusable elements inside `aria-hidden` | 0 |
| Touch targets < 44 px | 0 |
| Landmarks | `main`, `header`, `footer`, 7 × `section[aria-labelledby]` |
| Colour-selector arrow keys | moves focus + selection, wraps both ways, roving tabindex |
| Modal | focus trapped both directions, `Esc` closes, scroll locked/restored, focus returned |
| Tab order | hero → gallery → form → submit; disabled commune and decrement correctly skipped |

The delivery radios needed two fixes found during the audit: an explicit
`aria-label` (the wrapping label also holds the hint and price, which made the
announcement a jumble), and a full-size transparent input instead of `sr-only`
so its own hit area is the whole card rather than 1×1 px.

---

## 4. Smaller judgement calls

1. **Fonts: one family — Inter Tight** (400–600 variable), self-hosted, latin
   subset, **43.9 KB**, zero network font requests. Fraunces was the original
   display face and was dropped when the palette moved to navy-on-white: a
   high-contrast serif reads artisanal/editorial and fought the crisp system,
   its numerals were weaker in the price and total UI that carries the whole COD
   conversion path, and removing it halved the font payload (112 KB → 43.9 KB).
   Both options were rendered at display size and the grotesk was chosen on
   review. The `font-display` hook still exists in the theme, so a separate
   display face is a one-line change.
   Because Tailwind's preflight resets `h1`–`h6` to `font-weight: inherit`, the
   weight now lives in the type scale (`--text-display--font-weight: 600`, h2/h3
   likewise) rather than a utility on every heading; display tracking also
   tightened to `-0.03em`, which a grotesk needs and a serif did not.
   **The latin subset excludes `œ`** — write "oeil", not "œil", in `copy.fr.ts`,
   or add the latin-ext file back.
   (In `npm run dev` you will also see `geist-*.woff2` in the network panel —
   that is the Next.js dev overlay, not the page. The production build serves
   exactly one font file; verified against `next start`.)
2. **Sticky bar hide rule.** "Hides when the order section is ≥30% visible"
   cannot use the raw `intersectionRatio`: the order section is taller than the
   viewport, so the ratio caps out around 0.5 and the bar would never hide. It
   measures the visible height against `min(viewport, element)` instead.
3. **Sticky bar height is measured, not hard-coded.** `--sticky-cta-space` is set
   from the bar's real `offsetHeight` (77 px incl. border and safe-area), so the
   body padding always matches and the footer is never covered.
4. **One shared observer store.** `useStickyCta` is consumed by both `StickyCta`
   and `BackToTop`; it is a module-level store (`useSyncExternalStore`) so the
   observers are created once and only one writer owns the CSS variable.
5. **Colour and quantity live in context, not react-hook-form.** They are shared
   by the hero, sticky bar and form. Context owns them and they are injected into
   the payload at submit, so the hero selector and the form's colour field cannot
   drift apart.
6. **Wilaya select:** native `<select>` on touch, searchable `<input list>` on
   desktop (`min-width: 768px and pointer: fine`), per the brief's instruction not
   to build a custom overlay.
7. **Commune data** is stored pipe-separated and split at runtime — 1 524
   communes across all 58 wilayas, no duplicates, ~39 KB gzipped, now deferred
   with the form.
8. **Shipping prices** follow the brief's bands; every value is editable in
   `src/data/wilayas.ts`. Bordj Badji Mokhtar (52) and In Guezzam (54) ship with
   `desk: null` as realistic no-stopdesk cases — the office option disables itself
   and forces home delivery.
9. **`og.jpg`** is generated from the hero at 1200×630, letterbox-padded on
   `--bg` rather than cropped, so the cap is never cut off. Favicon and
   apple-touch-icon are generated too (a "C" monogram on `--primary`) — replace
   them if you have real brand icons.
10. **Mock mode is server-side too.** With `ORDER_ENDPOINT` empty, `/api/order`
    validates, recomputes the money, logs what it *would* forward, and returns
    success — so the full client→server path is testable before Apps Script exists.
11. **Analytics is a no-op stub** (`lib/analytics.ts`) that only logs in dev. No
    third-party SDK ships, per the performance rules.
12. **The `/dev` primitive showcase was deleted**, as the brief required.
13. **Product image plates.** The photographs' own studio background measures
    **`#F6F6F6` — 1.23:1 against the white page**, so on the new palette the
    product bled into the layout with no edge. Every product frame
    (`ProductImage` and `HeroImage`) now carries three cues: a `--surface-alt`
    plate, a 1px `--line` hairline, and the existing card shadow. Rendered and
    confirmed on the hero and a gallery card before continuing.
14. **The blue swatch is sampled, not picked.** `#2F4B6E` sat close enough to
    `--primary` `#133458` to read as UI chrome. The cap colour was measured from
    the navy photographs by segmenting subject pixels against the studio
    background — **`#253043`**, consistent across both shots (`image 3` and
    `image 1` returned `#253043`/`#253042`). Because that swatch also drives LAB
    variant matching in `prepare-assets.mjs`, the truer value improved inference
    as a side effect: `my own image 2.png` was previously `unassigned` and now
    classifies correctly as blue. Re-sample rather than hand-pick if the photos
    change.
15. **The asset script reads `tokens.css`.** `PRIMARY`, the icon plate, the OG
    background and the LQIP flatten colour were hardcoded warm hexes; they are
    now parsed from the token file at startup, so a palette change can never
    leave the generated assets behind. Re-running `npm run assets` recoloured the
    logo to `#133458` automatically.
16. **Features and FAQ sections removed** (post-build change request), together
    with `data/features.ts`, `data/faq.ts`, the `Accordion` primitive (FAQ was
    its only consumer), the FAQ accordion CSS in `globals.css`, the
    `FeatureItem`/`FaqItem` types, their `copy.fr.ts` entries, and the
    **`FAQPage` JSON-LD** — structured data describing content that is no longer
    rendered is a schema violation. The `Product` block stays, and its
    `aggregateRating` remains legitimate because those reviews *are* on the page.
    Sections are now: Header → Hero → Gallery → WhyBuy → Reviews → OrderSection
    → Footer.
17. **Hero image capped at `58svh` on phones.** The brief's `aspect-[4/5]` frame
    is kept; at 390×844 it renders 448 px tall and the title (614) and price
    (745) sit above the fold, with the sticky bar supplying a CTA immediately.
    The cap only engages on SE-class screens (≤700 px), where the frame would
    otherwise push the price out of view. `object-cover` crops — never
    letterboxes, never distorts.

---

## 5. Verified end-to-end (production build, real browser)

- Empty submit → 4 field errors, `role="alert"` count announced, `aria-invalid`
  set, focus moved to the first invalid field.
- Selecting Alger → 57 communes populate instantly, shipping 400 DA, total
  2 900 DA, and the submit label updates to "Commander maintenant — 2 900 DA".
- Successful submit → button disables with spinner, success modal shows
  `CAP-260804-4I6ATI`, draft cleared, form reset on close.
- **Server ignores tampered money.** POSTing `shippingPrice: 0, total: 1` for
  3 × Alger produced `shipping 400 / total 6700` server-side (3 × 2 100 + 400).
- **Network failure** → retried with 1 s/3 s backoff, error modal shown, order
  queued in `localStorage`, form data kept.
- **Recovery** → `online` event drained the queue and toasted
  "Votre commande en attente a bien été envoyée".
- **Rate limit** → 429 after 5 requests in 10 minutes from one IP.

**Not verified, because it needs your Google account:** that a row actually lands
in a live sheet, and that submitting the same order twice creates exactly one row.
The mechanism is in place on both sides — the order ID is generated once per form
session and reused across every retry, and `Code.gs` refuses to append an ID it
already has — but the round-trip is untested against a real deployment. It is
step 8–9 of [GOOGLE_SHEETS.md](GOOGLE_SHEETS.md) and takes about two minutes.
