import { cn } from "@/lib/utils";

import type { SectionMeta } from "../lib/types";

function SectionHeader({ kicker, title, description }: SectionMeta): React.ReactElement {
  return (
    <div className="max-w-[60ch]">
      {kicker ? <p className="text-xs font-medium text-muted-foreground">{kicker}</p> : null}
      {title ? (
        <h2 className="mt-4 text-[clamp(1.875rem,4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-balance">
          {title}
        </h2>
      ) : null}
      {description ? (
        <p className="mt-4 text-base leading-[1.75] text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function MarketingSection({
  id,
  kicker,
  title,
  description,
  children,
  muted,
}: SectionMeta & {
  id?: string;
  children: React.ReactNode;
  muted?: boolean;
}): React.ReactElement {
  const hasHeader = Boolean(kicker || title || description);

  return (
    <section
      id={id}
      className={cn(
        "border-b border-border/60",
        muted && "bg-[color-mix(in_oklch,var(--color-muted)_60%,var(--color-background))]"
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-8 lg:px-12 lg:py-24">
        {hasHeader ? (
          <SectionHeader kicker={kicker} title={title} description={description} />
        ) : null}
        <div className={cn(hasHeader && "mt-12")}>{children}</div>
      </div>
    </section>
  );
}
