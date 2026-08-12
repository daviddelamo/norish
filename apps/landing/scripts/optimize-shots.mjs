/*
 * Regenerates `public/screenshots/optimized` from the source captures in
 * `assets/screenshots`. Run it after replacing any capture:
 *
 *   pnpm --filter @norish/landing shots
 *
 * The size table mirrors `components/shot.tsx`: every base is emitted at the
 * widths the page actually requests, in both themes, as webp. Output sizes are
 * exact; a source whose aspect does not match is centre-cropped and called out,
 * because it usually means the capture came from a different window size than
 * the rest of the set (see assets/screenshots/README.md for the capture spec).
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// sharp is not a dependency of the landing page itself; it resolves from the
// monorepo root, where Next.js already brings it along.
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const sourceDir = join(here, "..", "assets", "screenshots");
const outDir = join(here, "..", "public", "screenshots", "optimized");

const WEB = [
  [640, 480],
  [1120, 839],
];
const MOBILE = [
  [192, 381],
  [384, 761],
];

/** Mirrors SHOTS in components/shot.tsx. */
const SHOTS = {
  "dashboard-web": WEB,
  "recipe-web": WEB,
  "cooking-web": WEB,
  "calendar-web": WEB,
  "groceries-web": WEB,
  "dashboard-mobile": MOBILE,
  "recipe-mobile": MOBILE,
  "cooking-mobile": MOBILE,
  "calendar-mobile": MOBILE,
  "groceries-mobile": MOBILE,
};

const THEMES = ["light", "dark"];
const QUALITY = 82;

await mkdir(outDir, { recursive: true });

let written = 0;
const warnings = [];

for (const [base, sizes] of Object.entries(SHOTS)) {
  for (const theme of THEMES) {
    const source = join(sourceDir, `${base}-${theme}.jpg`);

    let image;
    try {
      image = sharp(source);
      const { width, height } = await image.metadata();
      const [targetW, targetH] = sizes[sizes.length - 1];
      const drift = Math.abs(width / height / (targetW / targetH) - 1);

      if (drift > 0.005) {
        warnings.push(
          `${base}-${theme}.jpg is ${width}x${height}; expected the ${targetW}:${targetH} aspect. ` +
            `Cropped to fit, but the capture likely used the wrong window size.`
        );
      }
    } catch {
      warnings.push(`missing source: ${base}-${theme}.jpg`);
      continue;
    }

    for (const [width, height] of sizes) {
      const out = join(outDir, `${base}-${theme}-${width}.webp`);

      await image
        .clone()
        .resize(width, height, { fit: "cover", position: "centre" })
        .webp({ quality: QUALITY })
        .toFile(out);
      written += 1;
    }
  }
}

console.log(`wrote ${written} files to public/screenshots/optimized`);

for (const warning of warnings) {
  console.warn(`WARN ${warning}`);
}

if (warnings.length > 0) process.exitCode = 1;
