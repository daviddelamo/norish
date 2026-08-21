// @vitest-environment node
/**
 * The Generated Image replacement at the repository boundary (ADR-0025): the
 * one place a Generated Image is written. The write is deliberately
 * destructive — the row that held the primary slot is deleted, and its URL is
 * handed back so the caller can remove the file — and a mocked repository
 * cannot prove a delete deleted anything, so this runs against the real
 * database beside the dish-colour round-trip.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { replaceRecipePrimaryImageWithGenerated } from "@norish/db/repositories/recipe-enrichment";
import { createRecipeWithRefs, getRecipeFull } from "@norish/db/repositories/recipes";

import { createTestUser } from "../helpers/db-test-helpers";
import { RepositoryTestBase } from "../helpers/repository-test-base";

const testBase = new RepositoryTestBase("recipe_generated_image");

let userId: string;

beforeAll(async () => await testBase.setup());
afterAll(async () => await testBase.teardown());
beforeEach(async () => {
  await testBase.beforeEachTest();
  const user = await createTestUser();

  userId = user.id;
});

const BASE_RECIPE = {
  name: "Pictured Stew",
  systemUsed: "metric" as const,
  recipeIngredients: [],
  tags: [],
  cuisines: [],
  categories: [],
  steps: [],
  images: [],
  videos: [],
};

function url(recipeId: string, name: string): string {
  return `/recipes/${recipeId}/${name}.jpg`;
}

async function createRecipeWithImages(
  images: { image: string; order: number; generated?: boolean }[]
): Promise<string> {
  const recipeId = crypto.randomUUID();

  await createRecipeWithRefs(recipeId, userId, { ...BASE_RECIPE, images });

  return recipeId;
}

describe("the Generated Image marker in the recipe DTO", () => {
  it("round-trips through create and reads back per image, defaulting to unmarked", async () => {
    const recipeId = crypto.randomUUID();

    await createRecipeWithRefs(recipeId, userId, {
      ...BASE_RECIPE,
      images: [
        { image: url(recipeId, "drawn"), order: 0, generated: true },
        { image: url(recipeId, "photo"), order: 1 },
      ],
    });

    const full = await getRecipeFull(recipeId);

    expect(full?.images).toEqual([
      expect.objectContaining({ image: url(recipeId, "drawn"), generated: true }),
      expect.objectContaining({ image: url(recipeId, "photo"), generated: false }),
    ]);
  });
});

describe("replaceRecipePrimaryImageWithGenerated", () => {
  it("gives a recipe with no images exactly one, at order 0, marked", async () => {
    const recipeId = await createRecipeWithImages([]);

    const result = await replaceRecipePrimaryImageWithGenerated(recipeId, url(recipeId, "drawn"));

    expect(result).toEqual({ imageUrl: url(recipeId, "drawn"), replacedImageUrls: [] });

    const images = (await getRecipeFull(recipeId))?.images;

    expect(images).toEqual([
      expect.objectContaining({ image: url(recipeId, "drawn"), order: 0, generated: true }),
    ]);
  });

  it("deletes the row that held the primary slot and keeps every other row in order", async () => {
    const recipeId = crypto.randomUUID();
    const [hero, second, third] = [url(recipeId, "hero"), url(recipeId, "b"), url(recipeId, "c")];

    await createRecipeWithRefs(recipeId, userId, {
      ...BASE_RECIPE,
      images: [
        { image: hero, order: 0 },
        { image: second, order: 1 },
        { image: third, order: 2 },
      ],
    });

    const result = await replaceRecipePrimaryImageWithGenerated(recipeId, url(recipeId, "drawn"));

    expect(result?.replacedImageUrls).toEqual([hero]);

    const images = (await getRecipeFull(recipeId))?.images;

    // Ordered read: the Generated Image leads, the rest keep their contents
    // and their relative order.
    expect(images?.map((img) => img.image)).toEqual([url(recipeId, "drawn"), second, third]);
    expect(images?.map((img) => img.generated)).toEqual([true, false, false]);
  });

  it("consumes the primary slot even when the lowest stored order is not 0", async () => {
    const recipeId = crypto.randomUUID();
    const [primary, other] = [url(recipeId, "three"), url(recipeId, "seven")];

    await createRecipeWithRefs(recipeId, userId, {
      ...BASE_RECIPE,
      images: [
        { image: primary, order: 3 },
        { image: other, order: 7 },
      ],
    });

    const result = await replaceRecipePrimaryImageWithGenerated(recipeId, url(recipeId, "drawn"));

    expect(result?.replacedImageUrls).toEqual([primary]);
    expect((await getRecipeFull(recipeId))?.images.map((img) => img.image)).toEqual([
      url(recipeId, "drawn"),
      other,
    ]);
  });

  it("replaces its own predecessor: a recipe never holds two Generated Images", async () => {
    const recipeId = await createRecipeWithImages([]);

    await replaceRecipePrimaryImageWithGenerated(recipeId, url(recipeId, "first"));
    const second = await replaceRecipePrimaryImageWithGenerated(recipeId, url(recipeId, "second"));

    expect(second?.replacedImageUrls).toEqual([url(recipeId, "first")]);

    const images = (await getRecipeFull(recipeId))?.images;

    expect(images).toEqual([
      expect.objectContaining({ image: url(recipeId, "second"), order: 0, generated: true }),
    ]);
  });

  it("sweeps a stray Generated Image that is no longer the primary", async () => {
    // Reachable only through hand reordering, but the invariant stands: at
    // most one Generated Image per recipe, whatever the gallery looks like.
    const recipeId = crypto.randomUUID();
    const [photo, stray] = [url(recipeId, "photo"), url(recipeId, "stray")];

    await createRecipeWithRefs(recipeId, userId, {
      ...BASE_RECIPE,
      images: [
        { image: photo, order: 0 },
        { image: stray, order: 1, generated: true },
      ],
    });

    const result = await replaceRecipePrimaryImageWithGenerated(recipeId, url(recipeId, "drawn"));

    expect(result?.replacedImageUrls?.sort()).toEqual([photo, stray].sort());
    expect((await getRecipeFull(recipeId))?.images).toEqual([
      expect.objectContaining({ image: url(recipeId, "drawn"), order: 0, generated: true }),
    ]);
  });

  it("returns null for a recipe that does not exist", async () => {
    const missing = crypto.randomUUID();

    expect(await replaceRecipePrimaryImageWithGenerated(missing, url(missing, "drawn"))).toBeNull();
  });
});
