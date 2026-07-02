import { m } from "~/paraglide/messages";
import { SceneSkill } from "../scenes/scene-skill";

export function SkillsStep() {
  return (
    <div className="relative flex flex-col gap-7 px-5 py-8">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-2 top-0 select-none font-mono text-[128px] font-bold leading-none text-foreground/[0.03]"
      >
        04
      </span>

      <div>
        <h2 className="text-3xl font-bold tracking-tight">{m.onboarding_skills_title()}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {m.onboarding_skills_body()}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {m.onboarding_scene_skill_heading()}
        </p>
        <div className="overflow-hidden rounded-xl border border-border/60">
          <SceneSkill />
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground/50">
          {m.onboarding_scene_skill_description()}
        </p>
      </div>
    </div>
  );
}
