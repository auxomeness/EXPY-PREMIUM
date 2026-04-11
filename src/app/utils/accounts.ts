import type { CSSProperties } from "react";
import type {
  Account,
  AccountTheme,
  AccountType,
  Expense,
  SubscriptionItem,
  Transaction,
  UserData,
} from "../App";
import { generateEntityId, getActiveAccounts, getActiveWallets, getPrimaryAccount, setPrimaryAccount, upsertAccount } from "./userData";

export const DEFAULT_CUSTOM_CARD_HUE = 220;
export const DEFAULT_CUSTOM_CARD_MODE = "color" as const;
export const DEFAULT_CUSTOM_CARD_GRADIENT_START = "#1d4ed8";
export const DEFAULT_CUSTOM_CARD_GRADIENT_END = "#7c3aed";

export const ACCOUNT_TYPE_OPTIONS: Array<{ value: AccountType; label: string; balanceModel: Account["balanceModel"] }> = [
  { value: "cash", label: "Cash", balanceModel: "standard" },
  { value: "bank_account", label: "Bank Account", balanceModel: "standard" },
  { value: "debit_card", label: "Debit Card", balanceModel: "standard" },
  { value: "credit_card", label: "Credit Card", balanceModel: "credit" },
  { value: "e_wallet", label: "E-Wallet", balanceModel: "standard" },
  { value: "savings_account", label: "Savings Account", balanceModel: "standard" },
];

export const ACCOUNT_THEME_STYLES: Record<
  AccountTheme,
  {
    label: string;
    surface: string;
    accent: string;
    chip: string;
    progressTrack: string;
    progressFill: string;
    preview: string;
  }
> = {
  default: {
    label: "Graphite",
    surface: "from-[#090b10] via-[#11141a] to-[#1b212b]",
    accent: "text-white/78",
    chip: "border-white/12 bg-white/10 text-white/84",
    progressTrack: "bg-white/12",
    progressFill: "bg-white/74",
    preview: "from-[#090b10] via-[#11141a] to-[#1b212b]",
  },
  gcash: {
    label: "GCash",
    surface: "from-[#0a56c8] via-[#0f61d2] to-[#2fa6ff]",
    accent: "text-white/85",
    chip: "border-white/18 bg-black/16 text-white/84",
    progressTrack: "bg-white/14",
    progressFill: "bg-white/72",
    preview: "from-[#0b55c7] via-[#1361d3] to-[#2fa5ff]",
  },
  maya: {
    label: "Maya",
    surface: "from-[#11755c] via-[#15916f] to-[#38bf85]",
    accent: "text-white/85",
    chip: "border-white/18 bg-black/14 text-white/84",
    progressTrack: "bg-white/14",
    progressFill: "bg-white/78",
    preview: "from-[#106f58] via-[#179071] to-[#39c489]",
  },
  bpi: {
    label: "BPI",
    surface: "from-[#a72f3e] via-[#be4150] to-[#d25f6b]",
    accent: "text-white/85",
    chip: "border-white/18 bg-black/16 text-white/84",
    progressTrack: "bg-white/14",
    progressFill: "bg-white/72",
    preview: "from-[#ac3241] via-[#c14857] to-[#d66370]",
  },
  bdo: {
    label: "BDO",
    surface: "from-[#0c3f84] via-[#0e4e9c] to-[#196bcc]",
    accent: "text-white/85",
    chip: "border-white/18 bg-black/16 text-white/84",
    progressTrack: "bg-white/14",
    progressFill: "bg-white/74",
    preview: "from-[#0d4288] via-[#0f4e9b] to-[#1a6dce]",
  },
  generic_bank: {
    label: "Silver Bank",
    surface: "from-[#9ca1b4] via-[#b4b8c8] to-[#d1d6e4]",
    accent: "text-slate-950/78",
    chip: "border-slate-900/10 bg-white/36 text-slate-900/72",
    progressTrack: "bg-slate-950/8",
    progressFill: "bg-slate-950/58",
    preview: "from-[#a4a9bb] via-[#bcc0cf] to-[#dce0ea]",
  },
  custom_card: {
    label: "Custom Card",
    surface: "from-[#06080d] via-[#0d1016] to-[#171d26]",
    accent: "text-white/78",
    chip: "border-white/12 bg-white/8 text-white/78",
    progressTrack: "bg-white/14",
    progressFill: "bg-white/74",
    preview: "from-[#06080d] via-[#0d1016] to-[#171d26]",
  },
};

