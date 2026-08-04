#!/usr/bin/env node
/**
 * prepare-assets.mjs — build-time image pipeline (npm run assets)
 *
 * Reads the raw photo folder, analyses every image with sharp (dimensions,
 * dominant/average color, LQIP), infers the color variant by LAB distance to
 * the config swatches, picks the hero with a ranked heuristic (reasoning is
 * printed), orders the gallery, and emits avif/webp/jpeg renditions at fixed
 * widths into public/images/ plus a typed manifest at
 * src/data/gallery.generated.ts. Idempotent: cached by content hash.
 * Source files are never modified.
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const ROOT = process.cwd();
const DEFAULT_SRC = "/Users/mac/ai-doctor-starter-1/website gombita ";
const SRC_DIR = process.env.ASSETS_DIR ?? DEFAULT_SRC;
/** Filled from tokens.css in main() — the palette is never hardcoded here. */
let TOKENS = { bg: "#ffffff", surface: "#f6f7f9", primary: "#133458" };
const OUT_DIR = path.join(ROOT, "public", "images");
const CACHE_FILE = path.join(ROOT, "scripts", ".assets-cache.json");
const MANIFEST = path.join(ROOT, "src", "data", "gallery.generated.ts");
const OG_FILE = path.join(ROOT, "public", "og.jpg");

const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".avif"]);
const IGNORED_NAMES = new Set([".ds_store", "thumbs.db"]);
const MIN_BYTES = 20 * 1024;
/** 128/256 serve the small color chips; 420–1440 the hero/gallery (see DECISIONS.md) */
const WIDTHS = [128, 256, 420, 640, 828, 1080, 1440];
const WEBP_QUALITY = 78;
const AVIF_QUALITY = 62;

/* ---------------------------------------------------------------- config -- */

