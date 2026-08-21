"use client";

import { Fragment } from "react";
import AuthorChip from "@/components/recipes/author-chip";
import OriginFlag from "@/components/recipes/origin-flag";
import SmartMarkdownRenderer from "@/components/shared/smart-markdown-renderer";
import {
  CakeIcon,
  ClockIcon,
  FireIcon,
  MoonIcon,
  SunIcon,
  UserGroupIcon,
} from "@heroicons/react/16/solid";
import { Chip } from "@heroui/react";
import { useTranslations } from "next-intl";

import type { RecipeCategory } from "@norish/shared/contracts";
import {
  formatMinutesHM,
  isAllergenTag,
  sortTagsWithAllergyPriority,
} from "@norish/shared/lib/helpers";

type RecipeTagLike = { name: string };

export type RecipeHeaderRecipeLike = {
  name: string;
  description: string | null;
  categories: RecipeCategory[];
  tags: RecipeTagLike[];
  totalMinutes: number | null;
  servings?: number | null;
  calories?: number | null;
  author?: { id?: string; name?: string | null; image?: string | null } | null;
  /** Alpha-2, so the flag and its label are resolved at render time. */
  originCountry?: string | null;
};

type RecipeHeaderMobileProps = {
  recipe: RecipeHeaderRecipeLike;
  allergies?: string[];
  allergySet?: Set<string>;
  /**
   * Calories are Nutrition Information, which is a Hidden Item — a reader who
   * has hidden it loses the entry here too, because a bar that restates a
   * hidden fact is exactly the bug a restating bar invites.
   */
  showCalories?: boolean;
};

const categoryIcons: Record<RecipeCategory, typeof FireIcon> = {
  Breakfast: FireIcon,
  Lunch: SunIcon,
  Dinner: MoonIcon,
  Snack: CakeIcon,
};

type GlanceEntry = {
  key: string;
  icon: typeof ClockIcon;
  value: string;
  label: string;
};

/**
 * The Glance Bar: total time, servings and calories, so the whole answer to
 * "can I cook this tonight?" arrives before any scrolling. It restates facts
 * the sections below own and holds none of its own, so an entry the recipe
 * does not store is simply absent and a recipe storing none of the three
 * renders no bar at all.
 *
 * One filled bar floating on the page background, not an outlined box: the
 * cards below already carry the page's edges, and a second kind of edge
 * around three numbers reads as a form field. Each entry is its icon and its
 * value on one line — the icon does the naming the library's own cards let
 * it do — with the written label kept for anyone reading by ear.
 */
function GlanceBar({ entries }: { entries: GlanceEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <dl className="bg-surface flex items-center rounded-2xl px-2 py-3 shadow-sm">
      {entries.map((entry, index) => (
        <Fragment key={entry.key}>
          {index > 0 && <span aria-hidden className="bg-border h-4 w-px shrink-0" />}
          <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 px-2">
            <entry.icon aria-hidden className="text-muted size-4 shrink-0" />
            <dt className="sr-only">{entry.label}</dt>
            <dd className="text-foreground truncate text-sm font-semibold tabular-nums">
              {entry.value}
            </dd>
          </div>
        </Fragment>
      ))}
    </dl>
  );
}

/**
 * The phone's recipe header, on the page background rather than inside a
 * card: what the dish is, who wrote it down, and the Glance Bar, before the
 * first section starts. Shared by the recipe page and the share page so a
 * shared link looks like Norish; the desktop pages keep
 * `ReadonlyRecipeSummary` untouched.
 */
export default function RecipeHeaderMobile({
  recipe,
  allergies = [],
  allergySet = new Set<string>(),
  showCalories = true,
}: RecipeHeaderMobileProps) {
  const t = useTranslations("recipes.glanceBar");
  const tNutrition = useTranslations("recipes.nutrition");
  const tForm = useTranslations("recipes.form");

  const entries: GlanceEntry[] = [];
  const totalTime = recipe.totalMinutes ? formatMinutesHM(recipe.totalMinutes) : undefined;

  if (totalTime) {
    entries.push({
      key: "total-time",
      icon: ClockIcon,
      value: totalTime,
      label: t("totalTime"),
    });
  }

  if (recipe.servings) {
    entries.push({
      key: "servings",
      icon: UserGroupIcon,
      value: String(recipe.servings),
      label: t("servings", { count: recipe.servings }),
    });
  }

  if (showCalories && recipe.calories != null) {
    entries.push({
      key: "calories",
      icon: FireIcon,
      value: String(Math.round(recipe.calories)),
      label: tNutrition("calories"),
    });
  }

  return (
    <header className="space-y-4">
      {recipe.categories.length > 0 && (
        <div className="text-muted flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {recipe.categories.map((category) => {
            const IconComponent = categoryIcons[category] ?? SunIcon;

            return (
              <span key={category} className="flex items-center gap-1">
                <IconComponent className="size-4" />
                {tForm(`category.${category.toLowerCase()}`)}
              </span>
            );
          })}
        </div>
      )}

      <h1 className="text-2xl leading-tight font-bold">
        <OriginFlag className="mr-2" originCountry={recipe.originCountry} />
        {recipe.name}
      </h1>

      {recipe.author && (
        <div className="w-fit">
          <AuthorChip
            image={recipe.author.image}
            name={recipe.author.name}
            userId={recipe.author.id}
          />
        </div>
      )}

      {recipe.description && (
        <div className="text-base leading-relaxed">
          <SmartMarkdownRenderer text={recipe.description} />
        </div>
      )}

      <GlanceBar entries={entries} />

      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sortTagsWithAllergyPriority(recipe.tags, allergies).map((tag) => {
            const isAllergen = isAllergenTag(tag.name, allergySet);

            return (
              <Chip
                key={tag.name}
                className={isAllergen ? "bg-warning text-warning-foreground" : ""}
                size="sm"
                variant="tertiary"
              >
                {tag.name}
              </Chip>
            );
          })}
        </div>
      )}
    </header>
  );
}
