import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "./ui/utils";

type SlideToConfirmProps = {
  label: string;
  confirmingLabel?: string;
  disabled?: boolean;
  onConfirm: () => Promise<void> | void;
};

export function SlideToConfirm({
  label,
  confirmingLabel = "Confirming...",
  disabled = false,
  onConfirm,
}: SlideToConfirmProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  const isDraggingRef = useRef(false);
  const [position, setPosition] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const dragOffsetRef = useRef(0);

  useEffect(() => {
    if (disabled || isPending) {
      positionRef.current = 0;
      setPosition(0);
    }
  }, [disabled, isPending]);

  const maxPosition = () => {
    const track = trackRef.current;
    if (!track) return 0;
    return Math.max(track.clientWidth - 52, 0);
  };

  const updatePosition = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const next = Math.min(Math.max(clientX - rect.left - dragOffsetRef.current, 0), maxPosition());
    positionRef.current = next;
    setPosition(next);
  };

  const finalize = async () => {
    const threshold = maxPosition() * 0.8;
    isDraggingRef.current = false;
    setDragging(false);

    if (positionRef.current < threshold) {
      positionRef.current = 0;
      setPosition(0);
      return;
    }

    const endPosition = maxPosition();
    positionRef.current = endPosition;
    setPosition(endPosition);
    setIsPending(true);

    try {
      await onConfirm();
    } finally {
      positionRef.current = 0;
      setPosition(0);
      setIsPending(false);
    }
  };

  const cancelDrag = () => {
    pointerIdRef.current = null;
    isDraggingRef.current = false;
    setDragging(false);
    positionRef.current = 0;
    setPosition(0);
  };

  return (
    <div
      ref={trackRef}
      className={cn(
        "relative h-14 touch-none overflow-hidden rounded-full border border-border/70 bg-card px-2 shadow-[0_18px_32px_-24px_rgba(15,23,42,0.18)] dark:border-white/8 dark:bg-card/92 dark:shadow-[0_18px_32px_-24px_rgba(0,0,0,0.45)]",
        disabled && "opacity-60",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 rounded-full bg-foreground dark:bg-foreground",
          !dragging && "transition-all duration-200",
        )}
        style={{ width: `${position + 52}px` }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-14 text-center text-sm font-semibold tracking-[-0.01em] text-foreground/88">
        {isPending ? confirmingLabel : label}
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden rounded-full"
        style={{ width: `${position + 52}px` }}
      >
        <div className="flex h-full w-full items-center justify-center px-14 text-center text-sm font-semibold tracking-[-0.01em] text-background">
          {isPending ? confirmingLabel : label}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-1 left-1 rounded-full bg-black/6 dark:bg-white/6"
        style={{ width: `${Math.max(position, 0)}px` }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-14 text-center text-sm font-semibold tracking-[-0.01em] opacity-0">
        {isPending ? confirmingLabel : label}
      </div>
      <button
        type="button"
        disabled={disabled || isPending}
        onPointerDown={(event) => {
          const buttonRect = event.currentTarget.getBoundingClientRect();
          pointerIdRef.current = event.pointerId;
          dragOffsetRef.current = event.clientX - buttonRect.left;
          isDraggingRef.current = true;
          setDragging(true);
          event.currentTarget.setPointerCapture(event.pointerId);
          updatePosition(event.clientX);
        }}
        onPointerMove={(event) => {
          if (!isDraggingRef.current || pointerIdRef.current !== event.pointerId) {
            return;
          }

          updatePosition(event.clientX);
        }}
        onPointerUp={(event) => {
          if (pointerIdRef.current === event.pointerId) {
            pointerIdRef.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
            void finalize();
          }
        }}
        onPointerCancel={(event) => {
          if (pointerIdRef.current === event.pointerId) {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
            cancelDrag();
          }
        }}
        className={cn(
          "absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-foreground text-background shadow-[0_16px_26px_-18px_rgba(3,2,19,0.42)] active:scale-[0.98] dark:bg-background dark:text-foreground",
          !dragging && "transition-transform duration-200",
        )}
        style={{ transform: `translate(${position}px, -50%)` }}
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
