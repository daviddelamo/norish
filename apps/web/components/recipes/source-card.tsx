"use client";

import { ArrowTopRightOnSquareIcon, GlobeAltIcon } from "@heroicons/react/16/solid";
import { Card } from "@heroui/react";
import { useTranslations } from "next-intl";

export type SourceRecipeLike = {
  url: string | null;
};

type SourceCardProps = {
  recipe: SourceRecipeLike;
  /** Off where the surrounding page is still one card. */
  inCard?: boolean;
};

/** The host a recipe came from, or the stored string when it will not parse. */
function sourceLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Where a recipe came from, as a card of its own — legible, rather than the
 * five-pixel icon that used to sit beside the title. A recipe with no URL
 * has no card.
 */
export default function SourceCard({ recipe, inCard = true }: SourceCardProps) {
  const t = useTranslations("recipes.detail");

  if (!recipe.url) return null;

  const content = (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{t("source")}</h2>
      <a
        className="text-accent flex items-center gap-2 text-base break-all no-underline"
        href={recipe.url}
        rel="noopener noreferrer"
        target="_blank"
        title={t("viewOriginal")}
      >
        <GlobeAltIcon aria-hidden className="size-4 shrink-0" />
        {sourceLabel(recipe.url)}
        <ArrowTopRightOnSquareIcon aria-hidden className="size-4 shrink-0" />
      </a>
    </div>
  );

  if (!inCard) return content;

  return (
    <Card className="rounded-2xl">
      <Card.Content className="p-5">{content}</Card.Content>
    </Card>
  );
}