function wrapHue(value: number) {
  return ((Math.round(value) % 360) + 360) % 360;
}

function buildCustomCardGradient(hue: number) {
  const baseHue = wrapHue(hue);
  return `linear-gradient(135deg, hsl(${baseHue} 78% 10%) 0%, hsl(${wrapHue(baseHue + 26)} 70% 16%) 42%, hsl(${wrapHue(baseHue + 54)} 82% 34%) 100%)`;
}

function buildGradientFromEndpoints(startColor: string, endColor: string) {
  return `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`;
}

function buildBlackCardGradient() {
  return "linear-gradient(135deg, #020304 0%, #0b0e14 44%, #1a202a 100%)";
}

function buildWhiteCardGradient() {
  return "linear-gradient(135deg, #ffffff 0%, #eef2f7 46%, #cfd8e3 100%)";
}

export function getAccountThemeStyle(account: Pick<Account, "theme" | "customColorHue" | "customColorMode" | "customGradientStart" | "customGradientEnd"> | { theme: AccountTheme; customColorHue?: number; customColorMode?: Account["customColorMode"]; customGradientStart?: string; customGradientEnd?: string }) {
  const theme = ACCOUNT_THEME_STYLES[account.theme];

  if (account.theme !== "custom_card") {
    return {
      label: theme.label,
      surfaceClassName: theme.surface,
      surfaceStyle: undefined as CSSProperties | undefined,
      accent: theme.accent,
      chip: theme.chip,
      progressTrack: theme.progressTrack,
      progressFill: theme.progressFill,
      previewClassName: theme.preview,
      previewStyle: undefined as CSSProperties | undefined,
      titleText: "text-white/96",
      subtitleText: "text-white/58",
      amountText: "text-white",
      metaText: "text-white/62",
      accountValueText: "text-white/94",
    };
  }

  const mode = account.customColorMode === "black" || account.customColorMode === "white" ? account.customColorMode : DEFAULT_CUSTOM_CARD_MODE;
  const hue = typeof account.customColorHue === "number" ? account.customColorHue : DEFAULT_CUSTOM_CARD_HUE;
  const gradient =
    mode === "black"
      ? buildBlackCardGradient()
      : mode === "white"
        ? buildWhiteCardGradient()
        : buildGradientFromEndpoints(account.customGradientStart || DEFAULT_CUSTOM_CARD_GRADIENT_START, account.customGradientEnd || DEFAULT_CUSTOM_CARD_GRADIENT_END);
  const isWhiteMode = mode === "white";

  return {
    label: theme.label,
    surfaceClassName: "",
    surfaceStyle: { backgroundImage: gradient, backgroundColor: isWhiteMode ? "#f4f7fb" : mode === "black" ? "#050608" : account.customGradientStart || `hsl(${wrapHue(hue)} 72% 10%)` },
    accent: isWhiteMode ? "text-slate-900/68" : theme.accent,
    chip: isWhiteMode ? "border-slate-900/10 bg-white/65 text-slate-900/72" : theme.chip,
    progressTrack: isWhiteMode ? "bg-slate-950/8" : theme.progressTrack,
    progressFill: isWhiteMode ? "bg-slate-950/58" : theme.progressFill,
    previewClassName: "",
    previewStyle: { backgroundImage: gradient, backgroundColor: isWhiteMode ? "#f4f7fb" : mode === "black" ? "#050608" : account.customGradientStart || `hsl(${wrapHue(hue)} 72% 10%)` },
    titleText: isWhiteMode ? "text-slate-950/92" : "text-white/96",
    subtitleText: isWhiteMode ? "text-slate-950/56" : "text-white/58",
    amountText: isWhiteMode ? "text-slate-950" : "text-white",
    metaText: isWhiteMode ? "text-slate-950/58" : "text-white/62",
    accountValueText: isWhiteMode ? "text-slate-950/90" : "text-white/94",
  };
}

