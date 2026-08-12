import type { CSSProperties } from "react";

import { Shot } from "../shot";

type Card = {
  title: string;
  body: string;
  /** The two captures of one screen: the wide one, and the same on a phone. */
  web: "dashboard-web" | "recipe-web" | "cooking-web" | "calendar-web" | "groceries-web";
  mobile:
    | "dashboard-mobile"
    | "recipe-mobile"
    | "cooking-mobile"
    | "calendar-mobile"
    | "groceries-mobile";
  alt: string;
};

const cards: Card[] = [
  {
    title: "Opens on what you are eating today",
    body: "The meals you planned for today sit at the top, each one a tap from the recipe. Everything you have ever saved is under them, searchable and filterable, however many hundreds that has become.",
    web: "dashboard-web",
    mobile: "dashboard-mobile",
    alt: "The Norish home screen: today's planned meals above a searchable grid of saved recipes",
  },
  {
    title: "Made for the middle of cooking",
    body: "Set it to eight servings and every quantity re-does itself. A step can carry the ingredients it actually uses and how much of each: half the water, three of the five eggs. Timers sit in the steps that need them.",
    web: "recipe-web",
    mobile: "recipe-mobile",
    alt: "A recipe page in Norish, with scaled ingredients beside the steps",
  },
  {
    title: "Press Cook and it takes over the screen",
    body: "One step at a time, in type you can read from the other side of the counter, with the ingredients that step uses sitting under it and the screen kept awake until you are done.",
    web: "cooking-web",
    mobile: "cooking-mobile",
    alt: "Cooking mode in Norish: one step filling the screen, with the ingredients it uses beneath it",
  },
  {
    title: "Plan the week where everyone can see it",
    body: "Drop meals onto a calendar your whole household shares, breakfast through dinner, with the calories and servings already worked out. Read the same plan from your own calendar app over CalDAV.",
    web: "calendar-web",
    mobile: "calendar-mobile",
    alt: "The Norish meal calendar, with planned meals on each day and today picked out",
  },
  {
    title: "One list, split between the shops you use",
    body: "What the planned recipes need lands here under the shop you buy it at, each item still naming the recipe it came from, and the ones you buy every week come back on their own. Tick something off and it lands on the other phone before you reach the next shelf.",
    web: "groceries-web",
    mobile: "groceries-mobile",
    alt: "A shared Norish grocery list grouped by shop, with one group folded away and items ticked off",
  },
];

/**
 * The app, a screen at a time, as a deck that stacks up as you scroll: each
 * card rests where the last one left off and the next one slides over it (see
 * `.deck-card` in globals.css). The wide capture is the one on a wide screen
 * and the phone capture the one on a phone, so neither is ever shrunk into
 * something you cannot read.
 *
 * Adding a screen is one entry here plus its four captures, web and mobile in
 * both themes, registered in `components/shot.tsx`.
 */
export function Tour() {
  return (
    <section className="border-border border-t px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-5xl space-y-6">
        {cards.map((card, index) => (
          <article
            key={card.title}
            className="deck-card border-border bg-surface overflow-hidden rounded-3xl border p-6 shadow-[0_40px_90px_-50px_rgb(0_0_0/0.45)] sm:p-8"
            style={{ "--card": index } as CSSProperties}
          >
            <div className="grid gap-6 md:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] md:items-center md:gap-10">
              <div>
                <h2 className="font-serif text-2xl leading-tight font-medium text-balance">
                  {card.title}
                </h2>
                <p className="text-muted mt-3 text-sm leading-relaxed text-pretty">{card.body}</p>
              </div>

              {/* The card is the frame, so the capture only needs a hairline of
                  its own to sit off the surface it is printed on. */}
              <div className="border-border mx-auto w-52 overflow-hidden rounded-xl border sm:w-60 md:mx-0 md:w-full">
                {/* The breakpoint lives on the wrapper: `Shot` already spends
                    display on swapping its own light and dark variant. */}
                <div className="md:hidden">
                  <Shot alt={card.alt} base={card.mobile} className="w-full" sizes="15rem" />
                </div>
                <div className="hidden md:block">
                  <Shot
                    alt={card.alt}
                    base={card.web}
                    className="w-full"
                    sizes="(min-width: 768px) 38rem, 90vw"
                  />
                </div>
              </div>
            </div>
          </article>
        ))}

        <p className="text-muted/70 pt-6 text-xs text-pretty">
          Unit conversion, nutrition and allergen detection need an AI provider, which you bring and
          configure yourself.
        </p>
      </div>
    </section>
  );
}
