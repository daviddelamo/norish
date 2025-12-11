import { NextResponse } from "next/server";

import { auth } from "@/server/auth/auth";
import { getHouseholdForUser } from "@/server/db";
import { listRecipes, getRecipeFull, type RecipeListContext } from "@/server/db/repositories/recipes";
import { canAccessResource } from "@/server/auth/permissions";
import { parserLogger as log } from "@/server/logger";
import type { FilterMode, SortOrder } from "@/types";

/**
 * GET /api/recipes
 *
 * Retrieve recipes via REST API. Supports both cookie auth and API key auth.
 * Designed for mobile apps, iOS Shortcuts, and other programmatic access.
 *
 * Query parameters:
 * - id: string (optional) - Get a specific recipe by ID
 * - limit: number (optional, default 50) - Number of recipes to return
 * - cursor: number (optional, default 0) - Pagination offset
 * - search: string (optional) - Search by recipe name
 * - tags: string (optional) - Comma-separated tag names to filter by
 * - filterMode: "OR" | "AND" (optional, default "OR") - Tag filter mode
 * - sortMode: "dateDesc" | "dateAsc" | "titleAsc" | "titleDesc" (optional, default "dateDesc")
 *
 * Headers:
 * - x-api-key: API key for authentication (generate in Settings → User → API Keys)
 *
 * Response:
 * - Single recipe: Full recipe object with ingredients, steps, and tags
 * - List: { recipes: [...], total: number, nextCursor: number | null }
 */
export async function GET(req: Request) {
    try {
        // Build headers for auth (supports both cookie and API key)
        const headers = new Headers();
        const apiKeyHeader = req.headers.get("x-api-key");

        if (apiKeyHeader) headers.set("x-api-key", apiKeyHeader);

        // Authenticate
        const session = await auth.api.getSession({ headers });

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        log.debug({ userId }, "Recipe API request received");

        // Parse query parameters
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
        const cursor = parseInt(searchParams.get("cursor") || "0", 10);
        const search = searchParams.get("search") || undefined;
        const tagsParam = searchParams.get("tags");
        const tags = tagsParam ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean) : undefined;
        const filterMode = (searchParams.get("filterMode") as FilterMode) || "OR";
        const sortMode = (searchParams.get("sortMode") as SortOrder) || "dateDesc";

        // Get household for user permissions
        const household = await getHouseholdForUser(userId);
        const householdUserIds = household?.users?.map((u) => u.id) ?? null;
        const isServerAdmin = session.user.isServerAdmin ?? false;

        // Single recipe by ID
        if (id) {
            log.debug({ userId, recipeId: id }, "Getting recipe by ID");

            const recipe = await getRecipeFull(id);

            if (!recipe) {
                return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
            }

            // Check view permission if recipe has an owner
            if (recipe.userId) {
                const canView = await canAccessResource(
                    "view",
                    userId,
                    recipe.userId,
                    householdUserIds,
                    isServerAdmin
                );

                if (!canView) {
                    log.warn({ userId, recipeId: id }, "Access denied to recipe");

                    return NextResponse.json({ error: "Access denied" }, { status: 403 });
                }
            }

            return NextResponse.json(recipe);
        }

        // List recipes with pagination
        log.debug({ userId, limit, cursor, search, tags }, "Listing recipes");

        const listCtx: RecipeListContext = {
            userId,
            householdUserIds,
            isServerAdmin,
        };

        const result = await listRecipes(listCtx, limit, cursor, search, tags, filterMode, sortMode);

        log.debug({ count: result.recipes.length, total: result.total }, "Listed recipes via API");

        return NextResponse.json({
            recipes: result.recipes,
            total: result.total,
            nextCursor: cursor + limit < result.total ? cursor + limit : null,
        });
    } catch (err) {
        log.error({ err }, "GET /api/recipes failed");

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
