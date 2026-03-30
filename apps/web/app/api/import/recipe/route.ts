import { NextResponse } from "next/server";
import { parserLogger as log } from "@norish/shared-server/logger";
import { auth } from "@norish/auth/auth";
import { shouldAlwaysUseAI } from "@norish/config/server-config-loader";
import { dashboardRecipe, getHouseholdForUser } from "@norish/db";
import { addImportJob, getQueues } from "@norish/queue";
import { isUrl } from "@norish/shared/lib/helpers";

/**
 * POST /api/import/recipe
 *
 * Import a recipe from a URL. Supports both cookie auth and API key auth.
 * Designed for iOS Shortcuts and other programmatic access.
 *
 * Request body: { url: string }
 * Headers: x-api-key (optional, for API key auth)
 *
 * Response: { recipeId: string } on success
 */
export async function POST(req: Request) {
  // 🚀 DEPLOYMENT VERIFICATION - Check logs for this message to confirm new code is running
  log.info({ deployVersion: "2026-02-10-v2", timestamp: new Date().toISOString() }, "✅ POST /api/import/recipe - Rate limit fix ACTIVE");

  try {
    // Build headers for auth (supports both cookie and API key)
    const headers = new Headers();
    const apiKeyHeader = req.headers.get("x-api-key");

    if (apiKeyHeader) headers.set("x-api-key", apiKeyHeader);

    // Authenticate - wrap in try-catch to handle rate limit errors
    let session;
    try {
      session = await auth.api.getSession({ headers });
    } catch (authError: any) {
      // Check if it's a rate limit error
      // Better-auth returns status "UNAUTHORIZED" with message "Rate limit exceeded"
      const isRateLimitError =
        authError?.status === "RATE_LIMITED" ||
        (authError?.status === "UNAUTHORIZED" && authError?.message?.toLowerCase().includes("rate limit")) ||
        authError?.message?.toLowerCase().includes("rate limit");

      if (isRateLimitError) {
        const retryAfter = authError?.retryAfter || 3600; // Default to 1 hour if not specified
        const maskedApiKey = apiKeyHeader
          ? `${apiKeyHeader.substring(0, 8)}...${apiKeyHeader.substring(apiKeyHeader.length - 4)}`
          : "none";

        log.warn(
          {
            authError,
            apiKey: maskedApiKey,
            retryAfter,
            errorStatus: authError?.status,
            errorMessage: authError?.message
          },
          "🚫 API RATE LIMIT EXCEEDED - Returning HTTP 429"
        );

        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          {
            status: 429,
            headers: { "X-Retry-After": retryAfter.toString() }
          }
        );
      }
      // Re-throw other authentication errors
      throw authError;
    }

    if (!session?.user?.id) {
      // Log the API key (masked) for debugging auth failures
      const maskedApiKey = apiKeyHeader
        ? `${apiKeyHeader.substring(0, 8)}...${apiKeyHeader.substring(apiKeyHeader.length - 4)}`
        : "none";

      log.warn(
        {
          apiKey: maskedApiKey,
          hasApiKeyHeader: !!apiKeyHeader,
          sessionExists: !!session,
          hasUser: !!session?.user
        },
        "Unauthorized API request - no valid session"
      );

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse body
    const body = await req.json().catch(() => ({}));
    const { url } = body as { url?: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'url' in request body" },
        { status: 400 }
      );
    }

    if (!isUrl(url)) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    log.info({ userId: session.user.id, url }, "Recipe import requested via API");

    // Build job data
    const household = await getHouseholdForUser(session.user.id);
    const householdKey = household?.id ?? `user:${session.user.id}`;
    const householdUserIds = household?.users?.map((u) => u.id) ?? null;
    const recipeId = crypto.randomUUID();

    // Check if AI-only import is enabled globally
    const forceAI = await shouldAlwaysUseAI();

    // Add to BullMQ queue
    const queues = getQueues();
    const result = await addImportJob(queues.recipeImport, {
      url,
      recipeId,
      userId: session.user.id,
      householdKey,
      householdUserIds,
      forceAI,
    });

    if (result.status === "exists" && result.existingRecipeId) {
      const existing = await dashboardRecipe(result.existingRecipeId);

      return NextResponse.json(
        { recipeId: result.existingRecipeId, recipe: existing, status: "exists" },
        { status: 200 }
      );
    }

    if (result.status === "duplicate") {
      return NextResponse.json(
        { error: "This recipe is already being imported", status: "duplicate" },
        { status: 409 }
      );
    }

    return NextResponse.json({ recipeId, status: "queued" }, { status: 202 });
  } catch (err) {
    log.error({ err }, "POST /api/import/recipe failed");

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
