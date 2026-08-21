import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import "@testing-library/jest-dom";

import ActionsMenu from "@/app/(app)/recipes/[id]/components/actions-menu";

const mocks = vi.hoisted(() => ({
  hidden: [] as string[],
  isAIEnabled: false,
  systemUsed: "metric" as "metric" | "us",
  ingredientSystems: ["metric", "us"] as ("metric" | "us")[],
  convertingTo: null as "metric" | "us" | null,
  startConversion: vi.fn(),
  amountMode: "decimal" as "decimal" | "fraction",
  toggleAmountMode: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/Panel/consumers", () => ({
  MiniCalendar: () => null,
  MiniGroceries: () => null,
}));

vi.mock("@/components/shared/delete-recipe-modal", () => ({
  DeleteRecipeModal: () => null,
}));

vi.mock("@/app/(app)/recipes/[id]/components/recipe-share-panel", () => ({
  default: () => null,
}));

vi.mock("@/app/(app)/recipes/[id]/components/wake-lock-context", () => ({
  useWakeLockContext: () => ({ isSupported: false, isActive: false, toggle: vi.fn() }),
}));

vi.mock("@/context/permissions-context", () => ({
  usePermissionsContext: () => ({
    canEditRecipe: () => true,
    canDeleteRecipe: () => true,
    isAIEnabled: mocks.isAIEnabled,
  }),
}));

vi.mock("@/context/recipes-context", () => ({
  useRecipesContext: () => ({ deleteRecipe: vi.fn() }),
}));

vi.mock("@/context/hidden-items-context", () => ({
  useHiddenItems: () => mocks.hidden,
}));

vi.mock("@/hooks/user", () => ({
  useActiveAllergies: () => ({ allergies: [] }),
}));

vi.mock("@/hooks/use-amount-display-preference", () => ({
  useAmountDisplayPreference: () => ({
    mode: mocks.amountMode,
    setMode: vi.fn(),
    toggleMode: mocks.toggleAmountMode,
  }),
}));

vi.mock("@/app/(app)/recipes/[id]/context", () => ({
  useRecipeContextRequired: () => ({
    recipe: {
      id: "recipe-1",
      userId: "owner-1",
      name: "Cacio e Pepe",
      version: 1,
      systemUsed: mocks.systemUsed,
      recipeIngredients: mocks.ingredientSystems.map((systemUsed) => ({ systemUsed })),
    },
    convertingTo: mocks.convertingTo,
    startConversion: mocks.startConversion,
    enrichment: { states: {}, isBusy: () => false, request: vi.fn() },
  }),
}));

vi.mock("@heroui/react", () => ({
  Button: ({
    children,
    isDisabled,
    onPress,
  }: {
    children: React.ReactNode;
    isDisabled?: boolean;
    onPress?: () => void;
  }) => (
    <button disabled={isDisabled} type="button" onClick={onPress}>
      {children}
    </button>
  ),
  Dropdown: Object.assign(({ children }: { children: React.ReactNode }) => <div>{children}</div>, {
    Popover: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Menu: ({
      children,
      items = [],
    }: {
      children: React.ReactNode | ((item: unknown) => React.ReactNode);
      items?: unknown[];
    }) => <div>{typeof children === "function" ? items.map(children) : children}</div>,
    Item: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  }),
  Label: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  useOverlayState: () => ({ isOpen: false, open: vi.fn(), close: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

beforeEach(() => {
  mocks.hidden = [];
  mocks.isAIEnabled = false;
  mocks.systemUsed = "metric";
  mocks.ingredientSystems = ["metric", "us"];
  mocks.convertingTo = null;
  mocks.amountMode = "decimal";
  mocks.startConversion.mockClear();
  mocks.toggleAmountMode.mockClear();
});

/**
 * The phone's Ingredients card has room for the servings row and nothing
 * else, so measurement conversion and the amount display preference are
 * drawn here instead. Conversion keeps its Hidden Item gate: hiding it takes
 * the action, not just the old control.
 */
describe("ActionsMenu measurement controls", () => {
  it("offers the systems the recipe is not already in", () => {
    render(<ActionsMenu id="recipe-1" />);

    expect(screen.getByText("recipes.convert.toUS")).toBeInTheDocument();
    // Converting to the system it is already in is not an action.
    expect(screen.queryByText("recipes.convert.toMetric")).not.toBeInTheDocument();
  });

  it("converts on press", () => {
    render(<ActionsMenu id="recipe-1" />);

    fireEvent.click(screen.getByText("recipes.convert.toUS").closest("button")!);

    expect(mocks.startConversion).toHaveBeenCalledWith("us");
  });

  it("drops the conversion action for a reader who has hidden conversion", () => {
    mocks.hidden = ["conversion"];

    render(<ActionsMenu id="recipe-1" />);

    expect(screen.queryByText("recipes.convert.toUS")).not.toBeInTheDocument();
    expect(screen.queryByText("recipes.convert.toMetric")).not.toBeInTheDocument();
  });

  it("offers nothing to convert to when only one system is reachable", () => {
    mocks.ingredientSystems = ["metric"];

    render(<ActionsMenu id="recipe-1" />);

    expect(screen.queryByText("recipes.convert.toUS")).not.toBeInTheDocument();
  });

  it("reaches an unstored system through AI when AI is enabled", () => {
    mocks.ingredientSystems = ["metric"];
    mocks.isAIEnabled = true;

    render(<ActionsMenu id="recipe-1" />);

    expect(screen.getByText("recipes.convert.toUS")).toBeInTheDocument();
  });

  it("toggles the app-wide amount display", () => {
    render(<ActionsMenu id="recipe-1" />);

    const item = screen.getByText("recipes.detail.switchToFraction");

    fireEvent.click(item.closest("button")!);

    expect(mocks.toggleAmountMode).toHaveBeenCalled();
  });

  it("names the other display mode once fractions are showing", () => {
    mocks.amountMode = "fraction";

    render(<ActionsMenu id="recipe-1" />);

    expect(screen.getByText("recipes.detail.switchToDecimal")).toBeInTheDocument();
  });

  it("keeps the amount display for a reader who has hidden conversion", () => {
    mocks.hidden = ["conversion"];

    render(<ActionsMenu id="recipe-1" />);

    // Fractions-versus-decimals is not the conversion Hidden Item.
    expect(screen.getByText("recipes.detail.switchToFraction")).toBeInTheDocument();
  });
});
