# Deployment

## What the app needs

One Node.js route — `POST /api/order` — which proxies orders to Google Apps
Script. Everything else is static. That gives you two deployment options.

### Option A — Vercel (recommended)

Handles the API route with no configuration.

1. Push the repo to GitHub.
2. On <https://vercel.com/new>, import it. Framework preset: **Next.js**
   (auto-detected). Root directory: `casquette-store`.
3. Add the environment variables (**Settings ▸ Environment Variables**),
   for Production *and* Preview:

   | Name | Value | Exposed to browser |
   |---|---|---|
   | `NEXT_PUBLIC_ORDER_ENDPOINT` | `/api/order` | yes |
   | `ORDER_ENDPOINT` | your Apps Script `/exec` URL | no |
   | `ORDER_TOKEN` | the shared secret | no |

4. **Deploy.** Then set your real domain in
   [`src/config/site.config.ts`](src/config/site.config.ts) → `seo.siteUrl`, and in
   [`public/robots.txt`](public/robots.txt) → `Sitemap:`. Redeploy.

Build command and output are the defaults (`next build`). The image pipeline is
**not** part of the build — see below.

### Option B — Static hosting (Netlify Drop, GitHub Pages, any CDN)

Works if you accept one trade-off: **without a server there is no proxy**, so the
form must either stay in mock mode or post straight to Apps Script from the
browser (which exposes the endpoint and needs CORS). Recommended only for a
preview/demo.

Add to `next.config.ts`:

```ts
const nextConfig: NextConfig = {
  output: "export",
  images: { loader: "custom", loaderFile: "./src/lib/imageLoader.ts", /* … */ },
};
```

Then `npm run build` writes a fully static `out/`. The architecture is already
export-compatible: no server components fetch data, no middleware, and images are
pre-generated at fixed widths rather than optimized at runtime.

---

## Images are generated, not committed

`public/images/`, `public/og.jpg` and the icons are **gitignored build artifacts**.
They are produced from the raw photo folder by:

```bash
npm run assets
```

This must run on any machine that builds the site. Two ways to handle it:

- **Simplest:** run `npm run assets` locally, then un-ignore `public/images/`
  (delete those lines from `.gitignore`) and commit the generated files. The
  build then needs nothing extra. ~2 MB.
- **Cleaner:** copy the source photos into the repo (e.g. `assets-src/`), set
  `ASSETS_DIR=./assets-src`, and change the build script to
  `"build": "npm run assets && next build"`.

If neither is done, the build fails with a clear message and falls back to a
gray placeholder manifest so the dev server still boots.

---

## Before going live

- [ ] `seo.siteUrl` set to the real domain (config) and in `robots.txt`
- [ ] `store.whatsapp` filled in, or left `''` to hide the floating button
- [ ] Real reviews in `src/data/reviews.ts` (the current six are placeholders,
      and the JSON-LD `aggregateRating` describes them)
- [ ] `npm run assets` run, hero and gallery order checked in the printed output
- [ ] Apps Script deployed and one test order verified in the sheet
      (see [GOOGLE_SHEETS.md](GOOGLE_SHEETS.md))
- [ ] Shipping prices in `src/data/wilayas.ts` matched to your courier's rates

## Local commands

```bash
npm run dev        # dev server on :3000
npm run assets     # regenerate images + manifest from the photo folder
npm run build      # production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest (pricing + phone normalization)
```
