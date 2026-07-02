import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";
import { cn } from "@/lib/utils";

type Column = {
  label: string;
  name: string;
  highlight?: boolean;
};

type Row = {
  criterion: string;
  cells: readonly [React.ReactNode, React.ReactNode, React.ReactNode];
};

export function WhySection({ locale }: { locale: Locale }): React.ReactElement {
  const columns: Column[] = [
    {
      label: m.home_why_column_1_label({}, { locale }),
      name: m.home_why_column_1_name({}, { locale }),
    },
    {
      label: m.home_why_column_2_label({}, { locale }),
      name: m.home_why_column_2_name({}, { locale }),
      highlight: true,
    },
    {
      label: m.home_why_column_3_label({}, { locale }),
      name: m.home_why_column_3_name({}, { locale }),
    },
  ];

  const rows: Row[] = [
    {
      criterion: m.home_why_row_price({}, { locale }),
      cells: [
        m.home_why_row_price_cell_1({}, { locale }),
        m.home_why_row_price_cell_2({}, { locale }),
        m.home_why_row_price_cell_3({}, { locale }),
      ],
    },
    {
      criterion: m.home_why_row_setup({}, { locale }),
      cells: [
        m.home_why_row_setup_cell_1({}, { locale }),
        m.home_why_row_setup_cell_2({}, { locale }),
        m.home_why_row_setup_cell_3({}, { locale }),
      ],
    },
    {
      criterion: m.home_why_row_output_quality({}, { locale }),
      cells: [
        m.home_why_row_output_quality_cell_1({}, { locale }),
        m.home_why_row_output_quality_cell_2({}, { locale }),
        m.home_why_row_output_quality_cell_3({}, { locale }),
      ],
    },
    {
      criterion: m.home_why_row_maintenance({}, { locale }),
      cells: [
        m.home_why_row_maintenance_cell_1({}, { locale }),
        m.home_why_row_maintenance_cell_2({}, { locale }),
        m.home_why_row_maintenance_cell_3({}, { locale }),
      ],
    },
  ];

  const audiences = [
    {
      tag: m.home_why_audience_1_tag({}, { locale }),
      title: m.home_why_audience_1_title({}, { locale }),
      description: m.home_why_audience_1_description({}, { locale }),
    },
    {
      tag: m.home_why_audience_2_tag({}, { locale }),
      title: m.home_why_audience_2_title({}, { locale }),
      description: m.home_why_audience_2_description({}, { locale }),
    },
    {
      tag: m.home_why_audience_3_tag({}, { locale }),
      title: m.home_why_audience_3_title({}, { locale }),
      description: m.home_why_audience_3_description({}, { locale }),
    },
    {
      tag: m.home_why_audience_4_tag({}, { locale }),
      title: m.home_why_audience_4_title({}, { locale }),
      description: m.home_why_audience_4_description({}, { locale }),
    },
  ];

  return (
    <section
      id="why"
      className="border-y border-border/60 bg-[color-mix(in_oklch,var(--color-muted)_60%,var(--color-background))]"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
        <WhyHeader locale={locale} />
        <ComparisonTable columns={columns} rows={rows} locale={locale} />
        <ComparisonCards columns={columns} rows={rows} />
        <AudienceGrid audiences={audiences} />
      </div>
    </section>
  );
}

function WhyHeader({ locale }: { locale: Locale }): React.ReactElement {
  return (
    <div className="grid items-end gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <div>
        <p className="text-xs font-medium text-muted-foreground">
          {m.home_why_kicker({}, { locale })}
        </p>
        <h2 className="mt-4 text-[clamp(2rem,4.2vw,3rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-balance">
          {m.home_why_title_prefix({}, { locale })}{" "}
          <span className="text-muted-foreground/85">
            {m.home_why_title_suffix({}, { locale })}
          </span>
        </h2>
      </div>
      <p className="max-w-[52ch] text-base leading-[1.75] text-muted-foreground">
        {m.home_why_description({}, { locale })}
      </p>
    </div>
  );
}

