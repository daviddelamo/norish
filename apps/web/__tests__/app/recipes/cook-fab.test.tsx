import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import "@testing-library/jest-dom";

import CookingMode from "@/app/(app)/recipes/[id]/components/cookingmode/cooking-mode";

import {
  cssFloatingDockBottomWithNav,
  cssFloatingDockBottomWithShrunkenNav,
  MOBILE_NAV_SHRUNKEN_SCALE,
} from "@norish/web/config/css-tokens";

const mocks = vi.hoisted(() => ({
  isMobile: true,
  isNavVisible: true,
}));

vi.mock("@/hooks/use-is-mobile", () => ({
  useIsMobile: () => mocks.isMobile,
}));
vi.mock("@/hooks/auto-hide", () => ({
  useAutoHide: () => ({ isVisible: mocks.isNavVisible }),
}));
vi.mock("@/components/timer-dock", () => ({
  TimerDock: () => <div data-testid="timer-dock" />,
}));
vi.mock("@/app/(app)/recipes/[id]/components/wake-lock-context", () => ({
  useWakeLockContext: () => ({
    isSupported: false,
    isActive: false,
    enable: vi.fn(),
    disable: vi.fn(),
  }),
}));
vi.mock("@/app/(app)/recipes/[id]/context", () => ({
  useRecipeContextRequired: () => ({
    adjustedIngredients: [],
    recipe: {
      id: "recipe-1",
      name: "Cacio e Pepe",
      steps: [],
      recipeIngredients: [],
      servings: 2,
      systemUsed: "metric",
    },
  }),
}));
vi.mock("@/app/(app)/recipes/[id]/components/cookingmode/use-is-desktop-cooking-mode", () => ({
  useIsDesktopCookingMode: () => false,
}));
vi.mock("@/app/(app)/recipes/[id]/components/cookingmode/mobile-cooking-mode-dialog", () => ({
  MobileCookingModeDialog: () => <div data-testid="cooking-dialog" />,
}));
vi.mock("@/app/(app)/recipes/[id]/components/cookingmode/desktop-cooking-mode-dialog", () => ({
  DesktopCookingModeDialog: () => <div data-testid="cooking-dialog" />,
}));

// The wrapper is rendered as a plain element so the offsets it animates
// between are readable without asserting on any class name.
vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      animate,
      style,
    }: {
      children?: React.ReactNode;
      animate?: Record<string, unknown>;
      style?: Record<string, unknown>;
    }) => (
      <div
        data-animate-bottom={String(animate?.bottom ?? "")}
        data-animate-scale={String(animate?.scale ?? "")}
        data-style-bottom={String(style?.bottom ?? "")}
      >
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@heroui/react", () => ({
  Button: ({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) => (
    <button type="button" onClick={onPress}>
      {children}
    </button>
  ),
  Modal: {
    Backdrop: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
      isOpen ? <div>{children}</div> : null,
    Container: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

beforeEach(() => {
  mocks.isMobile = true;
  mocks.isNavVisible = true;
});

function pill(): HTMLElement {
  return screen.getByText("recipes.detail.cook").closest("[data-style-bottom]")!;
}

/**
 * The cook pill mirrors the timer dock's corner across the nav pill and
 * reads the same offsets, so the two rise and fall with the nav together
 * rather than drifting apart.
 */
describe("Floating cook pill", () => {
  it("sits above the nav while the nav is showing", () => {
    render(<CookingMode floating />);

    expect(pill().dataset.styleBottom).toBe(cssFloatingDockBottomWithNav);
    expect(pill().dataset.animateBottom).toBe(cssFloatingDockBottomWithNav);
  });

  it("shrinks with the nav rather than dropping behind it", () => {
    mocks.isNavVisible = false;

    render(<CookingMode floating />);

    // The nav hides by shrinking in place rather than leaving, so dropping to
    // where it used to end would land the pill on top of it. The pill keeps
    // its station above the bar and takes the bar's own shrink instead.
    expect(pill().dataset.animateBottom).toBe(cssFloatingDockBottomWithShrunkenNav);
    expect(pill().dataset.animateScale).toBe(String(MOBILE_NAV_SHRUNKEN_SCALE));
  });

  it("stays at full size while the nav is showing", () => {
    render(<CookingMode floating />);

    expect(pill().dataset.animateScale).toBe("1");
  });

  it("always reads Cook, because a Cooking Session is never resumed", () => {
    render(<CookingMode floating />);

    expect(screen.getByText("recipes.detail.cook")).toBeInTheDocument();
    expect(screen.queryByText(/continue/i)).not.toBeInTheDocument();
  });

  it("stays in the content flow when it is not floating", () => {
    render(<CookingMode fullWidth />);

    expect(screen.getByText("recipes.detail.cook").closest("[data-style-bottom]")).toBeNull();
  });
});
