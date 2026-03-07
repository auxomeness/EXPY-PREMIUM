import { useEffect, useState } from "react";
import { motion } from "motion/react";
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
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 50));
        if (newProgress <= 0) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
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
          <motion.div
            className="h-full bg-primary"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.05, ease: "linear" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