function ComparisonTable({
  columns,
  rows,
  locale,
}: {
  columns: Column[];
  rows: Row[];
  locale: Locale;
}): React.ReactElement {
  return (
    <div className="mt-14 hidden overflow-hidden rounded-xl border border-border bg-background md:block">
      <table
        className="w-full"
        role="table"
        aria-label={m.home_why_comparison_aria({}, { locale })}
      >
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="w-[23%] border-r border-border bg-[color-mix(in_oklch,var(--color-muted)_70%,var(--color-background))] px-5 py-5 text-left font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-normal"
            >
              {m.home_why_criterion({}, { locale })}
            </th>
            {columns.map((col, i) => (
              <th
                key={col.name}
                scope="col"
                className={`px-5 py-5 text-left font-normal ${i < columns.length - 1 ? "border-r border-border" : ""} ${col.highlight ? "bg-[color-mix(in_oklch,var(--color-primary)_4%,var(--color-background))]" : ""}`}
              >
                <span
                  className={`font-mono text-[11px] uppercase tracking-[0.22em] ${col.highlight ? "text-primary" : "text-muted-foreground"}`}
                >
                  {col.label}
                </span>
                <div
                  className={`mt-1 text-[17px] font-semibold tracking-[-0.01em] ${col.highlight ? "text-primary" : "text-foreground"}`}
                >
                  {col.name}
                </div>
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
                className="w-[23%] border-r border-border bg-[color-mix(in_oklch,var(--color-muted)_70%,var(--color-background))] px-5 py-5 text-left font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-normal align-middle"
              >
                {row.criterion}
              </th>
              {row.cells.map((cell, ci) => {
                const col = columns[ci];
                const last = ci === row.cells.length - 1;
                const highlight = col?.highlight ?? false;
                return (
                  <td
                    key={ci}
                    className={`px-5 py-5 text-[14px] leading-[1.65] ${last ? "" : "border-r border-border"} ${highlight ? "bg-[color-mix(in_oklch,var(--color-primary)_4%,var(--color-background))] text-foreground" : "text-muted-foreground"} align-top`}
                  >
                    {cell}
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

function ComparisonCards({
  columns,
  rows,
}: {
  columns: Column[];
  rows: Row[];
}): React.ReactElement {
  return (
    <div className="mt-10 grid gap-4 md:hidden">
      {columns.map((col, idx) => (
        <article
          key={col.name}
          className={`rounded-xl border p-5 ${
            col.highlight
              ? "border-[color-mix(in_oklch,var(--color-primary)_35%,var(--color-border))] bg-[color-mix(in_oklch,var(--color-primary)_4%,var(--color-background))]"
              : "border-border bg-background"
          }`}
        >
          <p
            className={`font-mono text-[10px] uppercase tracking-[0.22em] ${col.highlight ? "text-primary" : "text-muted-foreground"}`}
          >
            {col.label}
          </p>
          <h3
            className={`mt-2 text-[17px] font-semibold tracking-[-0.01em] ${col.highlight ? "text-primary" : "text-foreground"}`}
          >
            {col.name}
          </h3>
          <dl className="mt-4 grid gap-3.5">
            {rows.map((row) => (
              <div key={row.criterion}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {row.criterion}
                </dt>
                <dd
                  className={`mt-1 text-[14px] leading-[1.6] ${col.highlight ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {row.cells[idx]}
                </dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}

function AudienceGrid({
  audiences,
}: {
  audiences: Array<{ tag: string; title: string; description: string }>;
}): React.ReactElement {
  return (
    <div id="who" className="mt-16 sm:mt-20 lg:mt-20">
      <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {audiences.map((aud, i) => (
          <article
            key={aud.tag}
            className={cn(
              "bg-background p-5 pb-6",
              i === 0 && "bg-[color-mix(in_oklch,var(--color-primary)_3%,var(--color-background))]"
            )}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
              {aud.tag}
            </p>
            <h4 className="mt-2.5 text-lg font-medium tracking-[-0.01em]">{aud.title}</h4>
            <p className="mt-2.5 text-[13.5px] leading-[1.7] text-muted-foreground">
              {aud.description}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
