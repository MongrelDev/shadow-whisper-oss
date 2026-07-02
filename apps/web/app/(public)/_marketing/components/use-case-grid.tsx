import { cn } from "@/lib/utils";

import type { UseCase } from "../lib/types";

export function UseCaseGrid({ items }: { items: readonly UseCase[] }): React.ReactElement {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <article
          key={item.tag}
          className={cn(
            "bg-background p-5 pb-6",
            i === 0 && "bg-[color-mix(in_oklch,var(--color-primary)_3%,var(--color-background))]"
          )}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
            {item.tag}
          </p>
          <h3 className="mt-2.5 text-lg font-medium tracking-[-0.01em]">{item.title}</h3>
          <p className="mt-2.5 text-sm leading-[1.7] text-muted-foreground">{item.description}</p>
        </article>
      ))}
    </div>
  );
}
