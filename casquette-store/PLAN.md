# PLAN.md — Casquette COD Landing Page

## 0. Asset inventory (inspected before planning)

Actual source folder: `/Users/mac/ai-doctor-starter-1/website gombita ` — **note the trailing
space in the directory name** (not `~/Desktop/…` as the brief said). The asset script will
default to this path and accept an `ASSETS_DIR` env override.

| File | Dimensions | Ratio | Content |
|---|---|---|---|
| `my own image 1.png` | 938×1080 | 0.87 | **Navy** cap, three-quarter front view |
| `my own image 2.png` | 906×1150 | 0.79 | **Navy** cap, back view (strap/buckle) |
| `my own image 3.png` | 866×1104 | 0.78 | **Navy** cap, straight front view |
| `my own image 4.png` | 952×1186 | 0.80 | **Navy** cap, extreme close-up of the chest emblem (detail shot) |
| `my own image 5.png` | 884×1094 | 0.81 | **Black** cap, straight front view |
| `my own image 6.png` | 920×1174 | 0.78 | **Black** cap, three-quarter front view |
| `my own image7.png` | 900×1060 | 0.85 | **Black** cap, back view |
| `image loggo GB00109564.png` | 1080×1920 | 0.56 | Off-white "G" monogram on a **transparent** canvas — the store logo, **not a product photo** |

All product photos are portrait (ratio 0.78–0.87), consistent studio style, light-gray
background — they crop cleanly into the brief's 4/5 and 3/4 frames with `object-cover`.

**Findings that change the build:**

1. **Only two colors have photos: navy ("blue") and black. There are zero green-cap photos.**
   Config keeps the three colors from the brief, but every variant-driven feature (hero
   cross-fade, image chips, gallery filter) must degrade gracefully for a variant with no
   imagery: the green chip renders as a swatch-filled chip instead of an image chip, and
   selecting green keeps the current hero (no fade to nothing). Recommendation: either add
   green photos to the folder and rerun `npm run assets`, or delete green from
   `site.config.ts` — both are one-line/no-code changes.
2. **The logo file is routed out of the product pipeline** by filename (`log(o|go)`) and
   handled by its own branch: trimmed to the monogram's bounding box (747×720), recoloured
   from off-white to `--primary` using its alpha channel as the mask, and exported at 2× the
   rendered height as `/images/logo.png` (83×80). It is the header brand mark and the source
   of the favicon / apple-touch-icon / icon.svg, all on an `--bg` plate.
3. **Predicted hero** (script prints its real reasoning at run time): `my own image 3.png` —
   portrait, straight-on front view, product fills the frame. `image 1` contains `1` in the
   filename which wins *ties* only; image 3's subject-fill contrast should outrank it.
   Predicted gallery order: navy ¾ (1) → black front (5) → navy back (2) → black ¾ (6) →
   black back (7) → emblem close-up (4, role `detail`, last).
4. **Heads-up on the photos themselves:** they are professional studio shots that prominently
   show a third-party crocodile emblem. Per your instruction, the build adds no brand name,
   logo, or emblem anywhere in code or copy — the title stays the plain-text
   `"Casquette Premium"` you control. Make sure you hold the rights to use these photographs
   commercially; that's outside what code can fix.

---

## 1. Stack & project shape

- Next.js 15 (App Router) + React 19 + TypeScript `strict`, in `casquette-store/`.
- Tailwind CSS v4, CSS-first theme: tokens declared once in `src/styles/tokens.css`
  (CSS custom properties) and mapped into Tailwind via `@theme` in `globals.css`.
  No default palette classes in components.
- Static-first: every page component is a server component; `'use client'` only on the
  interactive islands listed in §4. The one server dependency is `POST /api/order`
  (Node runtime, documented in DEPLOYMENT.md). With `NEXT_PUBLIC_ORDER_ENDPOINT` empty the
  client never calls the API route (mock mode), so the site also works fully static.
- Fonts: self-hosted `next/font/local` — **Inter Tight** (400–600 variable) for both
  display and UI. Single woff2 vendored into `src/app/fonts/`, latin subset.
  (Fraunces was the original display face; dropped with the navy-on-white palette —
  see DECISIONS.md §4.1.)
- Dependencies beyond the allowed list: **vitest** (devDependency) — the brief requires unit
  tests for `computeTotals()` and phone normalization but names no runner. Justified in
  DECISIONS.md. Nothing else.

## 2. Component tree

