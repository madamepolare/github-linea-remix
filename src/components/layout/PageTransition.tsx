import { ReactNode } from "react";
import { motion, Transition, Variants } from "framer-motion";

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  enter: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -8,
  },
};

const pageTransition: Transition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
};

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}
