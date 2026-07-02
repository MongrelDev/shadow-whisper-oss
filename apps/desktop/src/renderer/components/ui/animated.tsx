import * as React from "react";
import { motion, AnimatePresence, type Transition, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

// Spring configuration for smooth, natural animations
const springTransition: Transition = {
  type: "spring",
  damping: 25,
  stiffness: 300,
};

// Animation variants for consistent use across components
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideInVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const overlayVariants: Variants = {
  hidden: { opacity: 0, y: -10, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.98 },
};

// FadeIn component - basic opacity animation
interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

export function FadeIn({ children, className, duration = 0.2 }: FadeInProps): React.ReactElement {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={fadeInVariants}
      transition={{ duration }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// SlideIn component - slide + fade for entrance animations
interface SlideInProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down";
}

export function SlideIn({
  children,
  className,
  direction = "up",
}: SlideInProps): React.ReactElement {
  const yOffset = direction === "up" ? 20 : -20;

  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: yOffset }}
      transition={springTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// AnimatedOverlay component - wrapper with AnimatePresence for overlay mount/unmount
interface AnimatedOverlayProps {
  children: React.ReactNode;
  isVisible: boolean;
  className?: string;
  onExitComplete?: () => void;
}

export function AnimatedOverlay({
  children,
  isVisible,
  className,
  onExitComplete,
}: AnimatedOverlayProps): React.ReactElement {
  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {isVisible && (
        <motion.div
          key="overlay"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={overlayVariants}
          transition={springTransition}
          className={cn("overlay-container", className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Re-export AnimatePresence for direct use
export { AnimatePresence, motion, type Transition, type Variants };

// Export spring transition for custom animations
export { springTransition };
