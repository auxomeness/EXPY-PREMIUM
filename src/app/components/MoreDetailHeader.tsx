import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";

type MoreDetailHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  onBack: () => void;
  actions?: ReactNode;
};

export function MoreDetailHeader({ eyebrow, title, subtitle, onBack, actions }: MoreDetailHeaderProps) {
  return (
    <div className="page-header flex-col items-stretch sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        <Button variant="ghost" size="sm" className="-ml-3 mb-2 h-auto px-3 text-muted-foreground" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex justify-end sm:block sm:shrink-0">{actions}</div> : null}
    </div>
  );
}
