import type { CSSProperties } from "react";

/**
 * The Dish Colour → page-tint derivation (ADR-0023). The stored colour is a
 * `#rrggbb` the server extracted from the recipe's primary image; what the
 * page may take from it is its hue and a clamped amount of its saturation,
 * expressed as two OKLCH channel variables. Lightness never appears here —
 * the CSS in globals.css rebuilds each surface token from the theme's own
 * lightness (`oklch(from var(--untinted-*) l ...)`), which is the whole
 * safety argument: a recipe decides what colour its page is and never
 * decides how readable it is.
 *
 * A recipe with no colour, an unparseable value, and a reader who declined
 * the tint all land on the same `undefined` — one untinted rendering,
 * reached three ways, built once.
 */

/**
 * How much saturation a dish may put into the page. The theme's own neutral
 * ground sits at ~0.008–0.016 chroma, so this is a clearly visible warmth
 * without ever approaching the accent's 0.083.
 */
export const MAX_DISH_TINT_CHROMA = 0.04;

export type DishTintStyle = CSSProperties & {
  "--dish-h": string;
  "--dish-c": string;
};

function srgbChannelToLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/** Hue (degrees) and chroma of an sRGB colour in OKLCH, per Ottosson's OKLab. */
function oklchHueChroma(red: number, green: number, blue: number): { h: number; c: number } {
  const r = srgbChannelToLinear(red / 255);
  const g = srgbChannelToLinear(green / 255);
  const b = srgbChannelToLinear(blue / 255);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const c = Math.sqrt(a * a + bb * bb);

  // A genuinely neutral colour has no meaningful hue angle; pin it so the
  // output is stable rather than whatever atan2 makes of rounding noise.
  if (c < 1e-6) return { h: 0, c: 0 };

  const h = (Math.atan2(bb, a) * 180) / Math.PI;

  return { h: h < 0 ? h + 360 : h, c };
}

const HEX_COLOR_PATTERN = /^#([0-9a-f]{6})$/i;

/**
 * The scoped variables for one Dish Colour, or undefined when there is
 * nothing to tint with — no colour stored, or a value that is not the
 * `#rrggbb` the extractor writes. Undefined means the container emits no
 * variables at all and the page renders on the plain theme tokens.
 */
export function dishTintStyle(dishColor: string | null | undefined): DishTintStyle | undefined {
  if (!dishColor) return undefined;

  const match = dishColor.match(HEX_COLOR_PATTERN);

  if (!match) return undefined;

  const value = parseInt(match[1]!, 16);
  const { h, c } = oklchHueChroma((value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff);

  return {
    "--dish-h": h.toFixed(2),
    "--dish-c": Math.min(c, MAX_DISH_TINT_CHROMA).toFixed(4),
  };
}
