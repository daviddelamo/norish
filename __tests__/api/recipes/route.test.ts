import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMockUser, createMockFullRecipe, createMockRecipeDashboard } from "../../trpc/recipes/test-utils";

// Mock auth
vi.mock("@/server/auth/auth", () => ({
    auth: {
        api: {
            getSession: vi.fn(),
        },
    },
}));

// Mock repositories
vi.mock("@/server/db", () => ({
    getHouseholdForUser: vi.fn(),
}));

vi.mock("@/server/db/repositories/recipes", () => ({
    listRecipes: vi.fn(),
    getRecipeFull: vi.fn(),
}));

vi.mock("@/server/auth/permissions", () => ({
    canAccessResource: vi.fn(),
}));

vi.mock("@/server/logger", () => ({
    parserLogger: {
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

import { auth } from "@/server/auth/auth";
import { getHouseholdForUser } from "@/server/db";
import { listRecipes, getRecipeFull } from "@/server/db/repositories/recipes";
import { canAccessResource } from "@/server/auth/permissions";
import { GET } from "@/app/api/recipes/route";

const getSession = auth.api.getSession as ReturnType<typeof vi.fn>;
const getHouseholdMock = getHouseholdForUser as ReturnType<typeof vi.fn>;
const listRecipesMock = listRecipes as ReturnType<typeof vi.fn>;
const getRecipeFullMock = getRecipeFull as ReturnType<typeof vi.fn>;
const canAccessMock = canAccessResource as ReturnType<typeof vi.fn>;

describe("GET /api/recipes", () => {
    const mockUser = createMockUser();

    beforeEach(() => {
        vi.clearAllMocks();

        // Default authenticated user
        getSession.mockResolvedValue({
            user: mockUser,
        });

        // No household by default
        getHouseholdMock.mockResolvedValue(null);
    });

    describe("Authentication", () => {
        it("returns 401 when not authenticated", async () => {
            getSession.mockResolvedValue(null);

            const request = new Request("http://localhost:3000/api/recipes");
            const response = await GET(request);

            expect(response.status).toBe(401);

            const json = await response.json();

            expect(json.error).toBe("Unauthorized");
        });

        it("authenticates with x-api-key header", async () => {
            listRecipesMock.mockResolvedValue({ recipes: [], total: 0 });

            const request = new Request("http://localhost:3000/api/recipes", {
                headers: { "x-api-key": "test-api-key" },
            });
            await GET(request);

            // Verify getSession was called (authentication happens)
            expect(getSession).toHaveBeenCalled();
        });
    });

    describe("List recipes", () => {
        it("returns paginated recipes", async () => {
            const mockRecipes = [
                createMockRecipeDashboard({ id: "r1", name: "Recipe 1" }),
                createMockRecipeDashboard({ id: "r2", name: "Recipe 2" }),
            ];

            listRecipesMock.mockResolvedValue({ recipes: mockRecipes, total: 2 });

            const request = new Request("http://localhost:3000/api/recipes");
            const response = await GET(request);

            expect(response.status).toBe(200);

            const json = await response.json();

            expect(json.recipes).toHaveLength(2);
            expect(json.total).toBe(2);
            expect(json.nextCursor).toBeNull();
        });

        it("returns nextCursor when more pages available", async () => {
            const mockRecipes = Array.from({ length: 50 }, (_, i) =>
                createMockRecipeDashboard({ id: `r${i}`, name: `Recipe ${i}` })
            );

            listRecipesMock.mockResolvedValue({ recipes: mockRecipes, total: 100 });

            const request = new Request("http://localhost:3000/api/recipes?limit=50");
            const response = await GET(request);

            const json = await response.json();

            expect(json.nextCursor).toBe(50);
        });

        it("respects limit and cursor parameters", async () => {
            listRecipesMock.mockResolvedValue({ recipes: [], total: 0 });

            const request = new Request("http://localhost:3000/api/recipes?limit=20&cursor=40");
            await GET(request);

            expect(listRecipesMock).toHaveBeenCalledWith(
                expect.objectContaining({ userId: mockUser.id }),
                20,
                40,
                undefined,
                undefined,
                "OR",
                "dateDesc"
            );
        });

        it("applies search filter", async () => {
            listRecipesMock.mockResolvedValue({ recipes: [], total: 0 });

            const request = new Request("http://localhost:3000/api/recipes?search=pasta");
            await GET(request);

            expect(listRecipesMock).toHaveBeenCalledWith(
                expect.any(Object),
                50,
                0,
                "pasta",
                undefined,
                "OR",
                "dateDesc"
            );
        });

        it("applies tag filter", async () => {
            listRecipesMock.mockResolvedValue({ recipes: [], total: 0 });

            const request = new Request("http://localhost:3000/api/recipes?tags=dinner,easy");
            await GET(request);

            expect(listRecipesMock).toHaveBeenCalledWith(
                expect.any(Object),
                50,
                0,
                undefined,
                ["dinner", "easy"],
                "OR",
                "dateDesc"
            );
        });

        it("applies sort mode", async () => {
            listRecipesMock.mockResolvedValue({ recipes: [], total: 0 });

            const request = new Request("http://localhost:3000/api/recipes?sortMode=titleAsc");
            await GET(request);

            expect(listRecipesMock).toHaveBeenCalledWith(
                expect.any(Object),
                50,
                0,
                undefined,
                undefined,
                "OR",
                "titleAsc"
            );
        });
    });

    describe("Get single recipe", () => {
        it("returns recipe by ID", async () => {
            const mockRecipe = createMockFullRecipe({ id: "r1", userId: mockUser.id });

            getRecipeFullMock.mockResolvedValue(mockRecipe);
            canAccessMock.mockResolvedValue(true);

            const request = new Request("http://localhost:3000/api/recipes?id=r1");
            const response = await GET(request);

            expect(response.status).toBe(200);

            const json = await response.json();

            expect(json.id).toBe("r1");
        });

        it("returns 404 for non-existent recipe", async () => {
            getRecipeFullMock.mockResolvedValue(null);

            const request = new Request("http://localhost:3000/api/recipes?id=non-existent");
            const response = await GET(request);

            expect(response.status).toBe(404);

            const json = await response.json();

            expect(json.error).toBe("Recipe not found");
        });

        it("returns 403 when user lacks view permission", async () => {
            const mockRecipe = createMockFullRecipe({ id: "r1", userId: "other-user-id" });

            getRecipeFullMock.mockResolvedValue(mockRecipe);
            canAccessMock.mockResolvedValue(false);

            const request = new Request("http://localhost:3000/api/recipes?id=r1");
            const response = await GET(request);

            expect(response.status).toBe(403);

            const json = await response.json();

            expect(json.error).toBe("Access denied");
        });

        it("returns orphaned recipe without permission check", async () => {
            const mockRecipe = createMockFullRecipe({ id: "r1", userId: null });

            getRecipeFullMock.mockResolvedValue(mockRecipe);

            const request = new Request("http://localhost:3000/api/recipes?id=r1");
            const response = await GET(request);

            expect(response.status).toBe(200);
            expect(canAccessMock).not.toHaveBeenCalled();
        });
    });

    describe("Household context", () => {
        it("includes household user IDs in list context", async () => {
            getHouseholdMock.mockResolvedValue({
                id: "household-1",
                users: [{ id: "user-1" }, { id: "user-2" }],
            });
            listRecipesMock.mockResolvedValue({ recipes: [], total: 0 });

            const request = new Request("http://localhost:3000/api/recipes");
            await GET(request);

            expect(listRecipesMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    householdUserIds: ["user-1", "user-2"],
                }),
                expect.any(Number),
                expect.any(Number),
                undefined,
                undefined,
                expect.any(String),
                expect.any(String)
            );
        });
    });
});