/** Reads the design tokens so the script can never drift from the palette. */
async function readTokens() {
  const css = await fs.readFile(
    path.join(ROOT, "src", "styles", "tokens.css"),
    "utf8",
  );
  const pick = (name, fallback) =>
    css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`))?.[1] ?? fallback;
  return {
    bg: pick("bg", "#ffffff"),
    surface: pick("surface", "#f6f7f9"),
    primary: pick("primary", "#133458"),
  };
}

async function readConfig() {
  // The config is TypeScript; parse the literals we need instead of importing.
  const src = await fs.readFile(
    path.join(ROOT, "src", "config", "site.config.ts"),
    "utf8",
  );
  const colors = [];
  const colorRe =
    /\{\s*id:\s*"(\w+)",\s*label:\s*"([^"]+)",\s*swatch:\s*"(#[0-9A-Fa-f]{6})"\s*\}/g;
  for (const m of src.matchAll(colorRe)) {
    colors.push({ id: m[1], label: m[2], swatch: m[3] });
  }
  const title = src.match(/productTitle:\s*"([^"]+)"/)?.[1] ?? "Produit";
  if (colors.length === 0) {
    throw new Error("Could not parse colors from site.config.ts");
  }
  return { colors, title };
}

/* ----------------------------------------------------------------- color -- */

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function rgbToLab({ r, g, b }) {
  const srgb = [r / 255, g / 255, b / 255].map((v) =>
    v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92,
  );
  const [lr, lg, lb] = srgb;
  // sRGB D65
  let x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047;
  let y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722;
  let z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  [x, y, z] = [f(x), f(y), f(z)];
  return { L: 116 * y - 16, a: 500 * (x - y), b: 200 * (y - z) };
}

function labDistance(c1, c2) {
  const l1 = rgbToLab(c1);
  const l2 = rgbToLab(c2);
  return Math.hypot(l1.L - l2.L, l1.a - l2.a, l1.b - l2.b);
}

/* -------------------------------------------------------------- analysis -- */

/**
 * Pixel-level analysis on a downscaled RGBA copy:
 * 1. estimate the background color from the four corner patches
 *    (transparent pixels count as background — logos on alpha);
 * 2. segment "subject" pixels = opaque AND far from the background in LAB;
 * 3. derive subject mean color (variant inference), subject coverage
 *    (hero contrast score + close-up detection) and average color.
 */
async function analyse(filePath, buffer) {
  const base = sharp(buffer, { failOn: "none" }).rotate();
  const meta = await base.metadata();
  const fullWidth = meta.width ?? 0;
  const fullHeight = meta.height ?? 0;
  const ratio = fullWidth / fullHeight;

  const { data, info } = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: 120 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const px = (x, y) => {
    const i = (y * w + x) * 4;
    return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
  };

  // Background = mean of opaque corner-patch pixels (10% patches).
  const patch = Math.max(3, Math.round(Math.min(w, h) * 0.1));
  let bg = { r: 0, g: 0, b: 0 };
  let bgCount = 0;
  for (const [x0, y0] of [
    [0, 0],
    [w - patch, 0],
    [0, h - patch],
    [w - patch, h - patch],
  ]) {
    for (let y = y0; y < y0 + patch; y++) {
      for (let x = x0; x < x0 + patch; x++) {
        const p = px(x, y);
        if (p.a > 200) {
          bg.r += p.r;
          bg.g += p.g;
          bg.b += p.b;
          bgCount++;
        }
      }
    }
  }
  if (bgCount > 0) {
    bg = { r: bg.r / bgCount, g: bg.g / bgCount, b: bg.b / bgCount };
  } else {
    bg = { r: 245, g: 245, b: 245 }; // fully transparent corners
  }

  // Subject segmentation.
  const SUBJECT_DELTA = 18;
  let subject = { r: 0, g: 0, b: 0 };
  let subjectCount = 0;
  let total = 0;
  const avg = { r: 0, g: 0, b: 0 };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = px(x, y);
      total++;
      avg.r += p.r;
      avg.g += p.g;
      avg.b += p.b;
      if (p.a > 200 && labDistance(p, bg) > SUBJECT_DELTA) {
        subject.r += p.r;
        subject.g += p.g;
        subject.b += p.b;
        subjectCount++;
      }
    }
  }
  avg.r /= total;
  avg.g /= total;
  avg.b /= total;
  const subjectFraction = subjectCount / total;
  if (subjectCount > 0) {
    subject = {
      r: subject.r / subjectCount,
      g: subject.g / subjectCount,
      b: subject.b / subjectCount,
    };
  } else {
    subject = avg;
  }

  // LQIP: 20px wide blurred jpeg as data URI (alpha flattened on page bg)
  const lqipBuf = await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize(20)
    .flatten({ background: TOKENS.bg })
    .blur(1.5)
    .jpeg({ quality: 40 })
    .toBuffer();
  const lqip = `data:image/jpeg;base64,${lqipBuf.toString("base64")}`;

  return {
    width: fullWidth,
    height: fullHeight,
    ratio,
    orientation: ratio < 0.9 ? "portrait" : ratio <= 1.1 ? "square" : "landscape",
    bytes: buffer.length,
    average: avg,
    background: bg,
    subject,
    subjectFraction,
    lqip,
  };
}

function inferVariant(info, colors) {
  // For close-ups the fabric IS the "background"; for studio shots it's the subject.
  const productColor = info.isCloseUp ? info.background : info.subject;
  const productLab = rgbToLab(productColor);
  // Near-white product (logo/graphic) or almost no subject at all → not a product photo.
  if (productLab.L > 82 || (!info.isCloseUp && info.subjectFraction < 0.03)) {
    return { variant: "excluded", distances: [] };
  }

  const distances = colors
    .map((c) => ({
      id: c.id,
      d: labDistance(productColor, hexToRgb(c.swatch)),
    }))
    .sort((a, b) => a.d - b.d);

  const best = distances[0];
  const second = distances[1];
  // Ambiguous: nothing close, or two variants nearly tied.
  if (best.d > 35 || (second && second.d - best.d < 4)) {
    return { variant: "unassigned", distances };
  }
  return { variant: best.id, distances };
}

/* ------------------------------------------------------------ hero logic -- */

function heroScore(img) {
  const orientationScore =
    img.orientation === "portrait" ? 2 : img.orientation === "square" ? 1 : 0;
  const resolutionScore = (img.width * img.height) / 1_000_000; // MP
  // Product fills the frame (but a close-up wall of fabric is capped elsewhere).
  const contrastScore = img.subjectFraction * 3;
  const nameBonus = /hero|main|principal|1|cover/i.test(img.file) ? 0.001 : 0;
  return {
    total: orientationScore * 10 + resolutionScore + contrastScore + nameBonus,
    orientationScore,
    resolutionScore,
    contrastScore,
    nameBonus,
  };
}

/* ---------------------------------------------------------------- output -- */

async function emitRenditions(buffer, id, cache) {
  const outputs = {};
  for (const w of WIDTHS) {
    for (const [ext, opts] of [
      ["avif", { quality: AVIF_QUALITY }],
      ["webp", { quality: WEBP_QUALITY }],
    ]) {
      const name = `${id}-${w}.${ext}`;
      const target = path.join(OUT_DIR, name);
      if (!existsSync(target)) {
        await sharp(buffer, { failOn: "none" })
          .rotate()
          .resize({ width: w, withoutEnlargement: true })
          .toFormat(ext, opts)
          .toFile(target);
      }
      outputs[`${ext}-${w}`] = `/images/${name}`;
    }
  }
  // Single jpeg fallback at 1080
  const fbName = `${id}-1080.jpg`;
  const fbTarget = path.join(OUT_DIR, fbName);
  if (!existsSync(fbTarget)) {
    await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize({ width: 1080, withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(fbTarget);
  }
  cache.emitted = cache.emitted ?? {};
  return outputs;
}

function manifestEntry(img, role, order, alt) {
  return `  {
    id: ${JSON.stringify(img.id)},
    alt: ${JSON.stringify(alt)},
    width: ${img.width},
    height: ${img.height},
    variant: ${JSON.stringify(img.variant)},
    role: ${JSON.stringify(role)},
    lqip: ${JSON.stringify(img.lqip)},
    src: {
      avif: ${JSON.stringify(`/images/${img.id}-{w}.avif`)},
      webp: ${JSON.stringify(`/images/${img.id}-{w}.webp`)},
      fallback: ${JSON.stringify(`/images/${img.id}-1080.jpg`)},
    },
    order: ${order},
  }`;
}

async function writeManifest(hero, gallery, colors) {
  await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
  const lines = [];
  lines.push("// GENERATED by scripts/prepare-assets.mjs — do not edit by hand.");
  lines.push("// Rerun `npm run assets` after changing the photo folder.");
  lines.push('import type { ProductImage } from "@/types";');
  lines.push("");
  lines.push(
    `export const HERO_IMAGE: ProductImage = ${hero ? "\n" + manifestEntry(hero, "hero", 0, hero.alt).trim() : "PLACEHOLDER"};`,
  );
  lines.push("");
  lines.push("export const GALLERY_IMAGES: ProductImage[] = [");
  gallery.forEach((img, i) => {
    lines.push(manifestEntry(img, img.role, i + 1, img.alt) + ",");
  });
  lines.push("];");
  lines.push("");
  lines.push(
    "/** Variants that actually have at least one photo (drives chip rendering). */",
  );
  const withPhotos = new Set(
    [hero, ...gallery]
      .filter((i) => i && i.variant !== "unassigned")
      .map((i) => i.variant),
  );
  lines.push(
    `export const VARIANTS_WITH_PHOTOS: string[] = ${JSON.stringify([...withPhotos])};`,
  );
  lines.push("");
  lines.push("/** Best image per variant, for hero cross-fade + color chips. */");
  lines.push("export const VARIANT_IMAGES: Record<string, ProductImage> = {");
  for (const c of colors) {
    const best =
      (hero && hero.variant === c.id ? hero : null) ??
      gallery.find((g) => g.variant === c.id);
    if (best) {
      const role = best === hero ? "hero" : best.role;
      lines.push(`  ${JSON.stringify(c.id)}: ${manifestEntry(best, role, best === hero ? 0 : best.orderIndex ?? 1, best.alt).trim()},`);
    }
  }
  lines.push("};");
  lines.push("");
  await fs.writeFile(MANIFEST, lines.join("\n") + "\n");
}

async function writePlaceholderManifest() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const name = "placeholder-1080.jpg";
  const target = path.join(OUT_DIR, name);
  if (!existsSync(target)) {
    await sharp({
      create: {
        width: 1080,
        height: 1350,
        channels: 3,
        background: { r: 221, g: 215, b: 210 },
      },
    })
      .jpeg({ quality: 60 })
      .toFile(target);
  }
  for (const w of WIDTHS) {
    for (const ext of ["avif", "webp"]) {
      const t = path.join(OUT_DIR, `placeholder-${w}.${ext}`);
      if (!existsSync(t)) {
        await sharp({
          create: {
            width: w,
            height: Math.round(w * 1.25),
            channels: 3,
            background: { r: 221, g: 215, b: 210 },
          },
        })
          .toFormat(ext)
          .toFile(t);
      }
    }
  }
  const img = {
    id: "placeholder",
    width: 1080,
    height: 1350,
    variant: "unassigned",
    lqip: "data:image/gif;base64,R0lGODlhAQABAIAAAN3X0gAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
    alt: "",
  };
  await writeManifest({ ...img, alt: "Photo du produit" }, [], []);
  console.error(
    "\n⚠ PLACEHOLDER manifest written — the site boots but shows gray boxes.",
  );
}

/* ------------------------------------------------------------- logo/icons -- */

/**
 * The source logo is an off-white monogram (~rgb(245,243,239)) on a fully
 * transparent canvas — invisible if rendered as-is on the page background.
 * The alpha channel is a clean mask, so recolouring is exact: trim to the
 * mark's bounding box, take its alpha, and use it as the mask over a solid
 * --primary fill. No tracing, no duotone guesswork.
 * Returns { src, width, height } for config.store.logo, or null if the file
 * is missing or its mark turns out to be dark enough to use unrecoloured.
 */
const LOGO_RENDER_HEIGHT = 40; // desktop height in CSS px; exported at 2×
let PRIMARY = "#133458"; // overwritten from tokens.css at startup
let PLATE = "#ffffff"; //     ditto (--bg, for the icon plates)

async function tintLogo(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .trim({ threshold: 5 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels < 4) return null;

  const raw = { width: info.width, height: info.height, channels: info.channels };
  const alpha = await sharp(data, { raw }).extractChannel(3).raw().toBuffer();

  // Report the mark's real colour so the recolour decision is visible.
  const opaque = [];
  for (let i = 0; i < alpha.length; i++) {
    if (alpha[i] > 200) opaque.push(i);
  }
  let r = 0, g = 0, b = 0;
  for (const i of opaque) {
    r += data[i * 4];
    g += data[i * 4 + 1];
    b += data[i * 4 + 2];
  }
  const n = Math.max(opaque.length, 1);
  const mark = { r: r / n, g: g / n, b: b / n };
  const markLab = rgbToLab(mark);
  console.log(
    `\n─ Logo ──────────────────────────────────────────────────\n` +
      `  trimmed to ${info.width}×${info.height} (was ${(await sharp(file).metadata()).width}×${(await sharp(file).metadata()).height})\n` +
      `  mark colour rgb(${Math.round(mark.r)}, ${Math.round(mark.g)}, ${Math.round(mark.b)}) — L*=${markLab.L.toFixed(1)}`,
  );

  const needsRecolour = markLab.L > 60;
  console.log(
    needsRecolour
      ? `  → light mark on transparent canvas: recoloured to --primary ${PRIMARY}`
      : `  → mark is already dark enough: kept as-is`,
  );

  const tinted = needsRecolour
    ? await sharp({
        create: {
          width: info.width,
          height: info.height,
          channels: 3,
          background: PRIMARY,
        },
      })
        .joinChannel(alpha, { raw: { ...raw, channels: 1 } })
        .png()
        .toBuffer()
    : await sharp(data, { raw }).png().toBuffer();

  return { buffer: tinted, width: info.width, height: info.height };
}

async function emitLogo(file) {
  const logo = await tintLogo(file);
  if (!logo) return null;

  // 2× the rendered height, so it stays sharp on retina.
  const outH = LOGO_RENDER_HEIGHT * 2;
  const outW = Math.round((logo.width / logo.height) * outH);
  await sharp(logo.buffer)
    .resize({ height: outH })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, "logo.png"));

  console.log(`  → /images/logo.png at ${outW}×${outH} (renders at ${LOGO_RENDER_HEIGHT}px)`);
  return { src: "/images/logo.png", width: outW, height: outH, buffer: logo.buffer };
}

function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  const dir = Buffer.alloc(16);
  dir[0] = size >= 256 ? 0 : size;
  dir[1] = size >= 256 ? 0 : size;
  dir.writeUInt16LE(1, 4); // planes
  dir.writeUInt16LE(32, 6); // bpp
  dir.writeUInt32LE(png.length, 8);
  dir.writeUInt32LE(22, 12); // offset
  return Buffer.concat([header, dir, png]);
}

/** Square icon: the trimmed mark on a --bg plate, with ~12% padding. */
async function iconFromLogo(logoBuffer, size) {
  const inner = Math.round(size * 0.76);
  const mark = await sharp(logoBuffer)
    .resize({ width: inner, height: inner, fit: "inside" })
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 3, background: PLATE },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toBuffer();
}

async function emitIcons(logo) {
  if (!logo) return;
  const png32 = await iconFromLogo(logo.buffer, 32);
  await fs.writeFile(path.join(ROOT, "public", "favicon.ico"), pngToIco(png32, 32));
  const png180 = await iconFromLogo(logo.buffer, 180);
  await fs.writeFile(path.join(ROOT, "public", "apple-touch-icon.png"), png180);
  // icon.svg embeds the same PNG so every icon is the one mark.
  const png256 = await iconFromLogo(logo.buffer, 256);
  await fs.writeFile(
    path.join(ROOT, "public", "icon.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">\n` +
      `  <image href="data:image/png;base64,${png256.toString("base64")}" width="256" height="256"/>\n` +
      `</svg>\n`,
  );
}

