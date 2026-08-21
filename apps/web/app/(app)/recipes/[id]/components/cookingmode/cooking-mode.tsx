"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWakeLockContext } from "@/app/(app)/recipes/[id]/components/wake-lock-context";
import { TimerDock } from "@/components/timer-dock";
import { useFloatingDock } from "@/hooks/use-floating-dock";
import { FireIcon } from "@heroicons/react/20/solid";
import { Button, Modal } from "@heroui/react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

import { cssFloatingDockPill } from "@norish/web/config/css-tokens";

import type { CookingModeView } from "./types";
import { useRecipeContextRequired } from "../../context";
import { resolveCookingModeSteps } from "./cooking-mode-steps";
import { STEP_SCROLL_ATTRIBUTE } from "./cooking-step-view";
import { DesktopCookingModeDialog } from "./desktop-cooking-mode-dialog";
import { MobileCookingModeDialog } from "./mobile-cooking-mode-dialog";
import { useIsDesktopCookingMode } from "./use-is-desktop-cooking-mode";
import { clampStep } from "./utils";

type SwipePoint = {
  x: number;
  y: number;
  /**
   * The drag began inside a long step's own scroll region, so it is a scroll
   * rather than a page turn. Only the vertical gesture is suppressed —
   * reaching the ingredients sideways still works from anywhere.
   */
  startedInStepScroll: boolean;
};

type CookingModeProps = {
  className?: string;
  fullWidth?: boolean;
  /**
   * The phone's entry point: a pill floating in the bottom-left corner,
   * mirroring the timer dock's corner across the nav pill and rising and
   * falling with the nav exactly as it does, so the one control a cook came
   * for is never scrolled off screen and never covers a running timer.
   */
  floating?: boolean;
};

const SWIPE_THRESHOLD = 56;

