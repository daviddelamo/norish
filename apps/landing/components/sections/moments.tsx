import { Reveal } from "../reveal";

/** Tint classes are written out in full so Tailwind's scanner can see them. */
const moments = [
  {
    title: "Import",
    rule: "border-tint-site/45",
    body: "Give it a link, a video, a photo or the text itself. What comes back is structured, searchable and yours.",
  },
  {
    title: "Plan",
    rule: "border-tint-text/45",
    body: "Drop meals onto a calendar the whole household shares, and let the grocery list build itself from what you planned.",
  },
  {
    title: "Cook",
    rule: "border-tint-photo/50",
    body: "Open cooking mode for big, glanceable steps, timers and scaled quantities, on a screen that stays awake.",
  },
];

export function Moments() {
  // The three rules stand in for a section divider: one broken line rather
  // than a continuous one, which keeps the band from reading as a banner.
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-3 sm:gap-12">
        {moments.map(({ title, body, rule }, index) => (
          <Reveal key={title} className={`border-t-2 pt-6 ${rule}`} delay={index * 90}>
            <h3 className="font-serif text-xl font-medium">{title}</h3>
            <p className="text-muted mt-2.5 text-sm leading-relaxed text-pretty">{body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