```
RootLayout (server) — fonts, metadata, JSON-LD Product, <body>
└─ ToastProvider (client, renders ToastRegion portal)
   └─ ProductProvider (client context: { colorId, quantity })
      ├─ Header (server — logo mark, or text wordmark when config.store.logo is null)
      ├─ main
      │  ├─ Hero (server shell)
      │  │  ├─ HeroImage (client: cross-fade on colorId change, LQIP, priority)
      │  │  ├─ PriceBlock (client: reacts to quantity discounts)
      │  │  ├─ ColorSelector (client: radiogroup of image chips — signature element)
      │  │  ├─ CtaScrollLink (client: scroll to #commander)
      │  │  └─ TrustStrip (server)
      │  ├─ Gallery (server shell)
      │  │  └─ GalleryCarousel (client: Embla, filter by colorId, "Tout voir" chip)
      │  │     └─ ImageZoom (client, next/dynamic — pinch/click zoom, focus trap)
      │  ├─ WhyBuy (server — split layout, one lifestyle/detail image)
      │  ├─ Reviews (server — 6 cards, initials avatars, snap-scroll/grid)
      │  └─ OrderSection (server shell, id="commander")
      │     └─ OrderForm (client: react-hook-form + zod)
      │        ├─ Input(name) · Input(phone)
      │        ├─ WilayaSelect → CommuneSelect (cascade, bundled data)
      │        ├─ ColorSegments (synced with ProductProvider)
      │        ├─ QuantityStepper (synced with ProductProvider)
      │        ├─ DeliveryTypeRadio (RadioCards, desk disabled when null)
      │        ├─ OrderSummary (live totals, 180ms number cross-fade, Skeleton)
      │        ├─ SubmitButton (live total in label, spinner)
      │        ├─ SuccessModal (next/dynamic) · ErrorModal (next/dynamic)
      │        └─ reassurance line
      ├─ Footer (server)
      ├─ StickyCta (client: IO on hero CTA + order section, body padding)
      ├─ BackToTop (client: hides while StickyCta visible)
      └─ WhatsAppFab (client-ish; hidden when whatsapp === '')
```

Shared primitives in `ui/`: Button, Input, Select, RadioCard, Rating, Toast, Skeleton,
Modal, StickyCta, BackToTop, WhatsAppFab, Reveal (IO-driven, reduced-motion aware).
A temporary `/dev` route renders every primitive in every state; deleted before final commit.

**Sections (current):** Header → Hero → Gallery → WhyBuy → Reviews → OrderSection → Footer.
Features and FAQ were removed after the first build, along with the `Accordion` primitive
(its only consumer) and the `FAQPage` JSON-LD.

## 3. Data flow

```
BUILD TIME
  "website gombita /"  ──sharp──▶  scripts/prepare-assets.mjs
      • hash → cache (.assets-cache.json), idempotent
      • LAB distance vs config swatches → variant (blue | black | unassigned)
      • hero heuristic (prints reasoning) · gallery ordering · LQIP
      • webp+avif × [420,640,828,1080,1440] → public/images/
      ▼
  src/data/gallery.generated.ts  (typed manifest: HERO_IMAGE, GALLERY_IMAGES)

IMPORT TIME
  site.config.ts ──zod.parse──▶ typed config (typo = build failure)

RUNTIME (client)
  ProductProvider { colorId, quantity }
      ▲ ColorSelector / ColorSegments (two-way)
      ▲ QuantityStepper
      ▼ HeroImage · GalleryCarousel filter · PriceBlock · StickyCta · OrderForm payload
  react-hook-form (OrderForm only): name, phone, wilaya, commune, deliveryType
      wilaya change ─▶ communes[wilaya] repopulated + commune reset + reprice (same render)
      all pricing via computeTotals(config, wilaya, deliveryType, qty)  ← single pure fn,
      unit-tested, used by OrderSummary AND the submit payload
  drafts: localStorage "casquette:draft" (400ms debounce) — rehydrate on mount, clear on success

SUBMIT
  useOrderSubmit (state machine idle→submitting→success|error, module-level in-flight guard)
      orderId = CAP-{YYMMDD}-{base32×6}, generated once per form session
      endpoint === '' ─▶ MOCK: 900ms wait, console.log payload, succeed
      else ─▶ POST /api/order (retries ×2, backoff 1s/3s, on network+5xx only)
              route: zod re-validate, recompute money server-side from wilaya data,
              timestamp Africa/Algiers, rate-limit 5/10min/IP,
              forward → ORDER_ENDPOINT (Apps Script) with x-order-token, 12s abort
      network fail ─▶ queue "casquette:pending", auto-retry on mount + 'online' event
```

