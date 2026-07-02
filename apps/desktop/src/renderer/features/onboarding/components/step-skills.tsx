import { motion } from "motion/react";
import { m } from "~/paraglide/messages";
import { SceneSkill } from "./scenes/scene-skill";

export function StepSkills(): React.ReactElement {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
        {m.onboarding_skills_eyebrow()}
      </p>
      <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-foreground">
        {m.onboarding_skills_title()}
      </h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground max-w-[52ch]">
        {m.onboarding_skills_body()}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.25 }}
        className="mt-6 overflow-hidden rounded-xl border border-border"
      >
        <SceneSkill />
      </motion.div>

      <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground/70">
        {m.onboarding_skills_hint()}
      </p>
    </div>
  );
}
