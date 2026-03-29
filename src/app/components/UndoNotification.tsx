import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "./ui/button";
import { Undo2 } from "lucide-react";

type UndoNotificationProps = {
  message: string;
  onUndo: () => void;
  onComplete: () => void;
  duration?: number;
};

export function UndoNotification({ 
  message, 
  onUndo, 
  onComplete, 
  duration = 3000 
}: UndoNotificationProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onComplete();
    }, duration);

    return () => window.clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { y: 72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { y: 72, opacity: 0 }}
      transition={{ duration: reduceMotion ? 0.12 : 0.2 }}
      className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md"
    >
      <div className="bg-background border rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-4">
          <p className="text-sm flex-1">{message}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={onUndo}
            className="flex items-center gap-2 shrink-0"
          >
            <Undo2 className="w-4 h-4" />
            Undo
          </Button>
        </div>
        <div className="h-1 bg-muted">
          <div
            className="undo-notification-progress h-full bg-primary"
            style={{ animationDuration: `${duration}ms` }}
          />
        </div>
      </div>
    </motion.div>
  );
}
