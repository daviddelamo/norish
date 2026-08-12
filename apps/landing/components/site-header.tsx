"use client";

import { useEffect, useState } from "react";
import { links } from "@/lib/css-tokens";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";

import { Action } from "./action";
import { BrandLogo } from "./brand-logo";
import { GitHubIcon } from "./icons";
import { ThemeToggle } from "./theme-toggle";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Getting started", href: "#self-host" },
];

/**
 * A quiet bar that stays put. It picks up a hairline and a blur once the page
 * has moved, and does nothing else — no hiding, no shrinking, no floating pill.
 */
export function SiteHeader() {
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 8);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        lifted
          ? "border-border bg-background/80 border-b backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <a aria-label="Norish home" className="shrink-0" href="#top">
          <BrandLogo height={26} width={97} />
        </a>

        <nav className="hidden items-center gap-7 text-sm md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              className="text-muted hover:text-foreground transition-colors"
              href={link.href}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <a
            aria-label="Norish on GitHub"
            className="text-muted hover:text-foreground hover:bg-surface grid size-9 place-items-center rounded-full transition-colors"
            href={links.github}
            rel="noreferrer"
            target="_blank"
          >
            <GitHubIcon className="size-4.5" />
          </a>
          <ThemeToggle />
          <Action external small className="ml-2 hidden sm:inline-flex" href={links.docs}>
            Docs
            <ArrowUpRightIcon className="size-3.5" />
          </Action>
        </div>
      </div>
    </header>
  );
}
