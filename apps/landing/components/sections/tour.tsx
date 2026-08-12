"use client";

import { useRef } from "react";

import { Phone, Screen } from "../frames";
import { clamp, useScrollFrame } from "../scroll-frame";
import { Shot } from "../shot";

type Screenful = {
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

const screens: Screenful[] = [
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
 * How far down the screen a block comes to rest, matching the `top` its copy
 * sticks at. A block has arrived when it reaches this line, and it holds there
 * beside its capture until the next block pushes it off.
 */
const TRIGGER = 0.38;

/** The share of a block's stretch of scroll its capture spends fading in. */
const FADE = 0.45;

/** The shorter handover of ghost to ink, so only one block is ever being read. */
const INK = 0.25;

/**
 * How far the reader has come, counted in blocks: a whole number is a block at
 * the line, the fraction between two is the handover from one to the next. Read
 * straight off the geometry on a frame rather than from remembered offsets, so
 * it survives a resize, a zoom, and a browser restoring a scroll position in the
 * middle of the section.
 */
function readerAt(blocks: (HTMLLIElement | null)[], line: number) {
  const tops = blocks.map((block) => block?.getBoundingClientRect().top ?? Infinity);
  let at = 0;

  for (let index = 0; index < tops.length; index += 1) {
    const top = tops[index];

    if (top === undefined || top > line) break;

    const next = tops[index + 1];

    at = next === undefined ? index : index + clamp((line - top) / (next - top));
  }

  return at;
}

/**
 * One screen, both shapes: the wide capture with the phone capture riding its
 * corner, because the point is that both are the same screen.
 */
function Capture({ screen }: { screen: Screenful }) {
  return (
    <div className="relative">
      <Screen>
        <Shot
          alt={screen.alt}
          base={screen.web}
          className="w-full"
          sizes="(min-width: 64rem) 42rem, 92vw"
        />
      </Screen>
      <Phone className="absolute -right-1 -bottom-4 w-[23%] sm:-right-2 sm:-bottom-5">
        <Shot
          alt=""
          base={screen.mobile}
          className="w-full"
          sizes="(min-width: 64rem) 10rem, 21vw"
        />
      </Phone>
    </div>
  );
}

/**
 * The app, a screen at a time. The copy walks down the page on the left and the
 * capture stays with it on the right, dissolving into the next screen across the
 * handover between two blocks and taking the copy from ghost to ink with it. All
 * of it is scrubbed by the scroll rather than played on a timer, so it follows
 * you exactly, both ways.
 *
 * Below the two-column break there is nothing to keep still, so each block simply
 * carries its own capture underneath it, all of them in ink.
 *
 * Adding a screen is one entry here plus its four captures, web and mobile in
 * both themes, registered in `components/shot.tsx`.
 */
export function Tour() {
  const blocks = useRef<(HTMLLIElement | null)[]>([]);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);

  useScrollFrame(() => {
    const at = readerAt(blocks.current, window.innerHeight * TRIGGER);

    // The captures are stacked, so each one fades in over the one before it
    // rather than the two of them dissolving through to the page underneath.
    layers.current.forEach((layer, index) => {
      layer?.style.setProperty("--lit", `${clamp((at - index + FADE) / FADE)}`);
    });

    // A block is in ink from the moment it reaches the line until the next one
    // takes over, rather than only at the instant it lands.
    const read = (index: number) =>
      `${Math.min(clamp((at - index + INK) / INK), clamp((index + 1 - at) / INK))}`;

    blocks.current.forEach((block, index) => block?.style.setProperty("--lit", read(index)));
    dots.current.forEach((dot, index) => dot?.style.setProperty("--lit", read(index)));
  });

  return (
    <section className="border-border border-t px-5 py-24 sm:px-8 sm:py-28">
      <div className="mx-auto grid max-w-5xl lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-10">
        {/* The head puts the first block on the line the moment the section is
            reached, so it opens level with the capture rather than above it;
            the tail keeps the capture held while the last block is read. Each
            block owns a stretch of scroll a little shorter than the screen, and
            rests on the line for most of it. */}
        <ol className="space-y-20 lg:space-y-0 lg:pt-[calc(38svh-7rem)] lg:pb-[30svh]">
          {screens.map((screen, index) => (
            <li
              key={screen.title}
              ref={(node) => {
                blocks.current[index] = node;
              }}
              className="screen-step lg:h-[62svh]"
            >
              <div className="lg:sticky lg:top-[38svh]">
                <h2 className="font-serif text-2xl leading-tight font-medium text-balance sm:text-3xl">
                  {screen.title}
                </h2>
                <p className="text-muted mt-4 leading-relaxed text-pretty">{screen.body}</p>

                <div className="mt-8 lg:hidden">
                  <Capture screen={screen} />
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="hidden lg:block">
          <div className="sticky top-0 flex h-svh flex-col justify-center">
            {/* Every capture is in the stack and only the ones being read are
                painted, so the swap is a dissolve rather than a load, and the
                box keeps the captures' shape whichever one is showing. */}
            <div className="relative aspect-1120/839">
              {screens.map((screen, index) => (
                <div
                  key={screen.title}
                  ref={(node) => {
                    layers.current[index] = node;
                  }}
                  className="screen-layer"
                >
                  <Capture screen={screen} />
                </div>
              ))}
            </div>

            <div aria-hidden className="mt-9 flex items-center justify-center gap-2">
              {screens.map((screen, index) => (
                <span
                  key={screen.title}
                  ref={(node) => {
                    dots.current[index] = node;
                  }}
                  className="progress-dot"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
