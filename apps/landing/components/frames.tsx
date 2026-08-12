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
      className={`border-border bg-surface overflow-hidden rounded-2xl border shadow-[0_40px_90px_-50px_rgb(0_0_0/0.45)] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

/** Thin bezel so a mobile screenshot reads as a phone without a fake notch. */
export function Phone({ children, className }: FrameProps) {
  return (
    <div
      className={`border-border bg-surface overflow-hidden rounded-[1.75rem] border-[5px] shadow-[0_30px_70px_-40px_rgb(0_0_0/0.5)] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
