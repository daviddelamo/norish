import type { BrowserContext } from "playwright-core";

import type { SiteAuthTokenDecryptedDto } from "@norish/shared/contracts/dto/site-auth-tokens";
import { getBrowser } from "@norish/api/playwright";
import { parserLogger as log } from "@norish/shared-server/logger";

/**
 * The whole navigation budget. One deadline rather than a stack of them: the
 * page settling, the challenge waits and the recipe-shaped selector races that
 * used to sit under this one are Obscura's job now, and the parser's.
 */
const NAVIGATION_TIMEOUT_MS = 30_000;

/**
 * Render a page in Obscura and return its HTML.
 *
 * Obscura owns the browser identity, JavaScript execution, page settling,
 * stealth and tracker blocking. Norish adds exactly one thing: the requesting
 * user's Site Auth Tokens, in a context that belongs to this fetch alone.
 *
 * There is no second engine behind this. An empty string means Obscura
 * produced no usable HTML, and the import path reports that as a fetch failure.
 */
export async function fetchViaPlaywright(
  targetUrl: string,
  tokens?: SiteAuthTokenDecryptedDto[]
): Promise<string> {
  let context: BrowserContext | undefined;

  try {
    const browser = await getBrowser();

    const headerTokens = tokens?.filter((t) => t.type === "header") ?? [];
    const cookieTokens = tokens?.filter((t) => t.type === "cookie") ?? [];

    // A fresh context per fetch: one importer's tokens can never be seen by
    // another's page, and closing it below disposes of the whole session.
    context = await browser.newContext(
      headerTokens.length > 0
        ? {
            extraHTTPHeaders: Object.fromEntries(
              headerTokens.map((token) => [token.name, token.value])
            ),
          }
        : undefined
    );

    if (cookieTokens.length > 0) {
      let domain: string;

      try {
        domain = new URL(targetUrl).hostname;
      } catch {
        domain = targetUrl;
      }
      await context.addCookies(
        cookieTokens.map((token) => ({
          name: token.name,
          value: token.value,
          domain,
          path: "/",
        }))
      );
    }

    const page = await context.newPage();

    await page.goto(targetUrl, {
      waitUntil: "load",
      timeout: NAVIGATION_TIMEOUT_MS,
    });

    return await page.content();
  } catch (error) {
    log.warn({ err: error, url: targetUrl }, "Obscura could not render the page");

    return "";
  } finally {
    if (context) {
      await context.close().catch((err) => {
        log.debug({ err }, "Failed to close the Obscura browser context during cleanup");
      });
    }
  }
}
