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

function toHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, "0");
}

/**
 * The dominant colour of an image, as `#rrggbb` — sharp's histogram
 * dominant, which is what "one colour for the whole dish" means here.
 * Returns null for anything sharp cannot read.
 */
export async function extractDishColor(bytes: Buffer): Promise<string | null> {
  try {
    const { dominant } = await sharp(bytes).stats();

    return `#${toHex(dominant.r)}${toHex(dominant.g)}${toHex(dominant.b)}`;
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
