import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import "@testing-library/jest-dom";

import RecipePageTint from "@/components/recipes/recipe-page-tint";

function renderTint(dishColor: string | null | undefined) {
  return render(
    <RecipePageTint dishColor={dishColor}>
      <span data-testid="content">the page</span>
    </RecipePageTint>
  );
}

describe("RecipePageTint", () => {
  it("scopes the channel variables and paints the viewport underlay for a Dish Colour", () => {
    const { container, getByTestId } = renderTint("#c04020");
    const scope = container.querySelector("[data-dish-tint]") as HTMLElement;

    expect(scope).not.toBeNull();
    expect(scope.style.getPropertyValue("--dish-h")).not.toBe("");
    expect(scope.style.getPropertyValue("--dish-c")).not.toBe("");
    expect(container.querySelector(".bg-background.fixed")).not.toBeNull();
    expect(getByTestId("content")).toBeInTheDocument();
  });

  it("emits no attribute, no variables and no underlay without one", () => {
    const { container, getByTestId } = renderTint(null);

    expect(container.querySelector("[data-dish-tint]")).toBeNull();
    expect(container.querySelector(".bg-background.fixed")).toBeNull();
    expect(getByTestId("content")).toBeInTheDocument();
  });

  it("renders the absent, the undefined and the unparseable colour identically", () => {
    const noColor = renderTint(null).container.innerHTML;

    expect(renderTint(undefined).container.innerHTML).toBe(noColor);
    expect(renderTint("not-a-colour").container.innerHTML).toBe(noColor);
  });

  it("stays out of layout — the wrapper is display: contents", () => {
    const { container } = renderTint("#c04020");

    expect((container.firstElementChild as HTMLElement).className).toContain("contents");
  });
});
