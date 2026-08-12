import { links } from "@/lib/css-tokens";

import { Action } from "../action";
import { GitHubIcon } from "../icons";
import { Reveal } from "../reveal";
import { SourceFlow } from "../source-flow";

export function Hero() {
  return (
    <section className="relative px-5 pt-32 pb-20 sm:px-8 sm:pt-40 sm:pb-28" id="top">
      <div
        aria-hidden
        className="hero-wash pointer-events-none absolute inset-x-0 top-0 -z-10 h-160"
      />

      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <h1 className="font-serif text-[2.75rem] leading-[1.05] font-medium text-balance sm:text-6xl">
            Any recipe, any source.
          </h1>
        </Reveal>

        <Reveal delay={90}>
          <p className="text-muted mx-auto mt-6 max-w-lg text-base leading-relaxed text-pretty sm:text-lg">
            A link, video, photo, or plain text. Norish reads it and keeps one clean, structured
            recipe for you and everyone you cook with.
          </p>
        </Reveal>

        <Reveal delay={170}>
          <div className="mt-9 flex items-center justify-center gap-2">
            <Action href="#self-host">Get started</Action>
            <Action external href={links.github} variant="secondary">
              <GitHubIcon className="size-4" />
              GitHub
            </Action>
          </div>
        </Reveal>
      </div>

      <Reveal className="mx-auto mt-16 max-w-3xl sm:mt-20" delay={250}>
        <SourceFlow />
      </Reveal>
    </section>
  );
}
