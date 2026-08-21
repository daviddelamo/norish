"use client";

import UserAvatar from "@/components/shared/user-avatar";
import { ArrowTopRightOnSquareIcon, GlobeAltIcon } from "@heroicons/react/16/solid";
import { Card } from "@heroui/react";
import { useTranslations } from "next-intl";

export type SourceRecipeLike = {
  url: string | null;
  author?: { id?: string; name?: string | null; image?: string | null } | null;
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
 * five-pixel icon that used to sit beside the title.
 *
 * The site it was imported from and the person who imported it are the same
 * question asked twice, so they answer it together here rather than the second
 * one competing with the title for the top of the page. A recipe with neither
 * has no card.
 */
export default function SourceCard({ recipe, inCard = true }: SourceCardProps) {
  const t = useTranslations("recipes.detail");

  // Narrowed to a name that is actually there, so the credit line never reads
  // "Added by null".
  const author = recipe.author?.name ? { ...recipe.author, name: recipe.author.name } : null;

  if (!recipe.url && !author) return null;

  const content = (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{t("source")}</h2>

      {recipe.url && (
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
      )}

      {author && (
        // A row in the same shape as the source link above it, not a bordered
        // pill: the card is already the object here, and a chip inside it is a
        // second edge saying nothing the row does not.
        <div className="flex items-center gap-2 text-base">
          <UserAvatar image={author.image} name={author.name} size="xs" userId={author.id} />
          <span className="text-muted truncate">{t("addedBy", { name: author.name })}</span>
        </div>
      )}
    </div>
  );

  if (!inCard) return content;

  return (
    <Card className="rounded-2xl">
      <Card.Content className="p-5">{content}</Card.Content>
    </Card>
  );
}
