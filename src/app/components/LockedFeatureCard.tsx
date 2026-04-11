import type { ReactNode } from "react";
import { Lock } from "lucide-react";

type LockedFeatureCardProps = {
  title: string;
  description: string;
  planLabel: "ExPlus" | "ExPro";
  preview?: ReactNode;
};

export function LockedFeatureCard({
  title,
  description,
  planLabel,
  preview,
}: LockedFeatureCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-border/70 bg-card/90 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.28)]">
      {preview && <div className="pointer-events-none opacity-55 blur-[1.5px]">{preview}</div>}
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/84 to-background/94" />
      <div className="relative space-y-2 px-5 py-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/65 bg-muted/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          Available in {planLabel}
        </div>
        <div>
          <h3 className="text-base font-semibold tracking-[-0.02em]">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
