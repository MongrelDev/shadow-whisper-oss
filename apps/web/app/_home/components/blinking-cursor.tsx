"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export function BlinkingCursor({ className }: { className?: string }): React.ReactElement {
  return (
    <motion.span
      aria-hidden="true"
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 1, times: [0, 0.5, 0.5, 1], repeat: Infinity, ease: "linear" }}
      className={cn(
        "ml-[2px] inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-primary align-middle",
        className
      )}
    />
  );
}
