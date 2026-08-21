import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

import { SERVER_CONFIG } from "@norish/config/env-config-server";
import { serverLogger as log } from "@norish/shared-server/logger";

/**
 * The Dish Colour (ADR-0023): one colour taken from a recipe's primary image
 * when that image is stored, kept on the recipe so a page can be tinted
 * before the photo has arrived. Extraction is derivation, not supply — the
 * colour never travels in a Recipe Archive, and a recipe with no image has
 * none and renders on the plain theme background.
 *
 * Everything here is deliberately non-fatal: a recipe write that carries an
 * image must never fail because the colour could not be read from it, so
 * every path out of this module is a hex string or null, never a throw.
 */

const RECIPES_BASE_DIR = path.join(SERVER_CONFIG.UPLOADS_DIR, "recipes");

/** The stored primary-image URL shape, as written by media/storage.ts. */
const RECIPE_IMAGE_URL_PATTERN = /^\/recipes\/([a-f0-9-]{36})\/([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)$/i;

/** Enough pixels to speak for the photo, few enough to cost nothing. */
const SAMPLE_SIZE = 64;

function toHexChannel(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, "0");
}

function srgbChannelToLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function linearChannelToSrgb(channel: number): number {
  return channel <= 0.0031308 ? channel * 12.92 : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
}

