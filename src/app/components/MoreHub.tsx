import { ChevronRight, CreditCard, Headset, MessageSquareText, Settings2, ShieldCheck, WalletCards } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

export type MoreDestination =
  | "hub"
  | "accounts"
  | "wallets"
  | "premium"
  | "contact"
  | "settings"
  | "admin-payments"
  | "admin-support";

type MoreHubProps = {
  onNavigate: (destination: Exclude<MoreDestination, "hub">) => void;
  isAdmin: boolean;
};

type MoreLink = {
  id: Exclude<MoreDestination, "hub">;
  label: string;
  description: string;
  icon: typeof WalletCards;
};

const coreLinks: MoreLink[] = [
  { id: "accounts", label: "Accounts", description: "Manage account types, transfers, and subscriptions.", icon: WalletCards },
  { id: "wallets", label: "Custom Wallets", description: "Separate purpose-based wallets outside your main accounts.", icon: CreditCard },
  { id: "premium", label: "Premium", description: "View ExPlus and ExPro access, perks, and payment status.", icon: ShieldCheck },
  { id: "contact", label: "Contact Us", description: "Send concerns, upgrade questions, or bug reports.", icon: Headset },
  { id: "settings", label: "Settings", description: "Keep all existing preferences and account controls in one place.", icon: Settings2 },
];

const adminLinks: MoreLink[] = [
  { id: "admin-payments", label: "Payment Reviews", description: "Approve or reject submitted premium payments.", icon: ShieldCheck },
  { id: "admin-support", label: "Support Inbox", description: "Review and resolve submitted contact messages.", icon: MessageSquareText },
];

function MoreLinkCard({ item, onNavigate }: { item: MoreLink; onNavigate: (id: MoreLink["id"]) => void }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onNavigate(item.id)}
      className="app-list-row flex w-full items-center justify-between gap-3 text-left transition-colors hover:bg-accent/30"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="app-list-icon">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="app-list-title">{item.label}</p>
          <p className="app-list-meta">{item.description}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

export function MoreHub({ onNavigate, isAdmin }: MoreHubProps) {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">More</p>
          <h1 className="page-title">More</h1>
          <p className="page-subtitle">
            {isAdmin
              ? "Access premium features, account tools, support, and admin review flows."
              : "Access premium features, account tools, support, and settings from one workspace."}
          </p>
        </div>
      </div>

      <Card className="hero-card border-0">
        <CardContent className="relative space-y-4 overflow-hidden pt-5">
          <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-white/8 blur-2xl" />
          <div className="relative">
            <p className="text-sm text-primary-foreground/72">Workspace</p>
            <h2 className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-primary-foreground">Control Center</h2>
            <p className="mt-2 max-w-[18rem] text-sm leading-6 text-primary-foreground/80">
              Manage premium access, accounts, custom wallets, and review queues from one hub.
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="px-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
        </div>
        <div className="space-y-3">
          {coreLinks.map((item) => (
            <MoreLinkCard key={item.id} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {isAdmin ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Admin Tools</p>
            <Button variant="ghost" size="sm" className="h-auto px-0 text-xs text-muted-foreground">
              Frontend mock state
            </Button>
          </div>
          <div className="space-y-3">
            {adminLinks.map((item) => (
              <MoreLinkCard key={item.id} item={item} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
