import { motion } from "motion/react";
import { Wallet } from "lucide-react";

type WelcomeAnimationProps = {
  onComplete: () => void;
};

export function WelcomeAnimation({ onComplete }: WelcomeAnimationProps) {
  // Auto-complete after animation duration
  setTimeout(() => {
    onComplete();
  }, 1500);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
            className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-6"
          >
            <Wallet className="w-12 h-12 text-primary-foreground" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl text-center whitespace-nowrap"
            style={{ fontSize: 'clamp(1.5rem, 8vw, 2.25rem)' }}
          >
            Welcome to Expy
          </motion.h1>
        </motion.div>
      </div>
    </div>
  );
}