## 4. State ownership (who owns what — no duplication)

| State | Owner | Consumers |
|---|---|---|
| `colorId` | ProductProvider | ColorSelector, ColorSegments, HeroImage, Gallery filter, payload |
| `quantity` | ProductProvider | QuantityStepper, PriceBlock, StickyCta, OrderSummary, payload |
| name/phone/wilaya/commune/deliveryType | react-hook-form (OrderForm) | fields, OrderSummary, payload |
| derived totals | nobody — always recomputed via `computeTotals()` | OrderSummary, SubmitButton label, StickyCta, payload |
| submission machine | `useOrderSubmit` | SubmitButton, modals |
| toasts | ToastProvider | anything via `useToast()` |
| modal open/close | OrderForm local state | SuccessModal, ErrorModal |
| sticky bar visibility | `useStickyCta` (two IntersectionObservers) | StickyCta, BackToTop, body padding |
| draft/pending queue | `lib/storage.ts` (localStorage) | OrderForm, useOrderSubmit |

Color/quantity are context-owned and injected into the zod payload at submit — they are
valid by construction, so RHF never double-owns them (no two-way-sync bugs).

## 5. File list

As specified in brief §5, verbatim, plus:

- `src/styles/tokens.css` — CSS custom properties (palette, radii, shadows, easing)
- `src/app/fonts/` — vendored woff2 (InterTight variable, 43.9 KB)
- `scripts/.assets-cache.json` — content-hash cache (gitignored)
- `src/app/dev/page.tsx` — primitive showcase (deleted in phase 10)
- `src/lib/__tests__/format.test.ts`, `validation.test.ts` — vitest
- `vitest.config.ts`
- `.gitignore` additions: `public/images/`, `.assets-cache.json`, `.env.local`

Wilaya/commune data: all 58 wilayas (codes 01–58, French + Arabic names, per-wilaya
home/desk prices in the brief's bands; `desk: null` where no agency) and the full commune
list (~1 540 communes) generated into `src/data/wilayas.ts` / `communes.ts` at authoring
time — bundled, no runtime fetch. Estimated cost ≈ 15 KB gzipped, inside the 100 KB budget;
if the final bundle report breaks budget, communes move to a chunk preloaded when the order
section first approaches the viewport (still no user-visible latency).

## 6. Decisions made without asking (will be in DECISIONS.md)

1. Green variant ships without photos → swatch chip + no hero fade (see §0.1).
2. Logo is the header mark: trimmed, recoloured to `--primary`, 32/40px (see §0.2).
3. Assets path defaults to the real folder (with trailing space); `ASSETS_DIR` overrides.
4. Inter Tight alone (over Instrument Serif / General Sans / Fraunces) — variable-font
  woff2 availability, better French diacritics, and one family for the whole page.
5. vitest added as the only extra (dev) dependency.
6. `og.jpg` generated by the asset script from the hero at 1200×630 (background-padded).
7. Deployment default = Vercel/Node (API route works); DEPLOYMENT.md also documents pure
  static export (mock/no-proxy) since the architecture stays `output: 'export'`-compatible.
8. Phone rule: mobile prefixes 05/06/07 accepted per config regex; landlines rejected with
  the brief's message.

## 7. Build order (= brief §17)

1. Scaffold: Next+TS+Tailwind, tokens, fonts, `cn()`, ui/ primitives, `/dev` route
2. Assets: `prepare-assets.mjs` → manifest; print hero reasoning + gallery order
3. Data: wilayas + communes, `computeTotals()`, unit tests (pricing, phone)
4. Static sections: Hero, WhyBuy, Reviews, Footer + Reveal
5. Gallery + ImageZoom
6. Order form: fields, validation, cascading selects, live summary
7. Submission: API route, Code.gs, mock mode, retries, offline queue, modals, toasts
8. StickyCta, BackToTop, WhatsAppFab
9. SEO + a11y + performance pass (Lighthouse to `lighthouse.json`, axe, keyboard walkthrough)
10. Docs: README, DEPLOYMENT.md, GOOGLE_SHEETS.md, DECISIONS.md, `.env.example`; delete `/dev`

`npm run build` + `npm run lint` after every phase; no phase starts on a broken build.
