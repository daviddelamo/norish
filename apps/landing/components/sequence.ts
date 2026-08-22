"use client";

import { clamp } from "./scroll-frame";

/** A soft start and stop on each move, so it never reads as a jump cut. */
export function ease(t: number) {
  return t * t * (3 - 2 * t);
}

const asked = new Map<string, MediaQueryList>();

/**
 * A media query, kept around between frames. Read live rather than remembered,
 * so a resize or a change of preference takes hold on the next frame.
 */
export function asking(query: string) {
  let query_ = asked.get(query);

  if (!query_) {
    query_ = window.matchMedia(query);
    asked.set(query, query_);
  }

  return query_.matches;
}

/** Whether less motion was asked for. */
export function prefersCalm() {
  return asking("(prefers-reduced-motion: reduce)");
}

/** The share of a held screen one step rests for, given how long a move takes. */
export function holdOf(count: number, glide: number) {
  return (1 - (count - 1) * glide) / count;
}

/**
 * Where a sequence is, counted in steps, at a given point of the held screen. A
 * whole number is a step at rest; the fraction between two is a move underway.
 * Each step rests for the same stretch, and the moves between them are eased so
 * the sequence reads as one thing walking rather than a set of cuts.
 */
export function walkAt(progress: number, count: number, glide: number) {
  const hold = holdOf(count, glide);
  let rests = 0;

  for (let step = 0; step < count - 1; step += 1) {
    const leaves = rests + hold;

    if (progress <= leaves) return step;
    if (progress < leaves + glide) return step + ease((progress - leaves) / glide);

    rests = leaves + glide;
  }

  return count - 1;
}

/**
 * How far a held section has come, as 0 to 1. Read off the geometry on the
 * frame rather than from remembered offsets, so it survives a resize, a zoom,
 * and a browser restoring a scroll position in the middle of the section.
 */
export function heldAt(section: HTMLElement) {
  const { top, height } = section.getBoundingClientRect();
  const held = height - window.innerHeight;

  return held > 0 ? clamp(-top / held) : 0;
}