/* ------------------------------------------------------------------- main -- */

async function main() {
  TOKENS = await readTokens();
  PRIMARY = TOKENS.primary;
  PLATE = TOKENS.bg;
  const { colors, title } = await readConfig();

  let entries;
  try {
    entries = await fs.readdir(SRC_DIR, { recursive: true, withFileTypes: true });
  } catch {
    console.error(`✖ Assets folder not found: ${JSON.stringify(SRC_DIR)}`);
    console.error("  Set ASSETS_DIR or create the folder, then rerun `npm run assets`.");
    await writePlaceholderManifest();
    process.exitCode = 1;
    return;
  }

  const allFiles = entries
    .filter((e) => e.isFile())
    .map((e) => path.join(e.parentPath ?? e.path, e.name))
    .filter((p) => EXTENSIONS.has(path.extname(p).toLowerCase()))
    .filter((p) => !IGNORED_NAMES.has(path.basename(p).toLowerCase()));

  // The brand mark is handled separately — it is not a product photo.
  const logoFile = allFiles.find((p) => /log(o|go)/i.test(path.basename(p)));
  const files = allFiles.filter((p) => p !== logoFile);

  if (files.length === 0) {
    console.error(`✖ No usable images in ${JSON.stringify(SRC_DIR)}`);
    await writePlaceholderManifest();
    process.exitCode = 1;
    return;
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  let cache = {};
  try {
    cache = JSON.parse(await fs.readFile(CACHE_FILE, "utf8"));
  } catch {
    /* first run */
  }

  const images = [];
  for (const file of files) {
    const buffer = await fs.readFile(file);
    if (buffer.length < MIN_BYTES) {
      console.log(`· skip (<20 KB): ${path.basename(file)}`);
      continue;
    }
    const hash = createHash("sha1").update(buffer).digest("hex").slice(0, 10);
    const id = `img-${hash}`;

    let info;
    if (cache[hash]?.info) {
      info = cache[hash].info;
    } else {
      try {
        info = await analyse(file, buffer);
      } catch (err) {
        console.error(`✖ Could not read ${path.basename(file)}: ${err.message}`);
        continue;
      }
      cache[hash] = { info, file: path.basename(file) };
    }

    // Close-up detection first: studio shots have a light background; a dark
    // "background" means the product itself fills the frame (zoom/detail shot).
    info.isCloseUp = rgbToLab(info.background).L < 70 || info.subjectFraction > 0.65;
    const { variant, distances } = inferVariant(info, colors);
    if (variant === "excluded") {
      console.log(
        `· excluded (graphic/logo, not a product photo): ${path.basename(file)}`,
      );
      continue;
    }

    await emitRenditions(buffer, id, cache[hash]);
    images.push({
      ...info,
      id,
      file: path.basename(file),
      buffer,
      variant,
      distances,
    });
  }

  await fs.writeFile(
    CACHE_FILE,
    JSON.stringify(
      Object.fromEntries(
        Object.entries(cache).map(([k, v]) => [k, { info: v.info, file: v.file }]),
      ),
      null,
      0,
    ),
  );

  if (images.length === 0) {
    console.error("✖ Every image was excluded or unreadable.");
    await writePlaceholderManifest();
    process.exitCode = 1;
    return;
  }

  /* Role classification (computed during analysis: dark background or
     subject covering most of the frame = close-up detail shot) */
  for (const img of images) {
    img.role = img.isCloseUp ? "detail" : "gallery";
  }

  /* Hero pick — print the reasoning */
  const candidates = images.filter((i) => i.role !== "detail");
  const pool = candidates.length > 0 ? candidates : images;
  const scored = pool
    .map((img) => ({ img, s: heroScore(img) }))
    .sort((a, b) => b.s.total - a.s.total);
  const hero = scored[0].img;

  console.log("\n─ Hero selection ─────────────────────────────────────────");
  for (const { img, s } of scored) {
    console.log(
      `  ${img === hero ? "▶" : " "} ${img.file.padEnd(28)} ${img.orientation.padEnd(9)}` +
        ` ${img.width}×${img.height}  fill=${(img.subjectFraction * 100).toFixed(0)}%` +
        `  variant=${img.variant}  score=${s.total.toFixed(3)}`,
    );
  }
  console.log(
    `  → "${hero.file}" wins: ${hero.orientation}, ${hero.width}×${hero.height},` +
      ` highest combined orientation+resolution+contrast score` +
      (/hero|main|principal|1|cover/i.test(hero.file) ? " (filename tie-bonus applied)" : ""),
  );

  /* Gallery order: one strong shot per variant (config order) → rest → details last */
  const rest = images.filter((i) => i !== hero);
  const ordered = [];
  for (const c of colors) {
    const best = rest
      .filter((i) => i.variant === c.id && i.role === "gallery" && !ordered.includes(i))
      .sort((a, b) => heroScore(b).total - heroScore(a).total)[0];
    if (best) ordered.push(best);
  }
  const remaining = rest
    .filter((i) => !ordered.includes(i))
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === "detail" ? 1 : -1;
      return heroScore(b).total - heroScore(a).total;
    });
  ordered.push(...remaining);

  /* Alt text */
  const viewNames = {};
  const labelFor = (v) => colors.find((c) => c.id === v)?.label?.toLowerCase();
  const altFor = (img, isHero) => {
    const colorPart = labelFor(img.variant)
      ? ` coloris ${labelFor(img.variant)}`
      : "";
    if (img.role === "detail") return `${title}${colorPart} — gros plan sur la matière`;
    if (isHero) return `${title}${colorPart} — vue principale`;
    viewNames[img.variant] = (viewNames[img.variant] ?? 0) + 1;
    return `${title}${colorPart} — vue ${viewNames[img.variant]}`;
  };
  hero.alt = altFor(hero, true);
  ordered.forEach((img, i) => {
    img.alt = altFor(img, false);
    img.orderIndex = i + 1;
  });

  console.log("\n─ Gallery order ──────────────────────────────────────────");
  ordered.forEach((img, i) =>
    console.log(`  ${i + 1}. ${img.file.padEnd(28)} ${img.variant.padEnd(10)} ${img.role}`),
  );

  await writeManifest(hero, ordered, colors);

  /* OG image 1200×630 from the hero on the page background */
  await sharp(hero.buffer, { failOn: "none" })
    .rotate()
    .resize({ width: 1200, height: 630, fit: "contain", background: TOKENS.bg })
    .flatten({ background: TOKENS.bg })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(OG_FILE);

  /* Brand mark: recoloured logo + the icons derived from it */
  let logo = null;
  if (logoFile) {
    try {
      logo = await emitLogo(logoFile);
    } catch (err) {
      console.error(`✖ Could not process the logo: ${err.message}`);
      console.error("  Leave config.store.logo as null — the text wordmark stays.");
    }
  } else {
    console.log("\n· No logo file found (looked for a filename containing 'logo').");
  }
  await emitIcons(logo);

  console.log(`\n✓ ${images.length} images → ${path.relative(ROOT, OUT_DIR)}/`);
  console.log(`✓ Manifest → ${path.relative(ROOT, MANIFEST)}`);
  console.log(
    `✓ og.jpg${logo ? ", logo.png" : ""}, favicon.ico, apple-touch-icon.png, icon.svg`,
  );
  if (logo) {
    console.log(
      `\n  site.config.ts → store.logo (paste if these numbers changed):\n` +
        `    logo: { src: "${logo.src}", width: ${logo.width}, height: ${logo.height} },`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
