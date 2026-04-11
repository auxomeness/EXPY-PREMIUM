import {
  ArrowLeftRight,
  CreditCard,
  PiggyBank,
  Settings2,
  ShieldCheck,
  SunMoon,
  TrendingDown,
  Wallet,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import type { QuickActionId } from "../App";

export const MAX_QUICK_ACTIONS = 5;

export const DEFAULT_QUICK_ACTION_IDS: QuickActionId[] = ["add_expense", "add_money", "transfer", "add_savings", "open_accounts"];

export const QUICK_ACTION_OPTIONS: Array<{
  id: QuickActionId;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  { id: "add_expense", label: "Add Expense", description: "Open the expense dialog for the active home card.", icon: TrendingDown },
  { id: "add_money", label: "Add Money", description: "Open add money or pay card for the active home card.", icon: Wallet },
  { id: "transfer", label: "Transfer", description: "Jump directly to the transfers workspace.", icon: ArrowLeftRight },
  { id: "add_savings", label: "Add Savings", description: "Move money into savings from the active home card.", icon: PiggyBank },
  { id: "open_savings", label: "Savings Page", description: "Open the Savings tab.", icon: PiggyBank },
  { id: "open_accounts", label: "Accounts Page", description: "Open the Accounts workspace.", icon: WalletCards },
  { id: "open_wallets", label: "Wallets Page", description: "Open the Custom Wallets workspace.", icon: CreditCard },
  { id: "open_premium", label: "Premium Page", description: "Open the Premium screen.", icon: ShieldCheck },
  { id: "open_settings", label: "Settings Page", description: "Open Settings.", icon: Settings2 },
  { id: "toggle_theme", label: "Theme Toggle", description: "Switch between light mode and dark mode with one shortcut.", icon: SunMoon },
];

export function isQuickActionId(value: string): value is QuickActionId {
  return QUICK_ACTION_OPTIONS.some((option) => option.id === value);
}

export function sanitizeQuickActionIds(input: unknown): QuickActionId[] {
  if (!Array.isArray(input)) {
    return DEFAULT_QUICK_ACTION_IDS;
  }

  const mapped = input.map((value) => {
    if (value === "enable_dark_mode" || value === "enable_light_mode") {
      return "toggle_theme";
    }

    return value;
  });

  const unique = Array.from(new Set(mapped.filter((value): value is QuickActionId => typeof value === "string" && isQuickActionId(value))));
  return unique.slice(0, MAX_QUICK_ACTIONS);
}