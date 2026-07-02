import { motion } from "motion/react";

export function Spinner(): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
      className="size-7 flex items-center justify-center"
    >
      <motion.svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      >
        <circle
          cx="7"
          cy="7"
          r="5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="26"
          strokeDashoffset="9"
          strokeLinecap="round"
          opacity={0.7}
        />
      </motion.svg>
    </motion.div>
  );
}
