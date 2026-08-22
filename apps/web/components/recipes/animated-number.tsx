"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

type AnimatedNumberProps = {
  /** The rendered value. A change to it is what rolls the digits. */
  value: string;
  className?: string;
};

/** The roll, slow enough to read as a number moving rather than as a flicker. */
const TRANSITION = { duration: 0.42, ease: [0.22, 0.61, 0.36, 1] } as const;

/** The leading number in a formatted value, for deciding which way to roll. */
function magnitude(value: string): number {
  const match = value.match(/-?\d+(?:[.,]\d+)?/);

  return match ? Number(match[0].replace(",", ".")) : 0;
}

/**
 * A number that changes under the reader — an ingredient amount, a serving
 * count, a macro.
 *
 * Swapping the text outright reads as a repaint and gives no sense that the two
 * figures are the same quantity. Each character slot rolls instead, the way an
 * odometer does: a character that did not change stays perfectly still, and the
 * ones that did travel in the direction the number moved. Slots are keyed from
 * the right, so 400 → 1000 rolls what actually changed rather than shifting
 * every digit one place.
 *
 * Only the figure belongs in here. Rolling the word beside it — "4 servings" —
 * animates a word that did not change, which reads as a glitch rather than as a
 * count going up.
 */
export function AnimatedNumber({ value, className = "" }: AnimatedNumberProps) {
  const prefersReducedMotion = useReducedMotion();
  const previous = useRef(value);
  const isRising = magnitude(value) >= magnitude(previous.current);

  useEffect(() => {
    previous.current = value;
  }, [value]);

  if (prefersReducedMotion) {
    return <span className={`tabular-nums ${className}`}>{value}</span>;
  }

  const characters = [...value];

  return (
    <span className={`inline-flex tabular-nums ${className}`}>
      {/* Splitting the figure across slots would have anything reading it aloud
          say "five, zero, zero", so the whole value is carried once alongside.
          A single-character value is not split, and needs no such repair. */}
      {characters.length > 1 && <span className="sr-only">{value}</span>}

      {characters.map((character, index) => (
        <span
          // Keyed from the right, so a value that grows a digit rolls only what
          // actually changed.
          key={characters.length - index}
          aria-hidden={characters.length > 1}
          className="relative inline-flex overflow-hidden"
        >
          {/* `popLayout` takes the outgoing character out of flow, so the slot
              is sized by the incoming one and the two cross inside it. */}
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={character}
              animate={{ y: "0%" }}
              exit={{ y: isRising ? "-100%" : "100%" }}
              initial={{ y: isRising ? "100%" : "-100%" }}
              transition={TRANSITION}
            >
              {character}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}
