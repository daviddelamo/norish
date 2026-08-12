"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

/**
 * One observer serves every reveal on the page. Each element is watched until
 * it first appears, then dropped — nothing keeps observing after it has done
 * its job.
 */
const pending = new Map<Element, () => void>();

let sharedObserver: IntersectionObserver | null = null;

function observerFor(element: Element, onShown: () => void) {
  sharedObserver ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        pending.get(entry.target)?.();
        pending.delete(entry.target);
        sharedObserver?.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
  );

  pending.set(element, onShown);
  sharedObserver.observe(element);

  return sharedObserver;
}

/** Tracks whether an element has entered the viewport at least once. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = observerFor(element, () => setShown(true));

    return () => {
      pending.delete(element);
      observer.unobserve(element);
    };
  }, []);

  return { ref, shown };
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Milliseconds to hold back after the element is seen, for staggering. */
  delay?: number;
  /** Screenshots settle further and slower than text does. */
  variant?: "text" | "media";
};

/** Fades and lifts its children into place the first time they are scrolled to. */
export function Reveal({ children, className, delay = 0, variant = "text" }: RevealProps) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  const style = delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined;

  return (
    <div
      ref={ref}
      className={`${variant === "media" ? "reveal-media" : "reveal"} ${className ?? ""}`}
      data-shown={shown}
      style={style}
    >
      {children}
    </div>
  );
}
