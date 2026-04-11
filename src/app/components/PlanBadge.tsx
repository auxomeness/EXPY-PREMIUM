import type { UserPlan } from "../App";
import { FilledCrownIcon } from "./PremiumIcons";
import { cn } from "./ui/utils";

type PlanBadgeProps = {
  plan: UserPlan;
  className?: string;
};

const badgeConfig = {
  free: {
    label: "FREE",
    className: "border-border/70 bg-card/88 text-foreground shadow-[0_12px_24px_-18px_rgba(15,23,42,0.16)]",
    iconClassName: "text-slate-500 dark:text-slate-300",
    iconVariant: "plain",
  },
  plus: {
    label: "PLUS",
    className: "border-foreground/10 bg-foreground text-background shadow-[0_12px_24px_-18px_rgba(15,23,42,0.52)]",
    iconClassName: "drop-shadow-[0_0_14px_rgba(251,191,36,0.45)]",
    iconVariant: "gold",
  },
  pro: {
    label: "PRO",
    className: "border-foreground/10 bg-foreground text-background shadow-[0_12px_24px_-18px_rgba(15,23,42,0.52)]",
    iconClassName: "drop-shadow-[0_0_16px_rgba(245,158,11,0.42)]",
    iconVariant: "gold",
  },
} as const;

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const config = badgeConfig[plan];

  return (
    <span
      className={cn(
        "header-stat-card header-stat-card-balanced h-14 w-full min-w-0 max-w-full overflow-hidden px-3 text-[11px] font-semibold uppercase tracking-[0.14em]",
        config.className,
        className,
      )}
    >
      <span className="header-stat-card-group">
        <FilledCrownIcon variant={config.iconVariant} className={cn("h-6 w-6 shrink-0", config.iconClassName)} />
        <span className="truncate text-center">{config.label}</span>
      </span>
    </span>
  );
}
