import { m } from "~/paraglide/messages";
import { SkillsListContainer } from "../containers/skills-list-container";

function SkillsPageHeader(): React.ReactElement {
  return (
    <header>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{m.skills_title()}</h1>
      <p className="mt-2 max-w-[52ch] text-sm leading-[1.7] text-muted-foreground">
        {m.skills_subtitle()}
      </p>
    </header>
  );
}

export function SkillsListPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <SkillsPageHeader />
      <SkillsListContainer />
    </div>
  );
}
