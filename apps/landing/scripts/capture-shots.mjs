/*
 * Takes all twenty tour captures (5 screens x web/mobile x light/dark) from a
 * running Norish instance and writes them into `assets/screenshots`, ready for
 * `pnpm --filter @norish/landing shots`.
 *
 *   NORISH_URL=http://localhost:3000 \
 *   NORISH_EMAIL=demo@example.test NORISH_PASSWORD=... \
 *   NORISH_RECIPE_ID=<uuid of the recipe to open and cook> \
 *   node scripts/capture-shots.mjs
 *
 * Playwright resolves from the monorepo root. The account should already hold
 * the seeded story described in assets/screenshots/README.md. Staged details
 * handled here: cooking mode advances to step 2 (whose ingredient chips sit
 * under the instruction), the groceries page collapses the Unsorted group so
 * the store groups fit the frame, the mobile dashboard is captured in list
 * view, and the recipe page alone uses a wider web viewport so the page
 * reads less cramped.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const BASE = process.env.NORISH_URL ?? "http://localhost:3000";
const EMAIL = process.env.NORISH_EMAIL;
const PASSWORD = process.env.NORISH_PASSWORD;
const RECIPE_ID = process.env.NORISH_RECIPE_ID;

if (!EMAIL || !PASSWORD || !RECIPE_ID) {
  console.error("Set NORISH_EMAIL, NORISH_PASSWORD and NORISH_RECIPE_ID (see file header).");
  process.exit(1);
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "screenshots");

/** Dev-only chrome that must never end up in a capture. */
const hideDevUi = `
  nextjs-portal, next-route-announcer, #next-build-watcher, [data-nextjs-toast],
  [data-next-badge-root], [data-nextjs-dev-tools-button] { display: none !important; }
`;

const FORMS = {
  web: { width: 900, height: 675 },
  mobile: { width: 390, height: 773 },
};

/* The recipe page alone is captured at a physically wider viewport — same
   4:3, so the optimizer crops nothing, but the page gets room to breathe. */
const RECIPE_WEB = { width: 1200, height: 900 };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const browser = await chromium.launch();

for (const [form, viewport] of Object.entries(FORMS)) {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 2,
      extraHTTPHeaders: { origin: BASE },
    });

    // Auth sign-in is rate limited; wait it out rather than fail four shots in.
    let signedIn = false;
    for (let attempt = 0; attempt < 8 && !signedIn; attempt += 1) {
      const login = await context.request.post(`${BASE}/api/auth/sign-in/email`, {
        data: { email: EMAIL, password: PASSWORD },
      });

      if (login.status() === 200) signedIn = true;
      else await sleep(15_000);
    }
    if (!signedIn) throw new Error("sign-in kept failing; check credentials or rate limit");

    const page = await context.newPage();

    await page.addInitScript((value) => window.localStorage.setItem("theme", value), theme);

    // The mobile dashboard ships in list view; the stored value is JSON-encoded.
    if (form === "mobile") {
      await page.addInitScript(() =>
        window.localStorage.setItem("norish:recipe-dashboard-view-mode", '"list"')
      );
    }

    const shoot = async (name) => {
      await page.addStyleTag({ content: hideDevUi }).catch(() => {});
      await page.screenshot({
        path: join(outDir, `${name}-${form}-${theme}.jpg`),
        type: "jpeg",
        quality: 92,
      });
      console.log("captured", `${name}-${form}-${theme}`);
    };

    await page.goto(`${BASE}/`, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(3500);
    await shoot("dashboard");

    if (form === "web") await page.setViewportSize(RECIPE_WEB);
    await page.goto(`${BASE}/recipes/${RECIPE_ID}`, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(2500);
    await shoot("recipe");

    if (form === "web") {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(800);
    }

    await page.getByRole("button", { name: /cook/i }).first().click({ timeout: 8000 });
    await page.waitForTimeout(1500);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(1200);
    await shoot("cooking");

    await page.goto(`${BASE}/calendar`, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(3000);
    await shoot("calendar");

    await page.goto(`${BASE}/groceries`, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(2500);
    await page
      .getByRole("button", { name: /^Unsorted/ })
      .first()
      .click({ timeout: 6000 })
      .catch(() => {});
    await page.waitForTimeout(900);
    await shoot("groceries");

    await context.close();
  }
}

await browser.close();
console.log("done; now run: pnpm --filter @norish/landing shots");
