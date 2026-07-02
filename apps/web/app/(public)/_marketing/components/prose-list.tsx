export function ProseList({
  items,
  variant,
}: {
  items: readonly string[];
  variant?: "numbered";
}): React.ReactElement {
  if (variant === "numbered") {
    return (
      <ul className="grid sm:grid-cols-2">
        {items.map((item, i) => (
          <li key={item} className="border-t border-border/50 pb-10 pt-6 sm:px-2">
            <span
              aria-hidden="true"
              className="block select-none font-thin leading-none tracking-tight text-primary/25 tabular-nums"
              style={{ fontSize: "clamp(3.5rem, 8vw, 5.5rem)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="mt-5 text-[0.9375rem] leading-[1.7] text-foreground/75">{item}</p>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-3 rounded-xl border border-border bg-background p-5 text-sm leading-[1.65] text-muted-foreground"
        >
          <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
