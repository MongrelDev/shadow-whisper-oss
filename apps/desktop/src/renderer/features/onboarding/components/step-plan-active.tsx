import { motion } from "motion/react";
import { Crown, Mic, Wand2, BookOpen, Check } from "lucide-react";
import { m } from "~/paraglide/messages";

interface StepPlanActiveProps {
  onNext: () => void;
}

function CrownGlow(): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotate: -20 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ delay: 0.15, duration: 0.5, type: "spring", stiffness: 160, damping: 14 }}
      className="relative"
    >
      <motion.div
        className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 0.6, 0.3], scale: [0.6, 1.3, 1.1] }}
        transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
      />

      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20"
      >
        <Crown className="h-8 w-8 text-primary" strokeWidth={1.5} />
      </motion.div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.3, 1] }}
        transition={{ delay: 0.55, duration: 0.35, type: "spring", stiffness: 300, damping: 12 }}
        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-sm shadow-primary/30"
      >
        <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
      </motion.div>
    </motion.div>
  );
}

function PerkRow({
  icon: Icon,
  label,
  index,
}: {
  icon: React.ElementType;
  label: string;
  index: number;
}): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: 0.4 + index * 0.1,
        duration: 0.3,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5"
    >
      <motion.div
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{
          delay: 0.55 + index * 0.1,
          duration: 0.25,
          type: "spring",
          stiffness: 260,
          damping: 16,
        }}
        className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10"
      >
        <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
      </motion.div>
      <span className="text-sm text-foreground flex-1">{label}</span>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          delay: 0.7 + index * 0.1,
          duration: 0.2,
          type: "spring",
          stiffness: 300,
          damping: 14,
        }}
      >
        <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
      </motion.div>
    </motion.div>
  );
}

export function StepPlanActive({ onNext }: StepPlanActiveProps): React.ReactElement {
  const proPerks = [
    { icon: Mic, label: m.onboarding_plan_active_perk_transcriptions() },
    { icon: Wand2, label: m.onboarding_plan_active_perk_transforms() },
    { icon: BookOpen, label: m.onboarding_plan_active_perk_dictionary() },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          {m.onboarding_plan_active_title()}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{m.onboarding_plan_active_subtitle()}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.35, type: "spring", stiffness: 180, damping: 18 }}
        className="relative flex flex-col items-center gap-4 rounded-xl border border-primary/20 bg-primary/[0.04] p-8 overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.06] to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ delay: 0.6, duration: 1.2, ease: "easeInOut" }}
        />
        <CrownGlow />
        <span className="relative text-sm font-semibold text-foreground">
          {m.onboarding_plan_active_badge()}
        </span>
      </motion.div>

      <div className="space-y-2">
        {proPerks.map((perk, i) => (
          <PerkRow key={perk.label} icon={perk.icon} label={perk.label} index={i} />
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.3 }}
        onClick={onNext}
        className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {m.onboarding_plan_active_cta()}
      </motion.button>
    </div>
  );
}
