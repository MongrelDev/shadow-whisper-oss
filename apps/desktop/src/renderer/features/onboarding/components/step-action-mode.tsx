import { motion } from "motion/react";
import { m } from "~/paraglide/messages";
import { ShortcutKeys } from "@/components/ui/shortcut-keys";

interface StepActionModeProps {
  accelerator: string;
}

function FlowStep({ index, text }: { index: string; text: string }): React.ReactElement {
  return (
    <div className="grid grid-cols-[auto_1fr] items-baseline gap-3">
      <span className="font-mono text-[11px] text-primary">{index}</span>
      <span className="text-[13.5px] text-foreground">{text}</span>
    </div>
  );
}

export function StepActionMode({ accelerator }: StepActionModeProps): React.ReactElement {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
        {m.onboarding_action_mode_eyebrow()}
      </p>
      <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-foreground">
        {m.onboarding_action_mode_title()}
      </h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground max-w-[52ch]">
        {m.onboarding_action_mode_body()}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.25 }}
        className="mt-6 grid gap-3 rounded-xl border border-border bg-card p-4"
      >
        <FlowStep index="01" text={m.onboarding_action_mode_step_select()} />
        <FlowStep index="02" text={m.onboarding_action_mode_step_shortcut()} />
        <FlowStep index="03" text={m.onboarding_action_mode_step_speak()} />
        <div className="mt-1 flex items-center gap-2 text-[12px] text-muted-foreground">
          <span>{m.onboarding_action_mode_shortcut_label()}</span>
          <ShortcutKeys accelerator={accelerator} />
        </div>
      </motion.div>

      <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground/70">
        {m.onboarding_action_mode_hint()}
      </p>
    </div>
  );
}
