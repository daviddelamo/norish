"use client";

import type { ComponentType } from "react";
import { useRef } from "react";

import { BowlDoodle, CalendarDoodle, PanDoodle } from "../doodles";
import { clamp, useScrollFrame } from "../scroll-frame";

/** Tint classes are written out in full so Tailwind's scanner can see them. */
const moments: {
  title: string;
  glyph: ComponentType<{ className?: string }>;
  tint: string;
  track: string;
  fill: string;
  body: string;
}[] = [
  {
    title: "Import",
    glyph: BowlDoodle,
    tint: "text-tint-site",
    track: "bg-tint-site/20",
    fill: "bg-tint-site",
    body: "Give it a link, a video, a photo or the text itself. What comes back is structured, searchable and yours.",
  },
  {
    title: "Plan",
    glyph: CalendarDoodle,
    tint: "text-tint-text",
    track: "bg-tint-text/20",
    fill: "bg-tint-text",
    body: "Drop meals onto a calendar the whole household shares, and let the grocery list build itself from what you planned.",
  },
  {
    title: "Cook",
    glyph: PanDoodle,
    tint: "text-tint-photo",
    track: "bg-tint-photo/25",
    fill: "bg-tint-photo",
    body: "Open cooking mode for big, glanceable steps, timers and scaled quantities, on a screen that stays awake.",
  },
];

/** The share of the held screen spent moving from one step to the next. */
const GLIDE = 0.18;

/** A soft start and stop on each move, so it never reads as a jump cut. */
const ease = (t: number) => t * t * (3 - 2 * t);

let calm: MediaQueryList | null = null;

/** Whether less motion was asked for. Read live, so a change takes hold at once. */
function prefersCalm() {
  calm ??= window.matchMedia("(prefers-reduced-motion: reduce)");

  return calm.matches;
}

/**
 * Where the rail is, counted in steps, at a given point of the held screen. A
 * whole number is a step at rest; the fraction between two is a move underway.
 */
function walkAt(progress: number, count: number) {
  const hold = (1 - (count - 1) * GLIDE) / count;
  let rests = 0;

  for (let step = 0; step < count - 1; step += 1) {
    const leaves = rests + hold;

    if (progress <= leaves) return step;
    if (progress < leaves + GLIDE) return step + ease((progress - leaves) / GLIDE);

    rests = leaves + GLIDE;
  }

  return count - 1;
}

/**
 * Import, then plan, then cook: a sequence, so it plays like one. The section
 * holds the screen and the page's own scroll walks the rail sideways, a step at
 * a time, resting on each one long enough to read it with the next already
 * ghosting in past the edge. Everything is worked out from where the section
 * sits in the scroll, so it scrubs both ways and never plays to an empty room;
 * under reduced motion the rail snaps between steps instead of sliding.
 *
 * Without scripting the rail is exactly what it looks like: a row you swipe
 * yourself, snapping to each step (see `.moments-*` in globals.css).
 */
export function Moments() {
  const stage = useRef<HTMLElement>(null);
  const rail = useRef<HTMLOListElement>(null);
  const steps = useRef<(HTMLLIElement | null)[]>([]);
  const dots = useRef<(HTMLSpanElement | null)[]>([]);

  useScrollFrame(() => {
    const section = stage.current;

    if (!section || !rail.current) return;

    const { top, height } = section.getBoundingClientRect();
    const held = height - window.innerHeight;
    const progress = held > 0 ? clamp(-top / held) : 0;
    const walked = walkAt(progress, moments.length);
    const walk = prefersCalm() ? Math.round(walked) : walked;
    const hold = (1 - (moments.length - 1) * GLIDE) / moments.length;
    // How much of the section has arrived, for the first step: it is already
    // there when the screen is taken, so it settles on the way in instead.
    const arriving = clamp((window.innerHeight - top) / window.innerHeight);

    rail.current.style.setProperty("--walk", `${walk}`);

    steps.current.forEach((step, index) => {
      if (!step) return;

      const resting = clamp((progress - index * (hold + GLIDE)) / hold);
      const settled = index === 0 ? Math.max(resting, arriving) : resting;

      step.style.setProperty("--draw", `${clamp(settled / 0.5)}`);
      step.style.setProperty("--fill", `${clamp((settled - 0.15) / 0.6)}`);
    });

    dots.current.forEach((dot, index) => {
      dot?.style.setProperty("--lit", `${clamp(1 - Math.abs(walk - index))}`);
    });
  });

  return (
    <section ref={stage} className="moments-stage border-border border-t">
      <div className="moments-pin py-20 sm:py-24">
        <div className="moments-viewport">
          <ol ref={rail} className="moments-track">
            {moments.map(({ title, body, glyph: Glyph, tint, track, fill }, index) => (
              <li
                key={title}
                ref={(node) => {
                  steps.current[index] = node;
                }}
                className="moment"
              >
                <div className="max-w-2xl">
                  <Glyph className={`size-10 sm:size-12 ${tint}`} />

                  <div className="mt-8 flex items-center gap-4">
                    <span className={`font-serif text-lg leading-none font-medium ${tint}`}>
                      {`0${index + 1}`}
                    </span>
                    <span
                      className={`relative block h-0.5 flex-1 overflow-hidden rounded-full ${track}`}
                    >
                      <span
                        aria-hidden
                        className={`moment-fill absolute inset-0 origin-left ${fill}`}
                      />
                    </span>
                  </div>

                  <h2 className="mt-8 font-serif text-4xl leading-tight font-medium text-balance sm:text-5xl">
                    {title}
                  </h2>
                  <p className="text-muted mt-5 max-w-xl leading-relaxed text-pretty sm:text-lg">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Which step you are on. Only shown where the rail moves with the
            page; where you swipe it yourself, the rail says so itself. */}
        <div aria-hidden className="moments-dots mx-auto mt-12 w-full max-w-5xl px-5 sm:px-8">
          {moments.map(({ title }, index) => (
            <span
              key={title}
              ref={(node) => {
                dots.current[index] = node;
              }}
              className="progress-dot"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
