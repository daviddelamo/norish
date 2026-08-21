import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import "@testing-library/jest-dom";

import { CookingStepView } from "@/app/(app)/recipes/[id]/components/cookingmode/cooking-step-view";

/** What jsdom cannot measure: the page's height and the step's own height. */
const layout = { pageHeight: 800, contentHeight: 200 };

const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => layout.pageHeight,
  });
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get: () => layout.contentHeight,
  });
});

afterAll(() => {
  if (originalClientHeight) {
    Object.defineProperty(HTMLElement.prototype, "clientHeight", originalClientHeight);
  }

  if (originalScrollHeight) {
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", originalScrollHeight);
  }
});

beforeEach(() => {
  layout.pageHeight = 800;
  layout.contentHeight = 200;
});

vi.mock("@/components/recipe/smart-instruction", () => ({
  SmartInstruction: ({ text }: { text: string }) => <span>{text}</span>,
}));
vi.mock("@/app/(app)/recipes/[id]/components/cookingmode/step-images", () => ({
  StepImages: () => null,
}));
vi.mock("@/hooks/use-amount-display-preference", () => ({
  useAmountDisplayPreference: () => ({ mode: "decimal" }),
}));
vi.mock("@/hooks/use-unit-formatter", () => ({
  useUnitFormatter: () => ({
    formatUnitOnly: (unit: string | null | undefined) => unit ?? "",
  }),
}));
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const INGREDIENTS = [
  { ingredientName: "water", amount: 50, unit: "ml", systemUsed: "metric", order: 0 },
  { ingredientName: "flour", amount: 300, unit: "g", systemUsed: "metric", order: 1 },
];

const STEPS = [
  { originalIndex: 0, stepNumber: 1, text: "Boil the water.", images: [], stepIngredients: [] },
  {
    originalIndex: 1,
    stepNumber: 2,
    text: "Add half the water.",
    images: [],
    stepIngredients: [{ ingredientOrder: 0, share: 0.5, order: 0 }],
  },
  { originalIndex: 2, stepNumber: 3, text: "Serve at once.", images: [], stepIngredients: [] },
];

function stepTree(activeStep: number, handlers: Record<string, () => void> = {}) {
  return (
    <div onPointerDown={handlers.onPointerDown} onPointerUp={handlers.onPointerUp}>
      <CookingStepView
        activeStep={activeStep}
        displayIngredients={INGREDIENTS}
        recipe={{
          id: "recipe-1",
          name: "Stew",
          image: null,
          categories: [],
          totalMinutes: 30,
          servings: 2,
          systemUsed: "metric",
        }}
        steps={STEPS}
      />
    </div>
  );
}

function renderStep(activeStep: number, handlers: Record<string, () => void> = {}) {
  return render(stepTree(activeStep, handlers));
}

describe("CookingStepView Step Ingredients", () => {
  it("presents the active step's ingredients with resolved amounts", () => {
    renderStep(1);

    // The information is in front of the cook exactly when hands are full.
    expect(screen.getByText("25 ml water")).toBeInTheDocument();
  });

  it("shows nothing extra for a step that uses nothing", () => {
    renderStep(2);

    expect(screen.getByText("Serve at once.")).toBeInTheDocument();
    expect(screen.queryByText(/25 ml|300 g/)).not.toBeInTheDocument();
  });
});

/**
 * One step per screen: the neighbours peek at the edges so the cook keeps
 * their bearings, and a step too long for what that leaves takes the whole
 * page instead.
 */
describe("CookingStepView paging", () => {
  it("peeks at the step before and the step after", () => {
    renderStep(1);

    expect(screen.getByText("Boil the water.")).toBeInTheDocument();
    expect(screen.getByText("Serve at once.")).toBeInTheDocument();
  });

  it("peeks only forwards on the first step", () => {
    renderStep(0);

    expect(screen.getByText("Boil the water.")).toBeInTheDocument();
    expect(screen.getByText("Add half the water.")).toBeInTheDocument();
    // Nothing before the first step, and the step after next is two away.
    expect(screen.queryByText("Serve at once.")).not.toBeInTheDocument();
  });

  it("peeks only backwards on the last step", () => {
    renderStep(2);

    expect(screen.getByText("Add half the water.")).toBeInTheDocument();
    expect(screen.queryByText("Boil the water.")).not.toBeInTheDocument();
  });

  it("gives a long step the whole page and drops the peeks", () => {
    layout.contentHeight = 5000;

    renderStep(1);

    expect(screen.getByText("Add half the water.")).toBeInTheDocument();
    expect(screen.queryByText("Boil the water.")).not.toBeInTheDocument();
    expect(screen.queryByText("Serve at once.")).not.toBeInTheDocument();
  });

  it("lets a swipe start anywhere while the step fits", () => {
    const onPointerDown = vi.fn();

    renderStep(1, { onPointerDown });

    fireEvent.pointerDown(screen.getByText("Add half the water."));

    expect(onPointerDown).toHaveBeenCalled();
  });

  it("marks a long step's scroll region, so only the page turn is suppressed", () => {
    layout.contentHeight = 5000;

    const onPointerDown = vi.fn();
    const { container } = renderStep(1, { onPointerDown });

    // The pointer still reaches cooking mode — reaching the ingredients
    // sideways works from anywhere — and the marker is what tells it a
    // vertical drag in here is a scroll rather than a page turn.
    fireEvent.pointerDown(screen.getByText("Add half the water."));

    expect(onPointerDown).toHaveBeenCalled();
    expect(container.querySelector("[data-cooking-step-scroll]")).not.toBeNull();
  });

  it("marks no scroll region while the step fits", () => {
    const { container } = renderStep(1);

    expect(container.querySelector("[data-cooking-step-scroll]")).toBeNull();
  });

  it("flanks the step with a reserved edge at both ends, neighbour or not", () => {
    // The reservation is what centres the step: an edge that collapsed
    // because there is nothing to peek at would shove the first and last
    // steps up and down the screen while the ones between them sat still.
    for (const stepIndex of [0, 1, 2]) {
      const { container, unmount } = renderStep(stepIndex);

      expect(container.querySelectorAll("[data-cooking-step-peek]")).toHaveLength(2);

      unmount();
    }
  });

  it("carries no step number of its own, because the bottom bar counts", () => {
    renderStep(1);

    expect(screen.queryByText("2")).not.toBeInTheDocument();
  });
});

/**
 * A page turn travels: the old page leaves while the new one arrives, so for
 * a moment both are mounted. A swap with no travel reads as a repaint.
 */
describe("CookingStepView page turn", () => {
  it("keeps the leaving page on screen while the arriving one enters, then lets it go", async () => {
    const view = renderStep(0);

    expect(view.container.querySelectorAll("[data-cooking-step-peek]")).toHaveLength(2);

    view.rerender(stepTree(1));

    // Two pages of two reserved edges each: the turn is a travel, not a swap.
    expect(view.container.querySelectorAll("[data-cooking-step-peek]")).toHaveLength(4);

    await waitFor(() =>
      expect(view.container.querySelectorAll("[data-cooking-step-peek]")).toHaveLength(2)
    );
  });
});
