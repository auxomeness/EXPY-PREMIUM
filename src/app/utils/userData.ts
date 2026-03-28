import type {
  ActiveAccount,
  ComputationExemption,
  CurrencySettings,
  CustomWallet,
  UserData,
  WishlistItem,
} from "../App";

const USER_DATA_EVENT = "expy:user-data-updated";

export function generateEntityId(prefix: string) {
  const randomId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `${prefix}-${randomId}`;
}

export function createDefaultCurrencySettings(baseCurrency: CurrencySettings["baseCurrency"] = "PHP"): CurrencySettings {
  return {
    baseCurrency,
    preferredCurrency: baseCurrency,
    exchangeRates: {
      [baseCurrency]: 1,
    },
    manualExchangeRates: {},
    lastUpdated: "",
    provider: "",
    source: "seed",
  };
}

export function createEmptyWallet(name = "New Wallet"): CustomWallet {
  const now = new Date().toISOString();

  return {
    id: generateEntityId("wallet"),
    name,
    balance: 0,
    initialBalance: 0,
    expenses: [],
    transactions: [],
    thresholdPercentage: 20,
    autoBudgetEnabled: true,
    budgetPeriod: "monthly",
    budgetAmount: 0,
    lastBudgetReset: now,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeWallet(wallet: Partial<CustomWallet>): CustomWallet {
  const defaults = createEmptyWallet(wallet.name || "Untitled Wallet");

  return {
    ...defaults,
    ...wallet,
    expenses: Array.isArray(wallet.expenses) ? wallet.expenses : [],
    transactions: Array.isArray(wallet.transactions) ? wallet.transactions : [],
    thresholdPercentage: wallet.thresholdPercentage ?? defaults.thresholdPercentage,
    autoBudgetEnabled: wallet.autoBudgetEnabled ?? defaults.autoBudgetEnabled,
    budgetPeriod: wallet.budgetPeriod ?? defaults.budgetPeriod,
    budgetAmount: wallet.budgetAmount ?? defaults.budgetAmount,
    lastBudgetReset: wallet.lastBudgetReset || defaults.lastBudgetReset,
    archived: wallet.archived ?? false,
    createdAt: wallet.createdAt || defaults.createdAt,
    updatedAt: wallet.updatedAt || wallet.createdAt || defaults.updatedAt,
  };
}

function normalizeExemption(exemption: Partial<ComputationExemption>): ComputationExemption {
  const now = new Date().toISOString();

  return {
    id: exemption.id || generateEntityId("exemption"),
    name: exemption.name || "Exempted Day",
    date: exemption.date || new Date().toISOString(),
    repeat: exemption.repeat || "none",
    createdAt: exemption.createdAt || now,
    updatedAt: exemption.updatedAt || exemption.createdAt || now,
  };
}

function normalizeWishlistItem(item: Partial<WishlistItem>): WishlistItem {
  const now = new Date().toISOString();

  return {
    id: item.id || generateEntityId("wishlist"),
    name: item.name || "Wishlist Item",
    targetCost: item.targetCost ?? 0,
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || item.createdAt || now,
  };
}

export function createDefaultUserData(username: string, password = ""): UserData {
  const now = new Date().toISOString();

  return {
    username,
    password,
    displayName: "",
    balance: 0,
    initialBalance: 0,
    expenses: [],
    transactions: [],
    thresholdPercentage: 20,
    customCategories: [],
    budgetPeriod: "monthly",
    budgetAmount: 0,
    lastBudgetReset: now,
    isActive: true,
    currentStreak: 0,
    lastOpenedDate: now,
    savings: 0,
    savingsLocked: false,
    notificationsEnabled: false,
    dayEndTime: "22:00",
    lastNotificationDate: "",
    securityQuestions: {
      nickname: "",
      birthdate: "",
      favoriteColor: "",
      secretCode: "",
    },
    currencySettings: createDefaultCurrencySettings(),
    computationExemptions: [],
    wallets: [],
    savingsWishlist: [],
  };
}

function normalizeCurrencySettings(settings?: Partial<CurrencySettings>): CurrencySettings {
  const baseCurrency = settings?.baseCurrency || "PHP";
  const defaults = createDefaultCurrencySettings(baseCurrency);

  return {
    ...defaults,
    ...settings,
    baseCurrency,
    preferredCurrency: settings?.preferredCurrency || baseCurrency,
    exchangeRates: {
      ...defaults.exchangeRates,
      ...(settings?.exchangeRates || {}),
      [baseCurrency]: 1,
    },
    manualExchangeRates: {
      ...(settings?.manualExchangeRates || {}),
    },
    lastUpdated: settings?.lastUpdated || "",
    provider: settings?.provider || "",
    source: settings?.source || "seed",
  };
}

export function normalizeUserData(user: Partial<UserData> & { username: string }): UserData {
  const defaults = createDefaultUserData(user.username, user.password || "");

  return {
    ...defaults,
    ...user,
    expenses: Array.isArray(user.expenses) ? user.expenses : [],
    transactions: Array.isArray(user.transactions) ? user.transactions : [],
    customCategories: Array.isArray(user.customCategories) ? user.customCategories : [],
    securityQuestions: {
      ...defaults.securityQuestions,
      ...(user.securityQuestions || {}),
    },
    currencySettings: normalizeCurrencySettings(user.currencySettings),
    computationExemptions: Array.isArray(user.computationExemptions)
      ? user.computationExemptions.map(normalizeExemption)
      : [],
    wallets: Array.isArray(user.wallets) ? user.wallets.map(normalizeWallet) : [],
    savingsWishlist: Array.isArray(user.savingsWishlist)
      ? user.savingsWishlist.map(normalizeWishlistItem)
      : [],
  };
}

export function getStoredUsers(): Record<string, UserData> {
  const rawUsers = JSON.parse(localStorage.getItem("expy_users") || "{}") as Record<string, Partial<UserData>>;

  return Object.fromEntries(
    Object.entries(rawUsers).map(([username, user]) => [username, normalizeUserData({ username, ...user })]),
  );
}

export function writeStoredUsers(users: Record<string, UserData>) {
  localStorage.setItem("expy_users", JSON.stringify(users));
}

export function getUserData(username: string) {
  const users = getStoredUsers();
  return users[username] ?? null;
}

export function emitUserDataChanged(username: string, userData?: UserData) {
  window.dispatchEvent(
    new CustomEvent(USER_DATA_EVENT, {
      detail: {
        username,
        userData,
      },
    }),
  );
}

export function subscribeToUserData(username: string, onChange: (userData: UserData) => void) {
  const handleChange = (event: Event) => {
    const customEvent = event as CustomEvent<{ username: string; userData?: UserData }>;

    if (customEvent.detail?.username !== username) return;

    onChange(customEvent.detail.userData ?? getUserData(username)!);
  };

  window.addEventListener(USER_DATA_EVENT, handleChange);

  return () => window.removeEventListener(USER_DATA_EVENT, handleChange);
}

export function saveUserData(username: string, nextUserData: UserData) {
  const users = getStoredUsers();
  const normalized = normalizeUserData(nextUserData);

  users[username] = normalized;
  writeStoredUsers(users);
  emitUserDataChanged(username, normalized);

  return normalized;
}

export function updateUserData(username: string, updater: (currentUserData: UserData) => UserData) {
  const currentUserData = getUserData(username);
  if (!currentUserData) return null;

  return saveUserData(username, updater(currentUserData));
}

export function getWallet(userData: UserData, walletId: string | null | undefined) {
  if (!walletId) return null;

  return userData.wallets.find((wallet) => wallet.id === walletId) ?? null;
}

export function getActiveWallets(userData: UserData) {
  return userData.wallets.filter((wallet) => !wallet.archived);
}

export function getArchivedWallets(userData: UserData) {
  return userData.wallets.filter((wallet) => wallet.archived);
}

export function resolveActiveAccount(userData: UserData, activeAccount: ActiveAccount) {
  if (activeAccount.kind === "main") {
    return {
      kind: "main" as const,
      id: "main",
      name: "Main Balance",
      balance: userData.balance,
      initialBalance: userData.initialBalance,
      expenses: userData.expenses,
      transactions: userData.transactions,
      thresholdPercentage: userData.thresholdPercentage,
      autoBudgetEnabled: true,
      budgetPeriod: userData.budgetPeriod,
      budgetAmount: userData.budgetAmount,
      lastBudgetReset: userData.lastBudgetReset,
      archived: false,
    };
  }

  const wallet = getWallet(userData, activeAccount.walletId);

  if (!wallet) {
    return {
      kind: "main" as const,
      id: "main",
      name: "Main Balance",
      balance: userData.balance,
      initialBalance: userData.initialBalance,
      expenses: userData.expenses,
      transactions: userData.transactions,
      thresholdPercentage: userData.thresholdPercentage,
      budgetPeriod: userData.budgetPeriod,
      budgetAmount: userData.budgetAmount,
      lastBudgetReset: userData.lastBudgetReset,
      archived: false,
    };
  }

  return {
    kind: "wallet" as const,
    id: wallet.id,
    name: wallet.name,
    balance: wallet.balance,
    initialBalance: wallet.initialBalance,
    expenses: wallet.expenses,
    transactions: wallet.transactions,
    thresholdPercentage: wallet.thresholdPercentage,
    autoBudgetEnabled: wallet.autoBudgetEnabled,
    budgetPeriod: wallet.budgetPeriod,
    budgetAmount: wallet.budgetAmount,
    lastBudgetReset: wallet.lastBudgetReset,
    archived: wallet.archived,
  };
}