export default function CookingMode({
  className = "",
  fullWidth = false,
  floating = false,
}: CookingModeProps) {
  const { adjustedIngredients, recipe } = useRecipeContextRequired();
  const { disable, enable, isActive, isSupported } = useWakeLockContext();
  const tDetail = useTranslations("recipes.detail");
  const isDesktop = useIsDesktopCookingMode();
  const floatingDock = useFloatingDock({ align: "start" });
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<CookingModeView>("steps");
  const [activeStep, setActiveStep] = useState(0);
  const [areTimersOpen, setAreTimersOpen] = useState(false);
  // Ready At is fixed when the Cooking Session begins, not on page load: it
  // is the moment the cook started plus the recipe's total time.
  const [readyAt, setReadyAt] = useState<Date | null>(null);
  const wakeLockOwnedRef = useRef(false);
  const swipeStartRef = useRef<SwipePoint | null>(null);

  const steps = useMemo(
    () => resolveCookingModeSteps(recipe.steps ?? [], recipe.systemUsed ?? "metric"),
    [recipe.steps, recipe.systemUsed]
  );
  const displayIngredients =
    adjustedIngredients?.length > 0 ? adjustedIngredients : recipe.recipeIngredients;
  const currentStep = clampStep(activeStep, steps.length);

  useEffect(() => {
    if (activeStep !== currentStep) {
      setActiveStep(currentStep);
    }
  }, [activeStep, currentStep]);

  useEffect(() => {
    if (!isOpen || !isSupported || isActive || wakeLockOwnedRef.current) {
      return;
    }

    wakeLockOwnedRef.current = true;
    void enable();
  }, [enable, isActive, isOpen, isSupported]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    if (wakeLockOwnedRef.current) {
      wakeLockOwnedRef.current = false;
      disable();
    }
  }, [disable, isOpen]);

  useEffect(() => {
    return () => {
      if (wakeLockOwnedRef.current) {
        wakeLockOwnedRef.current = false;
        disable();
      }
    };
  }, [disable]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveView("ingredients");
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveView("steps");
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveView("steps");
        setActiveStep((step) => clampStep(step + 1, steps.length));
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveView("steps");
        setActiveStep((step) => clampStep(step - 1, steps.length));
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, steps.length]);

  const close = useCallback(() => setIsOpen(false), []);
  const handlePointerDown = useCallback((event: ReactPointerEvent) => {
    if (event.pointerType === "mouse") {
      return;
    }

    // Ignore events from portaled content (e.g. lightbox) — React synthetic events
    // bubble through the React tree even for portals, but the DOM target won't be
    // inside the handler's DOM element
    const target = event.nativeEvent.target as Node | null;

    if (target && event.currentTarget && !event.currentTarget.contains(target)) {
      return;
    }

    swipeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      startedInStepScroll: Boolean(
        target instanceof Element && target.closest(`[${STEP_SCROLL_ATTRIBUTE}]`)
      ),
    };
  }, []);
  const handlePointerUp = useCallback(
    (event: ReactPointerEvent) => {
      const start = swipeStartRef.current;

      swipeStartRef.current = null;

      if (!start || event.pointerType === "mouse") {
        return;
      }

      const deltaX = event.clientX - start.x;
      const deltaY = event.clientY - start.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > absY && absX > SWIPE_THRESHOLD) {
        setActiveView(deltaX < 0 ? "ingredients" : "steps");

        return;
      }

      if (start.startedInStepScroll) {
        return;
      }

      if (activeView === "steps" && absY > absX && absY > SWIPE_THRESHOLD) {
        setActiveStep((step) => clampStep(step + (deltaY < 0 ? 1 : -1), steps.length));
      }
    },
    [activeView, steps.length]
  );
  const dialogProps = {
    activeStep: currentStep,
    activeView,
    areTimersOpen,
    displayIngredients,
    readyAt,
    recipe: {
      id: recipe.id,
      name: recipe.name,
      image: recipe.images?.[0]?.image ?? recipe.image ?? null,
      categories: recipe.categories ?? [],
      totalMinutes: recipe.totalMinutes,
      servings: recipe.servings,
      systemUsed: recipe.systemUsed ?? "metric",
    },
    steps,
    onClose: close,
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onStepChange: setActiveStep,
    onTimersOpenChange: setAreTimersOpen,
    onViewChange: setActiveView,
  };

  const open = () => {
    // A Cooking Session is not persisted, so opening always begins a new one:
    // first step, fresh Ready At.
    setActiveView("steps");
    setActiveStep(0);
    setAreTimersOpen(false);
    setReadyAt(
      recipe.totalMinutes && recipe.totalMinutes > 0
        ? new Date(Date.now() + recipe.totalMinutes * 60_000)
        : null
    );
    setIsOpen(true);
  };
  // A Cooking Session is never persisted, so there is never one to continue:
  // the control reads "Cook" and only ever starts a new session.
  const label = (
    <>
      <FireIcon className="size-5" />
      {tDetail("cook")}
    </>
  );

  return (
    <>
      {floating ? (
        <motion.div
          animate={floatingDock.animate}
          className={`${floatingDock.className} z-50`}
          style={floatingDock.style}
          transition={floatingDock.transition}
        >
          <Button
            className={`pointer-events-auto shadow-xl ${cssFloatingDockPill}`}
            variant="primary"
            onPress={open}
          >
            {label}
          </Button>
        </motion.div>
      ) : (
        <Button className={className} fullWidth={fullWidth} variant="primary" onPress={open}>
          {label}
        </Button>
      )}

      <Modal.Backdrop
        className="bg-background/75 z-[1099]"
        isOpen={isOpen}
        variant="blur"
        onOpenChange={(open) => {
          if (!open) setIsOpen(false);
        }}
      >
        <Modal.Container
          className={isDesktop ? "z-[1100] items-center justify-center md:p-8" : "z-[1100] p-0"}
          size={isDesktop ? "cover" : "full"}
        >
          <Modal.Dialog
            className={
              isDesktop
                ? "flex items-center justify-center rounded-none bg-transparent p-0 shadow-none"
                : "bg-background flex h-[100dvh] w-[100dvw] flex-col overflow-hidden p-0 shadow-none"
            }
          >
            <>
              {isDesktop ? (
                <DesktopCookingModeDialog {...dialogProps} />
              ) : (
                <MobileCookingModeDialog {...dialogProps} />
              )}
              <TimerDock
                className="z-[1150]"
                isExpanded={areTimersOpen}
                onExpandedChange={setAreTimersOpen}
              />
            </>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
