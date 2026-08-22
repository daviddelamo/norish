// @vitest-environment node
/**
 * The URL-import store path for the Dish Colour (ADR-0023): the recipe the
 * parser produced is created with the colour extracted from the image the
 * import just stored. The extraction itself is pinned in
 * shared-server/__tests__/media/dish-color.test.ts; here the sentinel proves
 * the worker threads it into the write.
 */
import type { Job } from "bullmq";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RecipeImportJobData } from "@norish/queue/contracts/job-types";

const createRecipeWithRefs = vi.fn();
const dashboardRecipe = vi.fn();
const recipeExistsByUrlForPolicy = vi.fn();
const getDecryptedTokensByUserId = vi.fn();
const emitByPolicy = vi.fn();
const parseRecipeFromUrl = vi.fn();
const withDishColor = vi.fn();

vi.mock("@norish/db", () => ({
  createRecipeWithRefs,
  dashboardRecipe,
  recipeExistsByUrlForPolicy,
}));

vi.mock("@norish/db/repositories/site-auth-tokens", () => ({
  getDecryptedTokensByUserId,
}));

vi.mock("@norish/shared-server/config/server-config-loader", () => ({
  getRecipePermissionPolicy: vi.fn().mockResolvedValue({ view: "everyone" }),
}));

vi.mock("@norish/queue/api-handlers", () => ({
  requireQueueApiHandler: vi.fn(() => parseRecipeFromUrl),
}));

vi.mock("@norish/shared-server/realtime/policy", () => ({
  emitByPolicy,
}));

vi.mock("@norish/shared-server/realtime/recipes", () => ({
  recipeEmitter: {},
}));

vi.mock("@norish/shared-server/logger", () => ({
  createLogger: () => ({ info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock("@norish/shared-server/media/dish-color", () => ({
  withDishColor,
}));

vi.mock("@norish/shared-server/media/storage", () => ({
  deleteRecipeImagesDir: vi.fn(),
}));

const PARSED_RECIPE = {
  id: "recipe-77",
  name: "Imported Stew",
  image: "/recipes/recipe-77/photo.jpg",
  recipeIngredients: [],
  steps: [],
  tags: [],
  categories: [],
  images: [],
  videos: [],
};

describe("processImportJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    recipeExistsByUrlForPolicy.mockResolvedValue({ exists: false });
    getDecryptedTokensByUserId.mockResolvedValue([]);
    parseRecipeFromUrl.mockResolvedValue({ recipe: PARSED_RECIPE, usedAI: false });
    withDishColor.mockImplementation(async (dto) => ({ ...dto, dishColor: "#7c4a1e" }));
    createRecipeWithRefs.mockResolvedValue({ status: "inserted", recipeId: "recipe-77" });
    dashboardRecipe.mockResolvedValue({ id: "recipe-77", name: "Imported Stew" });
  });

  it("creates the imported recipe with the extracted Dish Colour (URL-import path)", async () => {
    const { processRecipeImportJob } = await import("../../src/recipe-import/worker");

    await processRecipeImportJob({
      id: "job-1",
      attemptsMade: 0,
      opts: {},
      data: {
        url: "https://example.com/stew",
        recipeId: "recipe-77",
        userId: "user-1",
        householdKey: "household-1",
        householdUserIds: null,
      },
    } as unknown as Job<RecipeImportJobData>);

    expect(withDishColor).toHaveBeenCalledWith(PARSED_RECIPE);
    expect(createRecipeWithRefs).toHaveBeenCalledWith(
      "recipe-77",
      "user-1",
      expect.objectContaining({ name: "Imported Stew", dishColor: "#7c4a1e" })
    );
  });
});
