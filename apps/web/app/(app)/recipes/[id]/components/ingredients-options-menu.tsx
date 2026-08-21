"use client";

import { useState } from "react";
import { useAmountDisplayPreference } from "@/hooks/use-amount-display-preference";
import {
  AdjustmentsHorizontalIcon,
  ArrowsRightLeftIcon,
  SparklesIcon,
} from "@heroicons/react/20/solid";
import { Button, Dropdown, Label } from "@heroui/react";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";

import { cssAIGradientText, cssAIIconColor, cssButtonPill } from "@norish/web/config/css-tokens";

import { useSystemConversion } from "./use-system-conversion";

type OptionItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  labelClassName?: string;
  iconClassName?: string;
  description?: string;
  isDisabled?: boolean;
};

/**
 * The two things a reader changes about the ingredients themselves: whether
 * amounts read as fractions or decimals, and which measurement system they
 * are in.
 *
 * They live on the Ingredients card rather than in the page's `⋯` menu
 * because that is what they act on — a reader looking at "1½ cups" and
 * wanting "1.5" looks at the list, not at the page. The card header has room
 * for exactly one control beside the title, so both fold into one menu.
 */
export default function IngredientsOptionsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { mode, toggleMode } = useAmountDisplayPreference();
  const conversion = useSystemConversion();
  const t = useTranslations("recipes.detail");
  const tConvert = useTranslations("recipes.convert");

  const items: OptionItem[] = [
    {
      key: "amount-display",
      label: mode === "fraction" ? t("switchToDecimal") : t("switchToFraction"),
      icon: (
        <span aria-hidden className="flex size-5 items-center justify-center text-xs font-medium">
          {mode === "fraction" ? "0.5" : "½"}
        </span>
      ),
      onPress: toggleMode,
    },
  ];

  // The system the recipe is already in is not somewhere to convert to, so
  // only the reachable ones are drawn.
  if (conversion.isAvailable) {
    for (const option of conversion.options) {
      if (option.key === conversion.currentSystem) continue;

      items.push({
        key: `convert-${option.key}`,
        label: option.label,
        icon: option.requiresAI ? (
          <SparklesIcon className="size-5" />
        ) : (
          <ArrowsRightLeftIcon className="size-5" />
        ),
        onPress: () => conversion.convertTo(option.key),
        labelClassName: option.requiresAI ? cssAIGradientText : "",
        iconClassName: option.requiresAI ? cssAIIconColor : "text-muted",
        description: conversion.isConverting ? tConvert("converting") : undefined,
        isDisabled: conversion.isConverting,
      });
    }
  }

  return (
    <Dropdown isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        isIconOnly
        aria-label={t("ingredientOptions")}
        className="text-muted size-8 min-w-8 rounded-full"
        size="sm"
        variant="tertiary"
      >
        <AdjustmentsHorizontalIcon className="size-5" />
      </Button>

      <Dropdown.Popover className="bg-overlay z-[500]">
        <Dropdown.Menu aria-label={t("ingredientOptions")} items={items}>
          {(item: OptionItem) => (
            <Dropdown.Item
              id={item.key}
              key={item.key}
              className="py-1 data-[focus=true]:bg-transparent data-[hovered=true]:bg-transparent"
              textValue={item.label}
            >
              <Button
                className={twMerge("w-full justify-start bg-transparent", cssButtonPill)}
                isDisabled={item.isDisabled}
                size="md"
                variant="tertiary"
                onPress={() => {
                  setIsOpen(false);
                  item.onPress();
                }}
              >
                <span className={item.iconClassName ?? "text-muted"}>{item.icon}</span>
                <span className="flex flex-col items-start">
                  <Label className={twMerge("text-sm font-medium", item.labelClassName)}>
                    {item.label}
                  </Label>
                  {item.description && (
                    <span className="text-muted text-xs">{item.description}</span>
                  )}
                </span>
              </Button>
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
