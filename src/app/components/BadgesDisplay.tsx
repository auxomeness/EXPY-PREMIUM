import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Badge as BadgeType, calculateBadges, getBadgeColor, getBadgeBackground } from "../utils/badges";
import { Award, Flame, DollarSign, CheckCircle, Trophy } from "lucide-react";
import { Progress } from "./ui/progress";
import type { UserData } from "../App";

type BadgesDisplayProps = {
  userData: UserData;
  variant?: "default" | "dashboard";
};

export function BadgesDisplay({ userData, variant = "default" }: BadgesDisplayProps) {
  const [open, setOpen] = useState(false);
  const badges = calculateBadges(userData);
  const earnedCount = badges.filter((badge) => badge.earned).length;
  const completion = badges.length === 0 ? 0 : (earnedCount / badges.length) * 100;
  const nextBadge = [...badges]
    .filter((badge) => !badge.earned)
    .sort((left, right) => (right.progress ?? 0) - (left.progress ?? 0))[0];

  const sections = [
    {
      key: "streak",
      title: "Streak Master",
      icon: Flame,
      iconClass: "text-orange-500",
      surfaceClass: "bg-orange-50/65 dark:bg-orange-950/18",
    },
    {
      key: "savings",
      title: "Savings Hero",
      icon: DollarSign,
      iconClass: "text-green-500",
      surfaceClass: "bg-green-50/65 dark:bg-green-950/18",
    },
    {
      key: "discipline",
      title: "Budget Discipline",
      icon: CheckCircle,
      iconClass: "text-blue-500",
      surfaceClass: "bg-blue-50/65 dark:bg-blue-950/18",
    },
    {
      key: "category",
      title: "Category Master",
      icon: Trophy,
      iconClass: "text-purple-500",
      surfaceClass: "bg-purple-50/65 dark:bg-purple-950/18",
    },
  ] as const;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {variant === "dashboard" ? (
          <button className="header-stat-card transition-colors hover:bg-accent/40">
            <div className="header-stat-icon">
              <Award className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="header-stat-label">Badges</p>
              <p className="header-stat-value">{earnedCount}</p>
            </div>
          </button>
        ) : (
          <button className="header-stat-card transition-colors hover:bg-accent/40">
            <div className="header-stat-icon">
              <Award className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="header-stat-label">Achievements</p>
              <p className="header-stat-value">{earnedCount}</p>
            </div>
          </button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[78vh] rounded-t-[34px] border-0 bg-background/98">
        <SheetHeader className="space-y-1 pb-0">
          <SheetTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Achievements
          </SheetTitle>
          <SheetDescription>
            {earnedCount} of {badges.length} achievements unlocked
          </SheetDescription>
        </SheetHeader>

        <div className="h-[calc(78vh-92px)] space-y-4 overflow-auto px-5 pb-[max(1.1rem,env(safe-area-inset-bottom))] pt-4">
          <section className="rounded-[26px] border border-border/70 bg-card/88 px-4 py-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-border/60 bg-muted/35">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-[-0.02em]">All Achievements</h3>
                  <p className="text-xs text-muted-foreground">
                    {earnedCount} unlocked, {badges.length - earnedCount} remaining
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-border/65 bg-muted/35 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {Math.round(completion)}%
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Overall completion</span>
                <span className="font-semibold text-foreground">{Math.round(completion)}%</span>
              </div>
              <Progress value={completion} className="h-2.5 bg-primary/12" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-border/65 bg-background/82 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Unlocked</p>
                <p className="mt-1 text-lg font-semibold tracking-[-0.03em]">{earnedCount}</p>
              </div>
              <div className="rounded-[22px] border border-border/65 bg-background/82 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Remaining</p>
                <p className="mt-1 text-lg font-semibold tracking-[-0.03em]">{badges.length - earnedCount}</p>
              </div>
            </div>

            {nextBadge && (
              <div className="mt-4 rounded-[22px] border border-border/65 bg-background/82 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Next Up</p>
                    <p className="mt-1 truncate text-sm font-semibold tracking-[-0.02em]">{nextBadge.name}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(nextBadge.progress ?? 0)}% complete</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {nextBadge.level}
                  </span>
                </div>
              </div>
            )}
          </section>

          {sections.map((section) => {
            const sectionBadges = badges.filter((badge) => badge.category === section.key);
            const unlockedInSection = sectionBadges.filter((badge) => badge.earned).length;
            const SectionIcon = section.icon;

            return (
              <section key={section.key} className="rounded-[26px] border border-border/70 bg-card/88 px-4 py-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.28)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-[18px] border border-border/60 ${section.surfaceClass}`}>
                      <SectionIcon className={`h-5 w-5 ${section.iconClass}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold tracking-[-0.02em]">{section.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {unlockedInSection} of {sectionBadges.length} unlocked
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-border/65 bg-muted/35 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {sectionBadges.length}
                  </span>
                </div>

                <div className="mt-3 space-y-3">
                  {sectionBadges.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} icon={<SectionIcon className={`h-4.5 w-4.5 ${section.iconClass}`} />} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

type BadgeCardProps = {
  badge: BadgeType;
  icon: React.ReactNode;
};

function BadgeCard({ badge, icon }: BadgeCardProps) {
  const bgClass = getBadgeBackground(badge.level, badge.earned);
  const colorClass = getBadgeColor(badge.level, badge.earned);
  const progress = Math.round(badge.progress ?? 0);

  return (
    <div className={`rounded-[22px] border px-4 py-4 ${bgClass} ${badge.earned ? "border-border/70 shadow-[0_16px_30px_-26px_rgba(15,23,42,0.24)]" : "border-dashed border-border/70"}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-border/60 bg-background/82">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className={`text-sm font-semibold tracking-[-0.02em] ${badge.earned ? "" : "text-foreground/88"}`}>
                {badge.name}
              </h4>
              <p className={`mt-1 text-xs leading-5 ${badge.earned ? "text-muted-foreground" : "text-muted-foreground/80"}`}>
                {badge.description}
              </p>
            </div>
            <span className={`shrink-0 rounded-full border border-border/65 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${colorClass}`}>
              {badge.level}
            </span>
          </div>

          {badge.earned ? (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-green-500/25 bg-green-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-green-600 dark:text-green-400">
              <CheckCircle className="h-3.5 w-3.5" />
              Unlocked
            </div>
          ) : (
            <div className="mt-3 space-y-1.5">
              <Progress value={badge.progress} className="h-2 bg-primary/10" />
              <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-muted-foreground">
                <span>In progress</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