/** sRGB (0–255) → OKLab, per Ottosson. */
function oklabFromSrgb(red: number, green: number, blue: number): { L: number; a: number; b: number } {
  const r = srgbChannelToLinear(red / 255);
  const g = srgbChannelToLinear(green / 255);
  const b = srgbChannelToLinear(blue / 255);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

/** OKLab → sRGB channels in [0, 1]; out-of-gamut values fall outside it. */
function srgbFromOklab(L: number, a: number, b: number): { r: number; g: number; b: number } {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);

  return {
    r: linearChannelToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: linearChannelToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: linearChannelToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

function hexFromOklch(L: number, c: number, h: number): string {
  // Reduce chroma until the colour fits sRGB — the standard oklch gamut
  // mapping, so the stored hex keeps its hue rather than clipping to a
  // different one channel by channel.
  let chroma = c;

  for (let step = 0; step < 12; step++) {
    const { r, g, b } = srgbFromOklab(L, chroma * Math.cos(h), chroma * Math.sin(h));

    if (r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1) {
      return `#${toHexChannel(r * 255)}${toHexChannel(g * 255)}${toHexChannel(b * 255)}`;
    }

    chroma *= 0.75;
  }

  const { r, g, b } = srgbFromOklab(L, 0, 0);

  return `#${toHexChannel(r * 255)}${toHexChannel(g * 255)}${toHexChannel(b * 255)}`;
}

/**
 * One colour for the dish, as `#rrggbb`. Deliberately not the histogram
 * dominant — on a food photo the dominant bin is usually the white plate or
 * the worktop, which yields a colour that tints nothing (the glossary's
 * _Avoid_ list already refuses "dominant colour" as a name). Instead every
 * sampled pixel votes for its OKLCH hue with the square of its chroma, so
 * the saturated food outvotes the neutral background regardless of area;
 * the stored lightness and chroma are the same vote's averages, so the hex
 * itself looks like the dish. A genuinely neutral photo has no meaningful
 * votes and falls back to its plain average — a grey that tints as grey.
 *
 * Returns null for anything sharp cannot read.
 */
export async function extractDishColor(bytes: Buffer): Promise<string | null> {
  try {
    const { data, info } = await sharp(bytes)
      .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: "cover" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let weightTotal = 0;
    let sumSin = 0;
    let sumCos = 0;
    let sumChroma = 0;
    let sumLightness = 0;
    let plainR = 0;
    let plainG = 0;
    let plainB = 0;

    const pixels = info.width * info.height;

    for (let index = 0; index < pixels; index++) {
      const offset = index * info.channels;
      const red = data[offset]!;
      const green = data[offset + 1]!;
      const blue = data[offset + 2]!;

      plainR += red;
      plainG += green;
      plainB += blue;

      const { L, a, b } = oklabFromSrgb(red, green, blue);
      const chroma = Math.hypot(a, b);
      const weight = chroma * chroma;

      if (weight === 0) continue;

      const hue = Math.atan2(b, a);

      sumSin += weight * Math.sin(hue);
      sumCos += weight * Math.cos(hue);
      sumChroma += weight * chroma;
      sumLightness += weight * L;
      weightTotal += weight;
    }

    // A photo with essentially no saturated pixel anywhere: greyscale, or
    // near enough. Its colour is its average, and it will tint as neutral.
    if (weightTotal < 1e-4) {
      return `#${toHexChannel(plainR / pixels)}${toHexChannel(plainG / pixels)}${toHexChannel(plainB / pixels)}`;
    }

    return hexFromOklch(
      sumLightness / weightTotal,
      sumChroma / weightTotal,
      Math.atan2(sumSin, sumCos)
    );
  } catch (err) {
    log.warn({ err }, "Dish Colour extraction failed; recipe keeps no colour");

    return null;
  }
}

/**
 * The Dish Colour for a stored recipe-image URL. Only locally stored images
 * qualify — a remote URL or a legacy shape yields null rather than a fetch,
 * because extraction happens at store time and a URL this cannot resolve is
 * an image Norish is not holding.
 */
export async function dishColorForImageUrl(
  imageUrl: string | null | undefined
): Promise<string | null> {
  if (!imageUrl) return null;

  const match = imageUrl.match(RECIPE_IMAGE_URL_PATTERN);

  if (!match) return null;

  const [, recipeId, filename] = match;

  try {
    const bytes = await fs.readFile(path.join(RECIPES_BASE_DIR, recipeId!, filename!));

    return await extractDishColor(bytes);
  } catch (err) {
    log.warn({ err, imageUrl }, "Dish Colour source image could not be read");

    return null;
  }
}

/**
 * `order` stays loose because the zod contracts coerce it: an insert DTO
 * carries whatever the form or an import sent, and this module meets the
 * payloads where they are rather than demanding a parse first.
 */
type GalleryImageLike = { image: string; order?: unknown };

type PrimaryImageCarrier = {
  image?: string | null;
  images?: readonly GalleryImageLike[] | null;
};

function galleryOrder(galleryImage: GalleryImageLike): number {
  const order = Number(galleryImage.order ?? 0);

  return Number.isFinite(order) ? order : 0;
}

/**
 * The image a recipe page actually leads with: the first gallery image by
 * order, falling back to the legacy single-image column — the same
 * resolution the media carousel renders, so the tint and the hero can never
 * come from two different photos.
 */
export function primaryImageForDishColor(carrier: PrimaryImageCarrier): string | null {
  const gallery = [...(carrier.images ?? [])].sort((a, b) => galleryOrder(a) - galleryOrder(b));

  return gallery[0]?.image ?? carrier.image ?? null;
}

/**
 * A create payload with its Dish Colour computed from the primary image it
 * carries. Always overwrites whatever the payload claimed: the colour is
 * derived from the image, never supplied with the recipe.
 */
export async function withDishColor<T extends PrimaryImageCarrier>(
  dto: T
): Promise<T & { dishColor: string | null }> {
  return { ...dto, dishColor: await dishColorForImageUrl(primaryImageForDishColor(dto)) };
}

/**
 * An update payload with its Dish Colour recomputed — but only when the
 * update actually touches the media. An edit that names neither `image` nor
 * `images` says nothing about the photo, so it must say nothing about the
 * colour either. Whatever colour the payload itself claimed is dropped
 * first, for the same reason `withDishColor` overwrites it: the colour is
 * derived from the image, never supplied with the recipe.
 */
export async function withDishColorForUpdate<T extends PrimaryImageCarrier>(
  data: T
): Promise<Omit<T, "dishColor"> & { dishColor?: string | null }> {
  const { dishColor: _supplied, ...rest } = data as T & { dishColor?: unknown };

  if (rest.image === undefined && rest.images === undefined) return rest;

  return withDishColor(rest);
}
