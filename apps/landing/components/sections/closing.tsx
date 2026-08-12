import { links } from "@/lib/css-tokens";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";

import { Action } from "../action";
import { Reveal } from "../reveal";
import { SteamedN } from "../steamed-n";

export function Closing() {
  return (
    <section className="border-border border-t px-5 py-28 sm:px-8 sm:py-36">
      <Reveal className="mx-auto max-w-xl text-center">
        {/* The one place the mark stands alone: dinner is on. */}
        <SteamedN className="text-accent mx-auto h-16 w-auto" />
        <h2 className="mt-5 font-serif text-4xl leading-tight font-medium text-balance sm:text-5xl">
          Bring your recipes home.
        </h2>
        <p className="text-muted mx-auto mt-5 max-w-md text-pretty">
          A few minutes to set up, and everyone you cook with has one quiet place to cook from.
        </p>
        <div className="mt-9 flex items-center justify-center gap-2">
          <Action href="#self-host">Get started</Action>
          <Action external href={links.docs} variant="secondary">
            Documentation
            <ArrowUpRightIcon className="size-3.5" />
          </Action>
        </div>
      </Reveal>
    </section>
  );
}
