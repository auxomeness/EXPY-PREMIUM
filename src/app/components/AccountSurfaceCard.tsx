import type { KeyboardEventHandler } from "react";
import { Wifi } from "lucide-react";
import type { Account, CurrencySettings } from "../App";
import { getAccountAvailableAmount, getAccountThemeStyle } from "../utils/accounts";
import { formatUserCurrency } from "../utils/currency";
import { Card, CardContent } from "./ui/card";

type AccountSurfaceCardProps = {
  account: Account;
  currencySettings: CurrencySettings;
  brandLabel: string;
  brandSubLabel?: string;
  accountLabel?: string;
  accountValue?: string;
  forceChip?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  className?: string;
};

export function AccountSurfaceCard({
  account,
  currencySettings,
  brandLabel,
  brandSubLabel,
  accountLabel = "Account",
  accountValue,
  forceChip = false,
  interactive = false,
  onClick,
  onKeyDown,
  className = "",
}: AccountSurfaceCardProps) {
  const theme = getAccountThemeStyle(account);
  const displayedAmount = account.balanceModel === "credit" ? getAccountAvailableAmount(account) : account.balance;
  const showsContactless = true;
  const showsChip =
    forceChip ||
    account.accountType === "debit_card" ||
    account.accountType === "credit_card" ||
    account.accountType === "e_wallet" ||
    account.theme === "maya" ||
    account.theme === "gcash";
  const resolvedBrandSubLabel = brandSubLabel ?? account.accountType.replace(/_/g, " ");
  const resolvedAccountValue = accountValue ?? account.name;

  return (
    <Card
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
      style={theme.surfaceStyle}
      className={`overflow-hidden border-0 bg-gradient-to-br ${theme.surfaceClassName} text-white shadow-[0_22px_34px_-26px_rgba(15,23,42,0.58)] ${interactive ? "cursor-pointer" : ""} ${className}`.trim()}
    >
      <CardContent className="relative h-[212px] px-5 pb-4 pt-4 sm:h-[220px] sm:px-6 sm:pb-5 sm:pt-5">
        <div className="absolute -right-10 top-0 h-28 w-28 rounded-full bg-white/12 blur-2xl" />
        <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full border border-white/10 opacity-35 translate-x-7 translate-y-10" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className={`text-[1.35rem] font-semibold tracking-[-0.05em] sm:text-[1.7rem] ${theme.titleText}`}>{brandLabel}</p>
            <p className={`text-xs uppercase tracking-[0.18em] ${theme.subtitleText}`}>{resolvedBrandSubLabel}</p>
          </div>
          {showsContactless ? <Wifi className={`mt-1 h-8 w-8 rotate-90 sm:mt-2 sm:h-9 sm:w-9 ${theme.metaText}`} strokeWidth={2.2} /> : null}
        </div>

        {showsChip ? (
          <div className="absolute left-5 top-[80px] flex h-9 w-12 items-center rounded-[13px] border border-white/16 bg-black/12 px-1.5 sm:left-6 sm:top-[88px] sm:h-11 sm:w-14 sm:px-2">
            <div className="relative h-6 w-9 overflow-hidden rounded-[7px] border border-[#8d7b4d]/60 bg-[linear-gradient(135deg,#c79f45_0%,#f3d987_28%,#a77e2f_58%,#f8e6a4_76%,#8e6a22_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.34),inset_0_-1px_1px_rgba(89,57,9,0.25)] sm:h-7 sm:w-10">
              <div className="absolute inset-y-0 left-[34%] w-px bg-black/18" />
              <div className="absolute inset-y-0 left-[67%] w-px bg-black/18" />
              <div className="absolute inset-x-0 top-1/2 h-px bg-black/18 -translate-y-1/2" />
              <div className="absolute inset-y-[14%] left-[12%] w-[16%] rounded-full border border-black/15" />
              <div className="absolute inset-y-[14%] right-[12%] w-[16%] rounded-full border border-black/15" />
              <div className="absolute left-[8%] right-[8%] top-[18%] h-[14%] rounded-full bg-white/12 blur-[1px]" />
            </div>
          </div>
        ) : null}

        <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4 sm:bottom-5 sm:left-6 sm:right-6">
          <div className="min-w-0">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${theme.accent}`}>
              {account.balanceModel === "credit" ? "Available credit" : "Current balance"}
            </p>
            <p className={`mt-2 text-[1.65rem] font-semibold leading-none tracking-[-0.05em] sm:text-[2rem] ${theme.amountText}`}>
              {formatUserCurrency(displayedAmount, currencySettings)}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${theme.metaText}`}>{accountLabel}</p>
            <p className={`mt-1 text-sm font-semibold leading-none ${theme.accountValueText}`}>{resolvedAccountValue}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}