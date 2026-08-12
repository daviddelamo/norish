import type { ReactNode } from "react";

type FrameProps = {
  children: ReactNode;
  className?: string;
};

/**
 * A screenshot presented as itself. The app already draws its own header, so
 * there is no fake browser chrome here — just a hairline, a radius and a shadow
 * soft enough to read as depth rather than decoration.
 */
export function Screen({ children, className }: FrameProps) {
  return (
    <div
      className={`border-border bg-surface overflow-hidden rounded-xl border shadow-[0_40px_90px_-50px_rgb(0_0_0/0.45)] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

/**
 * Thin bezel so a mobile screenshot reads as a phone without a fake notch.
 * Sized for riding along in a corner of the wide capture, so the bezel and
 * radius stay in proportion at a few rem wide.
 */
export function Phone({ children, className }: FrameProps) {
  return (
    <div
      className={`border-border bg-surface overflow-hidden rounded-[1rem] border-[3px] shadow-[0_24px_50px_-24px_rgb(0_0_0/0.55)] md:rounded-[1.35rem] md:border-4 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
