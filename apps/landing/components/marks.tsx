import type { CSSProperties } from "react";

import { Reveal } from "./reveal";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Every stroke is dashed to its own length, so all of them draw at one rate. */
const drawn = { className: "stroke-in", pathLength: 1 } as const;

/*
 * Ingredients, drawn small: a sprig, a mushroom, a tomato, a pear, a lemon.
 * They are all food rather than kit, they carry no meaning and they
 * label nothing — they are there so the quiet parts of the page have something
 * of the kitchen in them. Each one draws itself the first time it is scrolled
 * to, then keeps a slow turn going, and travels its own small distance against
 * the page (see `.mark` in globals.css).
 *
 * Anything here has to survive being drawn at forty-odd pixels in a hairline,
 * so a shape is only worth keeping if it reads at a glance at that size.
 */

function Sprig() {
  return (
    <>
      <path {...drawn} d="M16 31V7" />
      <path {...drawn} d="M16 23c-7-1-10-6-10-11 6 1 9 5 10 11Z" />
      <path {...drawn} d="M16 17c7-1 10-6 10-11-6 1-9 5-10 11Z" />
    </>
  );
}

function Mushroom() {
  return (
    <>
      <path {...drawn} d="M4 17c0-7 5.4-12.5 12-12.5S28 10 28 17Z" />
      <path {...drawn} d="M12 17v7a4 4 0 0 0 8 0v-7" />
    </>
  );
}

function Tomato() {
  return (
    <>
      <path {...drawn} d="M6 20a10 9.5 0 0 0 20 0a10 9.5 0 0 0-20 0Z" />
      <path {...drawn} d="M16 10.5c-2-3-5-4.5-7.5-4.5 0 3 2.5 5.5 5.5 5.5" />
      <path {...drawn} d="M16 10.5c2-3 5-4.5 7.5-4.5 0 3-2.5 5.5-5.5 5.5" />
      <path {...drawn} d="M16 10.5V6" />
    </>
  );
}

function Pear() {
  return (
    <>
      <path
        {...drawn}
        d="M16 7c-2 0-3 1.6-3 3.6 0 2.4-.8 3.8-2 5.4-1.8 2.4-3.5 4.4-3.5 7.5a8.5 8.5 0 0 0 17 0c0-3.1-1.7-5.1-3.5-7.5-1.2-1.6-2-3-2-5.4C19 8.6 18 7 16 7Z"
      />
      <path {...drawn} d="M16 7V3" />
      <path {...drawn} d="M16.5 5c1.5-2.5 4-3 5.5-3 0 2-1 4.5-3.5 5" />
    </>
  );
}

function Lemon() {
  return (
    <>
      <path {...drawn} d="M6.5 17c0-5.2 4.3-9 9.5-9s9.5 3.8 9.5 9-4.3 9-9.5 9-9.5-3.8-9.5-9Z" />
      <path {...drawn} d="M3.5 17h3M25.5 17h3" />
      <path {...drawn} d="M18 9c1.5-3 4.5-4 6.5-4 0 2.5-1.5 5.5-4.5 6" />
    </>
  );
}

const shapes = {
  sprig: Sprig,
  mushroom: Mushroom,
  tomato: Tomato,
  pear: Pear,
  lemon: Lemon,
};

export type MarkShape = keyof typeof shapes;

type MarkProps = {
  shape: MarkShape;
  /** Where it sits, as Tailwind inset utilities on the block it belongs to. */
  at: string;
  /** Its share of the block's travel: under 1 lags the page, over 1 leads it. */
  depth?: number;
  /** How long it takes to turn once, so no two of them ever line up. */
  turn?: number;
  /** How far into the drawing it starts, for a group that arrives together. */
  delay?: number;
  className?: string;
};

/**
 * One drawing, placed. It needs a positioned ancestor to sit in, and a `Drift`
 * somewhere above it if it is to travel; without one it simply holds still.
 */
export function Mark({ shape, at, depth = 1, turn = 11, delay = 0, className }: MarkProps) {
  const Shape = shapes[shape];

  return (
    <Reveal
      className={`mark ${at} ${className ?? ""}`}
      delay={delay}
      style={
        {
          "--depth": depth,
          "--turn": `${turn}s`,
          "--turn-delay": `${-turn * 0.37 * depth}s`,
        } as CSSProperties
      }
      variant="bare"
    >
      <svg aria-hidden className="size-full" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <g {...stroke}>
          <Shape />
        </g>
      </svg>
    </Reveal>
  );
}
