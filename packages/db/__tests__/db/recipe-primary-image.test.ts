// @vitest-environment node
/**
 * Every list-shaped projection resolves its thumbnail from the gallery,
 * with the legacy `recipes.image` scalar only as a fallback — the SQL twin
 * of `primaryRecipeImage`. This is what lets the scalar column head toward
 * removal: a gallery-only recipe must show a picture everywhere without it.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  createRecipeWithRefs,
  dashboardRecipe,
  getRandomRecipeCandidates,
  listRecipes,
  searchRecipesByName,
} from "@norish/db/repositories/recipes";

import { createTestUser } from "../helpers/db-test-helpers";
import { RepositoryTestBase } from "../helpers/repository-test-base";

const testBase = new RepositoryTestBase("recipe_primary_image");

let userId: string;

beforeAll(async () => await testBase.setup());
afterAll(async () => await testBase.teardown());
beforeEach(async () => {
  await testBase.beforeEachTest();
  const user = await createTestUser();

  userId = user.id;
});

const BASE_RECIPE = {
  systemUsed: "metric" as const,
  recipeIngredients: [],
  tags: [],
  cuisines: [],
  categories: [],
  steps: [],
  images: [],
  videos: [],
};

function listContext() {
  return { userId, householdUserIds: [userId], isServerAdmin: false };
}

async function seedThreeShapes() {
  const galleryOnly = crypto.randomUUID();
  const legacyOnly = crypto.randomUUID();
  const both = crypto.randomUUID();

  await createRecipeWithRefs(galleryOnly, userId, {
    ...BASE_RECIPE,
    name: "Gallery Only",
    images: [
      { image: `/recipes/${galleryOnly}/second.jpg`, order: 1 },
      { image: `/recipes/${galleryOnly}/first.jpg`, order: 0 },
    ],
  });
  await createRecipeWithRefs(legacyOnly, userId, {
    ...BASE_RECIPE,
    name: "Legacy Only",
    image: `/recipes/${legacyOnly}/legacy.jpg`,
  });
  await createRecipeWithRefs(both, userId, {
    ...BASE_RECIPE,
    name: "Both Stored",
    image: `/recipes/${both}/stale-scalar.jpg`,
    images: [{ image: `/recipes/${both}/gallery.jpg`, order: 0 }],
  });

  return { galleryOnly, legacyOnly, both };
}

describe("thumbnail resolution across the list projections", () => {
  it("listRecipes leads with the gallery and falls back to the scalar", async () => {
    await seedThreeShapes();

    const { recipes } = await listRecipes(listContext(), 50);
    const byName = new Map(recipes.map((recipe) => [recipe.name, recipe.image]));

    expect(byName.get("Gallery Only")).toMatch(/\/first\.jpg$/);
    expect(byName.get("Legacy Only")).toMatch(/\/legacy\.jpg$/);
    // A stale scalar never outranks the gallery.
    expect(byName.get("Both Stored")).toMatch(/\/gallery\.jpg$/);
  });

  it("dashboardRecipe resolves the same way", async () => {
    const { galleryOnly, both } = await seedThreeShapes();

    expect((await dashboardRecipe(galleryOnly))?.image).toMatch(/\/first\.jpg$/);
    expect((await dashboardRecipe(both))?.image).toMatch(/\/gallery\.jpg$/);
  });

  it("autocomplete search resolves the same way", async () => {
    await seedThreeShapes();

    const results = await searchRecipesByName(listContext(), "Gallery Only", 5);

    expect(results[0]?.image).toMatch(/\/first\.jpg$/);
  });

  it("random-recipe candidates resolve the same way", async () => {
    const { galleryOnly, legacyOnly } = await seedThreeShapes();

    const candidates = await getRandomRecipeCandidates(listContext());
    const byId = new Map(candidates.map((candidate) => [candidate.id, candidate.image]));

    expect(byId.get(galleryOnly)).toMatch(/\/first\.jpg$/);
    expect(byId.get(legacyOnly)).toMatch(/\/legacy\.jpg$/);
  });
});
