import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import "@testing-library/jest-dom";

import RecipeHeaderMobile from "@/components/recipes/recipe-header-mobile";

vi.mock("@/components/recipes/author-chip", () => ({
  default: ({ name }: { name?: string | null }) => <div data-testid="author-chip">{name}</div>,
}));
vi.mock("@/components/recipes/origin-flag", () => ({
  default: () => <span data-testid="origin-flag" />,
}));
vi.mock("@/components/shared/smart-markdown-renderer", () => ({
  default: ({ text }: { text: string }) => <p>{text}</p>,
}));
vi.mock("@heroui/react", () => ({
  Chip: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={className}>{children}</span>
  ),
}));
vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

type HeaderRecipe = Parameters<typeof RecipeHeaderMobile>[0]["recipe"];

const baseRecipe = (): HeaderRecipe => ({
  name: "Cacio e Pepe",
  description: "A Roman classic.",
  categories: ["Dinner"],
  tags: [],
  totalMinutes: 45,
  servings: 2,
  calories: 520,
  originCountry: "IT",
  author: { id: "u1", name: "Nonna", image: null },
});

const TOTAL_TIME = "recipes.glanceBar.totalTime";
const SERVINGS = "recipes.glanceBar.servings";
const CALORIES = "recipes.nutrition.calories";

function glanceLabels(): string[] {
  return [TOTAL_TIME, SERVINGS, CALORIES].filter((label) => screen.queryByText(label) !== null);
}

/**
 * The Glance Bar restates facts the sections below own and holds none of its
 * own: an entry the recipe does not store is absent, a Hidden Item takes its
 * entry with it, and a recipe storing none of the three has no bar at all.
 */
describe("Glance Bar", () => {
  it("shows total time, servings and calories", () => {
    render(<RecipeHeaderMobile recipe={baseRecipe()} />);

    expect(glanceLabels()).toEqual([TOTAL_TIME, SERVINGS, CALORIES]);
    expect(screen.getByText("45m")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("520")).toBeInTheDocument();
  });

  it("omits the total time a recipe does not store", () => {
    render(<RecipeHeaderMobile recipe={{ ...baseRecipe(), totalMinutes: null }} />);

    expect(glanceLabels()).toEqual([SERVINGS, CALORIES]);
  });

  it("omits the calories a recipe does not store", () => {
    render(<RecipeHeaderMobile recipe={{ ...baseRecipe(), calories: null }} />);

    expect(glanceLabels()).toEqual([TOTAL_TIME, SERVINGS]);
  });

  it("drops the calories entry for a reader who has hidden Nutrition Information", () => {
    render(<RecipeHeaderMobile recipe={baseRecipe()} showCalories={false} />);

    expect(glanceLabels()).toEqual([TOTAL_TIME, SERVINGS]);
  });

  it("keeps a single default serving, because servings is always stored", () => {
    render(
      <RecipeHeaderMobile
        recipe={{ ...baseRecipe(), servings: 1, totalMinutes: null, calories: null }}
      />
    );

    expect(glanceLabels()).toEqual([SERVINGS]);
  });

  it("renders no bar at all when the recipe stores none of the three", () => {
    render(
      <RecipeHeaderMobile
        recipe={{ ...baseRecipe(), totalMinutes: null, servings: null, calories: null }}
      />
    );

    expect(glanceLabels()).toEqual([]);
  });
});

describe("RecipeHeaderMobile", () => {
  it("reads categories, title, author, description, glance bar, tags", () => {
    render(
      <RecipeHeaderMobile
        allergies={["Nuts"]}
        allergySet={new Set(["nuts"])}
        recipe={{ ...baseRecipe(), tags: [{ name: "Quick" }, { name: "Nuts" }] }}
      />
    );

    const order = [
      screen.getByText("recipes.form.category.dinner"),
      screen.getByRole("heading", { name: /Cacio e Pepe/ }),
      screen.getByTestId("author-chip"),
      screen.getByText("A Roman classic."),
      screen.getByText(TOTAL_TIME),
      screen.getByText("Quick"),
    ];

    for (let i = 0; i < order.length - 1; i++) {
      expect(
        order[i]!.compareDocumentPosition(order[i + 1]!) & Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }
  });

  it("sorts allergen tags first and marks them", () => {
    render(
      <RecipeHeaderMobile
        allergies={["Nuts"]}
        allergySet={new Set(["nuts"])}
        recipe={{ ...baseRecipe(), tags: [{ name: "Quick" }, { name: "Nuts" }] }}
      />
    );

    const allergen = screen.getByText("Nuts");
    const other = screen.getByText("Quick");

    expect(allergen.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(allergen.className).toContain("bg-warning");
  });

  it("carries no source link beside the title", () => {
    render(<RecipeHeaderMobile recipe={baseRecipe()} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
