import { m } from "~/paraglide/messages";

export function SkillsEmptyState(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <p className="text-sm font-medium text-foreground">{m.skills_empty_title()}</p>
      <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
        {m.skills_empty_subtitle()}
      </p>
    </div>
  );
}
