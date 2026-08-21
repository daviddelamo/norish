"use client";

import { MinusIcon, PlusIcon } from "@heroicons/react/16/solid";
import { Button } from "@heroui/react";
import { useTranslations } from "next-intl";

import { useRecipeContextRequired } from "../context";

type ServingsControlProps = {
  compact?: boolean;
  /**
   * `row` is the phone's Ingredients card header: a full-width row naming
   * the servings with real buttons beside it, hittable without looking.
   */
  variant?: "inline" | "row";
};

function formatServings(n: number): string {
  if (Number.isInteger(n)) return String(n);

  // Remove trailing zeros (e.g., 2.50 -> 2.5)
  return n.toFixed(2).replace(/\.?0+$/, "");
}
export default function ServingsControl({
  compact = false,
  variant = "inline",
}: ServingsControlProps) {
  const { currentServings, recipe, setIngredientAmounts } = useRecipeContextRequired();
  const t = useTranslations("recipes.detail");
  const servings = Math.max(0.125, currentServings ?? recipe.servings ?? 1);
  const isRow = variant === "row";
  const buttonClassName = compact
    ? "bg-surface-secondary size-8 min-w-8 px-0"
    : "bg-surface-secondary";
  const valueClassName = compact
    ? "min-w-6 text-center text-xs tabular-nums"
    : "min-w-7 text-center text-sm tabular-nums";

  const dec = () => {
    if (servings <= 1) {
      setIngredientAmounts(Math.max(0.125, servings / 2));

      return;
    }

    if (servings <= 2) {
      setIngredientAmounts(1);

      return;
    }

    setIngredientAmounts(servings - 1);
  };
  const inc = () => {
    if (servings < 1) {
      setIngredientAmounts(Math.min(1, servings * 2));

      return;
    }

    setIngredientAmounts(servings + 1);
  };
  // In the row the two buttons are halves of one filled stepper, so they carry
  // no fill of their own and the group draws the shape.
  const rowButtonClassName = "size-10 min-w-10 rounded-full bg-transparent px-0";
  const decrease = (
    <Button
      isIconOnly
      aria-label={t("decreaseServings")}
      className={isRow ? rowButtonClassName : buttonClassName}
      size={isRow ? "md" : "sm"}
      variant="tertiary"
      onPress={dec}
    >
      <MinusIcon className={isRow ? "size-5" : "h-4 w-4"} />
    </Button>
  );
  const increase = (
    <Button
      isIconOnly
      aria-label={t("increaseServings")}
      className={isRow ? rowButtonClassName : buttonClassName}
      size={isRow ? "md" : "sm"}
      variant="tertiary"
      onPress={inc}
    >
      <PlusIcon className={isRow ? "size-5" : "h-4 w-4"} />
    </Button>
  );

  if (isRow) {
    // No box around the row: the Ingredients card is already the edge here,
    // and an outline inside an outline reads as a form field rather than as
    // the one control on the card worth hitting without looking. What is
    // drawn instead is the stepper itself, as a single filled segment pair.
    return (
      <div className="flex w-full items-center justify-between gap-3">
        <span className="text-base font-medium">{t("servingsCount", { count: servings })}</span>
        <div className="bg-surface-secondary flex shrink-0 items-center rounded-full">
          {decrease}
          <span aria-hidden className="bg-border h-5 w-px shrink-0" />
          {increase}
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex shrink-0 items-center ${compact ? "gap-1" : "gap-1.5"}`}>
      {decrease}
      <span className={valueClassName}>{formatServings(servings)}</span>
      {increase}
    </div>
  );
}
