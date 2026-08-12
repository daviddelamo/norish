import { asset } from "@/lib/assets";
import {
  ArrowsRightLeftIcon,
  ArrowTopRightOnSquareIcon,
  CakeIcon,
  ClockIcon,
  EllipsisHorizontalIcon,
  MinusIcon,
  PlusIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import { FireIcon } from "@heroicons/react/24/solid";

/** Amount, unit, name — the unit is the part Norish colours. */
const ingredients = [
  { amount: "125", unit: "ml", name: "lauw water" },
  { amount: "1 ½", unit: "teaspoons", name: "kristalsuiker" },
  { amount: "3 ½", unit: "grams", name: "instant gist" },
  { amount: "250", unit: "grams", name: "tarwebloem" },
  { amount: "8", unit: "grams", name: "bakpoeder" },
];

const tags = ["asian", "chinese", "beef", "Snack", "Lunch", "dinner", "high-protein"];

/** A round control, as used by the servings stepper. */
function Control({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-default text-foreground/70 grid size-6 shrink-0 place-items-center rounded-full text-[11px]">
      {children}
    </span>
  );
}

/**
 * The top of a real Norish recipe page, rebuilt in markup: the photo, the
 * header card and the ingredients beneath it, cut off partway with a fade
 * because that is what it is — a slice of a longer page. Everything here
 * mirrors the running app, down to the bold amount, the green unit and the
 * plain ingredient name. The photo itself is cropped straight out of the
 * product screenshots in `assets/screenshots`, owner chip and all.
 */
export function RecipeFragment() {
  const photo = { width: 840, height: 373, loading: "lazy", decoding: "async" } as const;

  return (
    <div className="relative max-h-[33rem] overflow-hidden">
      <div className="space-y-3">
        <div className="overflow-hidden rounded-2xl shadow-[0_30px_70px_-45px_rgb(0_0_0/0.5)]">
          <img
            {...photo}
            alt="Steamed bapao buns with a bowl of dipping sauce"
            className="block w-full dark:hidden"
            src={asset("/screenshots/hero-dish-light.jpg")}
          />
          <img
            {...photo}
            alt="Steamed bapao buns with a bowl of dipping sauce"
            className="hidden w-full dark:block"
            src={asset("/screenshots/hero-dish-dark.jpg")}
          />
        </div>

        <div className="border-border bg-surface rounded-2xl border p-4 shadow-[0_30px_70px_-45px_rgb(0_0_0/0.5)]">
          <div className="flex items-start gap-2">
            <h3 className="text-[15px] leading-snug font-semibold">Broodje bapao met gehakt</h3>
            <ArrowTopRightOnSquareIcon className="text-muted mt-0.5 size-3.5 shrink-0" />
            <span className="bg-default text-muted ml-auto grid size-6 shrink-0 place-items-center rounded-full">
              <EllipsisHorizontalIcon className="size-4" />
            </span>
          </div>

          <p className="text-muted mt-2 text-xs leading-relaxed">
            Zelfgemaakt zijn deze met gehakt gevulde bapao&apos;s het allerlekkerst.
          </p>

          <div className="text-muted mt-3 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <SunIcon className="size-3.5" />
              Lunch
            </span>
            <span className="flex items-center gap-1.5">
              <CakeIcon className="size-3.5" />
              Snack
            </span>
          </div>

          <p className="text-muted mt-2 flex items-center gap-1.5 text-xs">
            <ClockIcon className="size-3.5" />
            2:35h
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-default text-foreground/75 rounded-full px-2 py-0.5 text-[11px]"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="bg-accent text-accent-foreground mt-4 flex h-9 items-center justify-center gap-1.5 rounded-full text-sm font-medium">
            <FireIcon className="size-4" />
            Cook
          </p>
        </div>

        <div className="border-border bg-surface rounded-2xl border p-4 shadow-[0_30px_70px_-45px_rgb(0_0_0/0.5)]">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold">Ingredients</h4>
            <div className="flex items-center gap-1.5">
              <Control>½</Control>
              <Control>
                <MinusIcon className="size-3" />
              </Control>
              <span className="text-foreground/70 px-0.5 text-[11px]">8</span>
              <Control>
                <PlusIcon className="size-3" />
              </Control>
              <span className="bg-default text-foreground/70 flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px]">
                <ArrowsRightLeftIcon className="size-3" />
                Us
              </span>
            </div>
          </div>

          <ul className="mt-3 space-y-2.5">
            {ingredients.map(({ amount, unit, name }) => (
              <li key={name} className="flex items-center gap-2.5 text-xs">
                <span className="bg-default size-4 shrink-0 rounded-full" />
                <span className="font-semibold">{amount}</span>
                <span className="text-accent -ml-1.5 font-semibold">{unit}</span>
                <span className="text-foreground/85 -ml-1.5">{name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        aria-hidden
        className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t to-transparent"
      />
    </div>
  );
}
