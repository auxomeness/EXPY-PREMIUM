import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Badge as BadgeType, calculateBadges, getBadgeColor, getBadgeBackground } from "../utils/badges";
import { Badge } from "./ui/badge";
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
  const earnedCount = badges.filter(b => b.earned).length;
  
  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "streak":
        return <Flame className="w-5 h-5" />;
      case "savings":
        return <DollarSign className="w-5 h-5" />;
      case "discipline":
        return <CheckCircle className="w-5 h-5" />;
      case "category":
        return <Trophy className="w-5 h-5" />;
      default:
        return <Award className="w-5 h-5" />;
    }
  };

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
      <SheetContent side="bottom" className="h-[72vh] rounded-t-[30px]">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Achievements
          </SheetTitle>
          <SheetDescription>
            {earnedCount} of {badges.length} badges earned
          </SheetDescription>
        </SheetHeader>

        <div className="h-[calc(72vh-98px)] space-y-5 overflow-auto px-5 pb-4">
          {/* Streak Badges */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold text-sm">Streak Master</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {badges
                .filter(b => b.category === "streak")
                .map(badge => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
            </div>
          </div>

          {/* Savings Badges */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <h3 className="font-semibold text-sm">Savings Hero</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {badges
                .filter(b => b.category === "savings")
                .map(badge => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
            </div>
          </div>

          {/* Discipline Badges */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold text-sm">Budget Discipline</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {badges
                .filter(b => b.category === "discipline")
                .map(badge => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
            </div>
          </div>

          {/* Category Master Badges */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-purple-500" />
              <h3 className="font-semibold text-sm">Category Master</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {badges
                .filter(b => b.category === "category")
                .map(badge => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

type BadgeCardProps = {
  badge: BadgeType;
};

function BadgeCard({ badge }: BadgeCardProps) {
  const bgClass = getBadgeBackground(badge.level, badge.earned);
  const colorClass = getBadgeColor(badge.level, badge.earned);
  
  return (
    <div className={`p-3 rounded-lg border ${bgClass} ${badge.earned ? "border-border" : "border-dashed border-muted"} transition-all`}>
      <div className="flex items-start justify-between mb-2">
        <Badge 
          variant={badge.earned ? "default" : "outline"} 
          className={`text-xs uppercase ${colorClass}`}
        >
          {badge.level}
        </Badge>
      </div>
      
      <h4 className={`font-semibold text-xs mb-1 ${badge.earned ? "" : "text-muted-foreground"}`}>
        {badge.name}
      </h4>
      
      <p className={`text-[10px] leading-tight mb-2 ${badge.earned ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
        {badge.description}
      </p>
      
      {!badge.earned && badge.progress !== undefined && (
        <div className="space-y-1">
          <Progress value={badge.progress} className="h-1" />
          <p className="text-xs text-muted-foreground text-right">
            {Math.round(badge.progress)}%
          </p>
        </div>
      )}
      
      {badge.earned && (
        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
          <CheckCircle className="w-3 h-3" />
          <span>Earned</span>
        </div>
      )}
    </div>
  );
}
