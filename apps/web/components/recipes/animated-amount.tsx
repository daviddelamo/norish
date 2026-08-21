"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

type AnimatedAmountProps = {
  /** The rendered value. A change to it is what plays the transition. */
  value: string;
  className?: string;
};

/**
 * A number that changes under the reader — the servings count and every
 * ingredient amount it scales.
 *
 * Swapping the text outright reads as a repaint and gives no sense that the
 * two numbers are the same quantity; rolling the old value up and out while
 * the new one arrives from above says the figure moved rather than that the
 * page redrew. A reader who has asked for less motion gets the plain swap.
 */
export function AnimatedAmount({ value, className = "" }: AnimatedAmountProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <span className={className}>{value}</span>;
  }

  return (
    // `popLayout` takes the outgoing value out of flow, so the words beside it
    // are not shoved sideways while the two values cross.
    <span className={`relative inline-flex ${className}`}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          initial={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