export function createAccountDraft(name = "New Account"): Account {
  const now = new Date().toISOString();
  return {
    id: generateEntityId("account"),
    name,
    accountType: "bank_account",
    theme: "default",
    customColorMode: DEFAULT_CUSTOM_CARD_MODE,
    customGradientStart: DEFAULT_CUSTOM_CARD_GRADIENT_START,
    customGradientEnd: DEFAULT_CUSTOM_CARD_GRADIENT_END,
    customColorHue: DEFAULT_CUSTOM_CARD_HUE,
    balanceModel: "standard",
    balance: 0,
    initialBalance: 0,
    includeInTotal: true,
    showOnHome: true,
    archived: false,
    creditLimit: 0,
    usedCredit: 0,
    expenses: [],
    transactions: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function getAccountAvailableAmount(account: Account) {
  if (account.balanceModel === "credit") {
    return Math.max(account.creditLimit - account.usedCredit, 0);
  }

  return account.balance;
}

export function updateAccountInUserData(userData: UserData, nextAccount: Account) {
  const primaryAccount = getPrimaryAccount(userData);
  if (nextAccount.id === primaryAccount.id) {
    return setPrimaryAccount(userData, nextAccount);
  }

  return upsertAccount(userData, nextAccount);
}

export function getHomeDisplayAccount(userData: UserData) {
  const selected = userData.accounts.find((account) => account.id === userData.preferences.homeSelectedAccountId);
  if (selected && !selected.archived) {
    return selected;
  }

  return userData.accounts.find((account) => account.showOnHome && !account.archived) || getPrimaryAccount(userData);
}

export function buildTransferTargets(userData: UserData) {
  const accountTargets = getActiveAccounts(userData).map((account) => ({
    id: `account:${account.id}`,
    entityId: account.id,
    type: "account" as const,
    label: account.name,
    helper:
      account.balanceModel === "credit"
        ? `Available credit ${getAccountAvailableAmount(account).toFixed(2)}`
        : `Balance ${account.balance.toFixed(2)}`,
  }));

  const walletTargets = getActiveWallets(userData).map((wallet) => ({
    id: `wallet:${wallet.id}`,
    entityId: wallet.id,
    type: "wallet" as const,
    label: wallet.name,
    helper: `Wallet ${wallet.balance.toFixed(2)}`,
  }));

  const savingsTarget = {
    id: "savings:main",
    entityId: "savings",
    type: "savings" as const,
    label: "Expy Savings",
    helper: `Saved ${userData.savings.toFixed(2)}`,
  };

  return [...accountTargets, ...walletTargets, savingsTarget];
}

export function applyLocalTransfer(
  userData: UserData,
  input: {
    sourceKey: string;
    destinationKey: string;
    amount: number;
    note?: string;
  },
) {
  const [sourceType, sourceId] = input.sourceKey.split(":");
  const [destinationType, destinationId] = input.destinationKey.split(":");
  const timestamp = new Date().toISOString();

  const outTransaction: Transaction = {
    id: generateEntityId("txn"),
    type: destinationType === "account" && destinationId && getPrimaryAccount(userData).id !== destinationId ? "transfer_out" : "transfer_out",
    amount: input.amount,
    description: input.note?.trim() || "Transfer",
    date: timestamp,
    sourceId,
    destinationId,
  };

  const inTransaction: Transaction = {
    id: generateEntityId("txn"),
    type: sourceType === "account" && sourceId ? "transfer_in" : "transfer_in",
    amount: input.amount,
    description: input.note?.trim() || "Transfer",
    date: timestamp,
    sourceId,
    destinationId,
  };

  let nextUserData = { ...userData };

  if (sourceType === "account") {
    nextUserData.accounts = nextUserData.accounts.map((account) => {
      if (account.id !== sourceId) return account;
      if (account.balanceModel === "credit") {
        return {
          ...account,
          usedCredit: Math.min(account.creditLimit, account.usedCredit + input.amount),
          transactions: [outTransaction, ...account.transactions],
          updatedAt: timestamp,
        };
      }

      return {
        ...account,
        balance: account.balance - input.amount,
        transactions: [outTransaction, ...account.transactions],
        updatedAt: timestamp,
      };
    });
  } else if (sourceType === "wallet") {
    nextUserData.wallets = nextUserData.wallets.map((wallet) =>
      wallet.id === sourceId
        ? { ...wallet, balance: wallet.balance - input.amount, transactions: [outTransaction, ...wallet.transactions], updatedAt: timestamp }
        : wallet,
    );
  } else if (sourceType === "savings") {
    nextUserData = {
      ...nextUserData,
      savings: nextUserData.savings - input.amount,
      transactions: [
        {
          ...outTransaction,
          type: "withdraw_savings",
        },
        ...nextUserData.transactions,
      ],
    };
  }

  if (destinationType === "account") {
    nextUserData.accounts = nextUserData.accounts.map((account) => {
      if (account.id !== destinationId) return account;
      if (account.balanceModel === "credit") {
        return {
          ...account,
          usedCredit: Math.max(0, account.usedCredit - input.amount),
          transactions: [
            {
              ...inTransaction,
              type: "credit_payment",
            },
            ...account.transactions,
          ],
          updatedAt: timestamp,
        };
      }

      return {
        ...account,
        balance: account.balance + input.amount,
        transactions: [inTransaction, ...account.transactions],
        updatedAt: timestamp,
      };
    });
  } else if (destinationType === "wallet") {
    nextUserData.wallets = nextUserData.wallets.map((wallet) =>
      wallet.id === destinationId
        ? { ...wallet, balance: wallet.balance + input.amount, transactions: [inTransaction, ...wallet.transactions], updatedAt: timestamp }
        : wallet,
    );
  } else if (destinationType === "savings") {
    nextUserData = {
      ...nextUserData,
      savings: nextUserData.savings + input.amount,
      transactions: [
        {
          ...inTransaction,
          type: "add_savings",
        },
        ...nextUserData.transactions,
      ],
    };
  }

  const primaryAccount = getPrimaryAccount(nextUserData);
  return setPrimaryAccount(nextUserData, primaryAccount);
}

export function getSubscriptionBreakdown(subscriptions: SubscriptionItem[]) {
  const active = subscriptions.filter((subscription) => subscription.status === "active");
  const upcoming = active
    .slice()
    .sort((left, right) => new Date(left.nextDueDate).getTime() - new Date(right.nextDueDate).getTime())
    .slice(0, 3);

  return {
    activeCount: active.length,
    upcoming,
  };
}

export function collectAllTransactions(userData: UserData) {
  const accountTransactions = userData.accounts.flatMap((account) =>
    account.transactions.map((transaction) => ({
      ...transaction,
      sourceName: transaction.sourceName || account.name,
      relatedAccountId: transaction.relatedAccountId || account.id,
    })),
  );
  const walletTransactions = userData.wallets.flatMap((wallet) =>
    wallet.transactions.map((transaction) => ({
      ...transaction,
      sourceName: transaction.sourceName || wallet.name,
      relatedAccountId: transaction.relatedAccountId || wallet.id,
    })),
  );
  const savingsTransactions = userData.transactions.filter(
    (transaction) => transaction.type === "add_savings" || transaction.type === "withdraw_savings",
  );

  return [...accountTransactions, ...walletTransactions, ...savingsTransactions].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
  );
}

export function collectAllExpenses(userData: UserData) {
  return [...userData.accounts.flatMap((account) => account.expenses), ...userData.wallets.flatMap((wallet) => wallet.expenses)].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
  );
}

export function createAccountExpense(account: Account, input: Omit<Expense, "id" | "date">) {
  const date = new Date().toISOString();
  const nextExpense: Expense = {
    ...input,
    id: generateEntityId("expense"),
    date,
  };
  const nextTransaction: Transaction = {
    id: nextExpense.id,
    type: "expense",
    amount: nextExpense.amount,
    category: nextExpense.category,
    description: nextExpense.description,
    date,
    relatedAccountId: account.id,
  };

  if (account.balanceModel === "credit") {
    return {
      ...account,
      usedCredit: Math.min(account.creditLimit, account.usedCredit + nextExpense.amount),
      expenses: [nextExpense, ...account.expenses],
      transactions: [nextTransaction, ...account.transactions],
      updatedAt: date,
    };
  }

  return {
    ...account,
    balance: account.balance - nextExpense.amount,
    expenses: [nextExpense, ...account.expenses],
    transactions: [nextTransaction, ...account.transactions],
    updatedAt: date,
  };
}
