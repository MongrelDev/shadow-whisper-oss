import { m } from "~/paraglide/messages";

export function EmptyState(): React.ReactElement {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm font-medium text-foreground">{m.skills_empty_no_results_title()}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
        {m.skills_empty_no_results_subtitle()}
      </p>
    </div>
  );
}
