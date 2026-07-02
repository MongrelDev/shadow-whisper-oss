import { Check, Minus, X } from "lucide-react";

import { cn } from "@/lib/utils";

import type { Comparison } from "../lib/types";

const POSITIVE = /^(yes|sim)\b/i;
const NEGATIVE = new Set(["no", "não"]);
const NEUTRAL = new Set(["partial", "parcial", "maybe", "depende", "n/a"]);

type Verdict = "positive" | "negative" | "neutral" | null;

function classify(value: string): Verdict {
  const token = value.trim().toLowerCase();
  if (POSITIVE.test(token)) return "positive";
  if (NEGATIVE.has(token)) return "negative";
  if (NEUTRAL.has(token)) return "neutral";
  return null;
}

function PositiveCell({
  value,
  highlight,
}: {
  value: string;
  highlight?: boolean;
}): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Check
        className={cn("size-4 shrink-0", highlight ? "text-primary" : "text-foreground/55")}
        aria-hidden="true"
      />
      <span className={highlight ? "font-medium text-foreground" : undefined}>{value}</span>
    </span>
  );
}

function MutedCell({ value, Icon }: { value: string; Icon: typeof Check }): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <Icon className="size-4 shrink-0 opacity-45" aria-hidden="true" />
      <span>{value}</span>
    </span>
  );
}

/**
 * Renders a cell with a semantic marker when its text is a yes/no/partial
 * verdict, so the winning column reads at a glance. Prices and free-form
 * values pass through untouched.
 */
function CellValue({
  value,
  highlight,
}: {
  value: React.ReactNode;
  highlight?: boolean;
}): React.ReactElement {
  if (typeof value !== "string") return <>{value}</>;

  const verdict = classify(value);
  if (verdict === "positive") return <PositiveCell value={value} highlight={highlight} />;
  if (verdict === "negative") return <MutedCell value={value} Icon={X} />;
  if (verdict === "neutral") return <MutedCell value={value} Icon={Minus} />;
  return <>{value}</>;
}

function ComparisonHeadCell({
  label,
  name,
  highlight,
  withBorder,
}: {
  label: string;
  name: string;
  highlight?: boolean;
  withBorder: boolean;
}): React.ReactElement {
  return (
    <th
      scope="col"
      className={cn(
        "px-5 py-5 text-left font-normal",
        withBorder && "border-r border-border",
        highlight
          ? "border-t-2 border-t-primary bg-[color-mix(in_oklch,var(--color-primary)_9%,var(--color-background))]"
          : "border-t-2 border-t-transparent"
      )}
    >
      <span
        className={cn(
          "font-mono text-[11px] uppercase tracking-[0.22em]",
          highlight ? "text-primary" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
      <div
        className={cn(
          "mt-1 font-semibold tracking-[-0.01em]",
          highlight ? "text-[19px] text-primary" : "text-[17px] text-foreground"
        )}
      >
        {name}
      </div>
    </th>
  );
}

function DesktopTable({
  ariaLabel,
  criterionLabel,
  columns,
  rows,
}: Comparison): React.ReactElement {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-border bg-background sm:block">
      <table className="w-full" aria-label={ariaLabel}>
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="border-r border-t-2 border-t-transparent border-border bg-[color-mix(in_oklch,var(--color-muted)_70%,var(--color-background))] px-5 py-5 text-left font-mono text-[11px] font-normal uppercase tracking-[0.22em] text-muted-foreground"
            >
              {criterionLabel}
            </th>
            {columns.map((col, i) => (
              <ComparisonHeadCell
                key={col.name}
                label={col.label}
                name={col.name}
                highlight={col.highlight}
                withBorder={i < columns.length - 1}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={row.criterion}
              className={ri < rows.length - 1 ? "border-b border-border" : ""}
            >
              <th
                scope="row"
                className="border-r border-border bg-[color-mix(in_oklch,var(--color-muted)_70%,var(--color-background))] px-5 py-5 text-left align-middle font-mono text-[11px] font-normal uppercase tracking-[0.22em] text-muted-foreground"
              >
                {row.criterion}
              </th>
              {row.cells.map((cell, ci) => {
                const col = columns[ci];
                const last = ci === row.cells.length - 1;
                return (
                  <td
                    key={ci}
                    className={cn(
                      "px-5 py-5 align-top text-sm leading-[1.65]",
                      !last && "border-r border-border",
                      col?.highlight
                        ? "bg-[color-mix(in_oklch,var(--color-primary)_6%,var(--color-background))] text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <CellValue value={cell} highlight={col?.highlight} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileTable({ ariaLabel, criterionLabel, columns, rows }: Comparison): React.ReactElement {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-background sm:hidden">
      <table className="w-full table-fixed" aria-label={ariaLabel}>
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="w-[28%] border-r border-t-2 border-t-transparent border-border bg-[color-mix(in_oklch,var(--color-muted)_70%,var(--color-background))] px-2 py-2.5 text-left font-mono text-[9.5px] font-normal uppercase leading-[1.3] tracking-[0.14em] text-muted-foreground"
            >
              {criterionLabel}
            </th>
            {columns.map((col, i) => (
              <th
                key={col.name}
                scope="col"
                className={cn(
                  "px-2 py-2.5 text-left font-normal",
                  i < columns.length - 1 && "border-r border-border",
                  col.highlight
                    ? "border-t-2 border-t-primary bg-[color-mix(in_oklch,var(--color-primary)_9%,var(--color-background))]"
                    : "border-t-2 border-t-transparent"
                )}
              >
                <span
                  className={cn(
                    "block font-mono text-[9.5px] uppercase leading-[1.3] tracking-[0.14em]",
                    col.highlight ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {col.label}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block font-semibold",
                    col.highlight ? "text-[13px] text-primary" : "text-[12px] text-foreground"
                  )}
                >
                  {col.name}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={row.criterion}
              className={ri < rows.length - 1 ? "border-b border-border" : ""}
            >
              <th
                scope="row"
                className="border-r border-border bg-[color-mix(in_oklch,var(--color-muted)_70%,var(--color-background))] px-2 py-2.5 text-left align-middle font-mono text-[9.5px] font-normal uppercase leading-[1.3] tracking-[0.14em] text-muted-foreground"
              >
                {row.criterion}
              </th>
              {row.cells.map((cell, ci) => {
                const col = columns[ci];
                const last = ci === row.cells.length - 1;
                return (
                  <td
                    key={ci}
                    className={cn(
                      "px-2 py-2.5 align-top text-xs leading-[1.5]",
                      !last && "border-r border-border",
                      col?.highlight
                        ? "bg-[color-mix(in_oklch,var(--color-primary)_6%,var(--color-background))] text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <CellValue value={cell} highlight={col?.highlight} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ComparisonTable(props: Comparison): React.ReactElement {
  return (
    <>
      <DesktopTable {...props} />
      <MobileTable {...props} />
    </>
  );
}
