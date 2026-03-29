import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Wallet } from "lucide-react";

type WelcomeAnimationProps = {
  onComplete: () => void;
};

export function WelcomeAnimation({ onComplete }: WelcomeAnimationProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onComplete();
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="mobile-shell mobile-canvas items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm">
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.18 : 0.28, ease: "easeOut" }}
          className="flex flex-col items-center justify-center"
        >
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { scale: 0.88, opacity: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: reduceMotion ? 0.18 : 0.24, ease: "easeOut" }}
            className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary shadow-[0_18px_34px_-22px_rgba(3,2,19,0.82)]"
          >
            <Wallet className="w-12 h-12 text-primary-foreground" />
          </motion.div>
          <motion.h1
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0.04 : 0.1, duration: reduceMotion ? 0.16 : 0.2 }}
            className="text-center whitespace-nowrap text-4xl font-semibold tracking-[-0.04em]"
            style={{ fontSize: 'clamp(1.5rem, 8vw, 2.25rem)' }}
          >
            Welcome to Expy
          </motion.h1>
        </motion.div>
      </div>
    </div>
  );
}
