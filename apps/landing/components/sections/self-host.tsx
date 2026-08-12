import { links } from "@/lib/css-tokens";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";

import { Action } from "../action";
import { DotList } from "../dot-list";
import { GitHubIcon } from "../icons";
import { Reveal } from "../reveal";
import { SelfHostCompose } from "./self-host-compose";

export function SelfHost() {
  return (
    <section
      className="border-border scroll-mt-16 border-t px-5 py-24 sm:px-8 sm:py-32"
      id="self-host"
    >
      <div className="mx-auto grid max-w-5xl items-start gap-14 lg:grid-cols-2 lg:gap-16">
        <Reveal className="min-w-0">
          <h2 className="font-serif text-3xl leading-tight font-medium text-balance sm:text-4xl">
            Your recipes, your server
          </h2>
          <p className="text-muted mt-4 text-pretty">
            Norish is free and fully open source under the AGPL-3.0 license. Run it on your own
            hardware with Docker: no subscription, no account with us, nothing to migrate away from
            later.
          </p>

          <DotList
            className="mt-6 text-sm"
            items={["AGPL-3.0", "Self-hosted", "One Docker command"]}
          />

          <div className="mt-8 flex items-center gap-2">
            <Action external href={links.github}>
              <GitHubIcon className="size-4" />
              View on GitHub
            </Action>
            <Action external href={links.selfHost} variant="secondary">
              Read the docs
              <ArrowUpRightIcon className="size-3.5" />
            </Action>
          </div>
        </Reveal>

        <SelfHostCompose />
      </div>
    </section>
  );
}
