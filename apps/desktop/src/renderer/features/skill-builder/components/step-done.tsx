import { Check } from "lucide-react";
import { motion } from "motion/react";
import { m } from "~/paraglide/messages";

interface StepDoneProps {
  skillName: string;
}

export function StepDone({ skillName }: StepDoneProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center text-center py-6">
      <motion.div
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--primary) 30%, transparent), transparent 70%)",
        }}
      >
        <Check className="h-9 w-9 text-primary" strokeWidth={2.5} />
      </motion.div>

      <h2 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
        {m.skill_builder_done_title()}
      </h2>
      <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
        {m.skill_builder_done_subtitle({ name: skillName })}
      </p>
    </div>
  );
}
