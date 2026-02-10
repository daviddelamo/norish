import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";
import type { HouseholdWithUsersNamesDto, User } from "@/types";
import type { SubscriptionMultiplexer } from "@/server/redis/subscription-multiplexer";

import { auth } from "@/server/auth/auth";
import { getHouseholdForUser } from "@/server/db";
import { logger } from "@/server/logger";

const log = logger.child({ module: "trpc:context" });

export type Context = {
  user: User | null;
  household: HouseholdWithUsersNamesDto | null;
  /** Unique ID for this WebSocket connection (WS only) */
  connectionId: string | null;
  /** Subscription multiplexer for this connection (WS only, set lazily in middleware) */
  multiplexer: SubscriptionMultiplexer | null;
};

/**
 * Create context for HTTP requests (Next.js fetch adapter)
 */
export async function createContext(opts: FetchCreateContextFnOptions): Promise<Context> {
  const { req } = opts;

  try {
    // Use BetterAuth's getSession API which handles both session cookies and API keys
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return { user: null, household: null, connectionId: null, multiplexer: null };
    }

    const sessionUser = session.user as { isServerAdmin?: boolean; isServerOwner?: boolean };
    const user: User = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name || "",
      image: session.user.image || null,
      isServerAdmin: sessionUser.isServerOwner || sessionUser.isServerAdmin || false,
      locale: (session.user as any).locale as string | null | undefined,
    };

    const household = await getHouseholdForUser(user.id);

    return { user, household, connectionId: null, multiplexer: null };
  } catch (error: any) {
    // Check if it's a rate limit error from better-auth
    const isRateLimitError =
      error?.status === "RATE_LIMITED" ||
      (error?.status === "UNAUTHORIZED" && error?.message?.toLowerCase().includes("rate limit")) ||
      error?.message?.toLowerCase().includes("rate limit");

    if (isRateLimitError) {
      const apiKey = req.headers.get("x-api-key");
      const maskedApiKey = apiKey
        ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
        : "none";

      log.warn(
        {
          error,
          apiKey: maskedApiKey,
          errorStatus: error?.status,
          errorMessage: error?.message,
        },
        "🚫 tRPC HTTP: Rate limit exceeded"
      );
    }

    return { user: null, household: null, connectionId: null, multiplexer: null };
  }
}

export async function createWsContext(opts: CreateWSSContextFnOptions): Promise<Context> {
  const { req } = opts;
  // connectionId is set by ws-server.ts during upgrade
  const connectionId = (req as { connectionId?: string }).connectionId ?? null;

  try {
    const headers = new Headers();

    if (req.headers.cookie) {
      headers.set("cookie", String(req.headers.cookie));
    }

    if (req.headers["x-api-key"]) {
      headers.set("x-api-key", String(req.headers["x-api-key"]));
    }

    const session = await auth.api.getSession({ headers });

    if (!session?.user?.id) {
      return { user: null, household: null, connectionId, multiplexer: null };
    }

    const sessionUser = session.user as { isServerAdmin?: boolean; isServerOwner?: boolean };
    const user: User = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name || "",
      image: session.user.image || null,
      isServerAdmin: sessionUser.isServerOwner || sessionUser.isServerAdmin || false,
      locale: (session.user as any).locale as string | null | undefined,
    };

    return { user, household: null, connectionId, multiplexer: null };
  } catch (error: any) {
    // Check if it's a rate limit error from better-auth
    const isRateLimitError =
      error?.status === "RATE_LIMITED" ||
      (error?.status === "UNAUTHORIZED" && error?.message?.toLowerCase().includes("rate limit")) ||
      error?.message?.toLowerCase().includes("rate limit");

    if (isRateLimitError) {
      const apiKey = req.headers["x-api-key"];
      const maskedApiKey = apiKey
        ? `${String(apiKey).substring(0, 8)}...${String(apiKey).substring(String(apiKey).length - 4)}`
        : "none";

      log.warn(
        {
          error,
          apiKey: maskedApiKey,
          errorStatus: error?.status,
          errorMessage: error?.message,
          connectionId,
        },
        "🚫 tRPC WebSocket: Rate limit exceeded"
      );
    }

    return { user, household: null, connectionId, multiplexer: null };
  }
}
