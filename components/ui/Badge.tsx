import type { ReactNode } from "react";

type BadgeTone = "brass" | "charcoal" | "clay";

const toneClasses: Record<BadgeTone, string> = {
  brass: "bg-brass/15 text-charcoal",
  charcoal: "bg-charcoal text-cream",
  clay: "bg-sand text-ink",
};

export function Badge({ children, tone = "brass" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
