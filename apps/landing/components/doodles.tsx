import type { CSSProperties } from "react";

type DoodleProps = {
  className?: string;
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const delay = (ms: number) => ({ "--doodle-delay": `${ms}ms` }) as CSSProperties;

/**
 * Little line drawings for the three moments. Each strokes itself in as its
 * section reveals (`.doodle-line` in globals.css), staggered so the drawing
 * happens in the order you would draw it by hand. They are decoration for
 * sighted eyes only; the headings beside them do the talking.
 */

/** Something arriving in a bowl: the import. */
export function BowlDoodle({ className }: DoodleProps) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <g {...stroke}>
        <path
          className="doodle-line"
          d="M4.5 13.25h15M5.15 13.25c.4 3.7 3.15 6.25 6.85 6.25s6.45-2.55 6.85-6.25"
        />
        <path className="doodle-line" d="M12 3.5v5.75M9.6 7l2.4 2.4L14.4 7" style={delay(380)} />
      </g>
    </svg>
  );
}

/** A week with a meal just landed on it: the plan. */
export function CalendarDoodle({ className }: DoodleProps) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <g {...stroke}>
        <path
          className="doodle-line"
          d="M6.5 6.75h11a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-8.5a2 2 0 0 1 2-2Z"
        />
        <path className="doodle-line" d="M8.75 4.5v3.5M15.25 4.5v3.5" style={delay(300)} />
        <path className="doodle-line" d="M4.5 11.25h15" style={delay(450)} />
      </g>
      <circle className="doodle-dot" cx="9.4" cy="15.2" fill="currentColor" r="1.5" />
    </svg>
  );
}

/** A pan with steam that keeps rising: the cooking. */
export function PanDoodle({ className }: DoodleProps) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <g {...stroke}>
        <path
          className="doodle-line"
          d="M3.75 14.5h13.5M4.3 14.5c.15 2.85 2.3 4.75 5.05 4.75h3.8c2.75 0 4.9-1.9 5.05-4.75"
        />
        <path className="doodle-line" d="M17.75 14.5h2.75" style={delay(320)} />
        {/* The strands only drift; their fade cycle is their own arrival. */}
        <path className="steam-line" d="M8.75 11.25c-1-1.1.9-2.05 0-3.2-.8-1.05.6-1.9 0-3.05" />
        <path
          className="steam-line"
          d="M12.75 11.25c-1-1.1.9-2.05 0-3.2-.7-.95.5-1.75 0-2.8"
          style={{ "--steam-delay": "1700ms" } as CSSProperties}
        />
      </g>
    </svg>
  );
}
