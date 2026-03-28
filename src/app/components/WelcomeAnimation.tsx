import { useEffect } from "react";
import { motion } from "motion/react";
import { Wallet } from "lucide-react";

type WelcomeAnimationProps = {
  onComplete: () => void;
};

export function WelcomeAnimation({ onComplete }: WelcomeAnimationProps) {
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
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary shadow-[0_22px_44px_-24px_rgba(3,2,19,0.95)]"
          >
            <Wallet className="w-12 h-12 text-primary-foreground" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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
