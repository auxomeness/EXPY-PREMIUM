import type {
  Account,
  ActiveAccount,
  ComputationExemption,
  CurrencySettings,
  CustomWallet,
  SubscriptionItem,
  UserData,
  WishlistItem,
} from "../App";
import { DEFAULT_QUICK_ACTION_IDS, sanitizeQuickActionIds } from "./quickActions";
import { normalizeAccentHex } from "./theme";

const USER_DATA_EVENT = "expy:user-data-updated";
const USERS_STORAGE_KEY = "expy_users";

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

export function createEmptyAccount(name = "Expy"): Account {
  const now = new Date().toISOString();

  return {
    id: generateEntityId("account"),
    name,
    accountType: "cash",
    theme: "default",
    customColorMode: "color",
    customGradientStart: "#1d4ed8",
    customGradientEnd: "#7c3aed",
    customColorHue: 220,
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
    includeInTotal: false,
    showOnHome: false,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
}

function createEmptySubscription(): SubscriptionItem {
  const now = new Date().toISOString();

  return {
    id: generateEntityId("subscription"),
    name: "New Subscription",
    amount: 0,
    billingCycle: "monthly",
    nextDueDate: now,
    linkedPaymentSourceId: "",
    category: "General",
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeAccount(account: Partial<Account>): Account {
  const defaults = createEmptyAccount(account.name || "Expy");

  return {
    ...defaults,
    ...account,
    customColorMode: account.customColorMode === "black" || account.customColorMode === "white" ? account.customColorMode : defaults.customColorMode,
    customGradientStart: typeof account.customGradientStart === "string" ? account.customGradientStart : defaults.customGradientStart,
    customGradientEnd: typeof account.customGradientEnd === "string" ? account.customGradientEnd : defaults.customGradientEnd,
    customColorHue: typeof account.customColorHue === "number" ? account.customColorHue : defaults.customColorHue,
    expenses: Array.isArray(account.expenses) ? account.expenses : [],
    transactions: Array.isArray(account.transactions) ? account.transactions : [],
    includeInTotal: account.includeInTotal ?? defaults.includeInTotal,
    showOnHome: account.showOnHome ?? defaults.showOnHome,
    archived: account.archived ?? false,
    creditLimit: account.creditLimit ?? defaults.creditLimit,
    usedCredit: account.usedCredit ?? defaults.usedCredit,
    createdAt: account.createdAt || defaults.createdAt,
    updatedAt: account.updatedAt || account.createdAt || defaults.updatedAt,
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
    includeInTotal: wallet.includeInTotal ?? defaults.includeInTotal,
    showOnHome: wallet.showOnHome ?? defaults.showOnHome,
    archived: wallet.archived ?? false,
    createdAt: wallet.createdAt || defaults.createdAt,
    updatedAt: wallet.updatedAt || wallet.createdAt || defaults.updatedAt,
  };
}

function sanitizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return Array.from(new Set(value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)));
}

function sanitizeAccentPreference(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return normalizeAccentHex(value) ?? "";
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

function normalizeSubscriptionItem(item: Partial<SubscriptionItem>): SubscriptionItem {
  const defaults = createEmptySubscription();

  return {
    ...defaults,
    ...item,
    createdAt: item.createdAt || defaults.createdAt,
    updatedAt: item.updatedAt || item.createdAt || defaults.updatedAt,
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

function sanitizeOrderedIds(ids: unknown, validIds: string[]) {
  const nextIds = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string" && validIds.includes(id)) : [];
  const missingIds = validIds.filter((id) => !nextIds.includes(id));
  return [...nextIds, ...missingIds];
}

function createPrimaryAccountFromLegacy(user: Partial<UserData> & { username: string }, accounts: Account[]) {
  const now = new Date().toISOString();
  const fallbackAccount = accounts[0];
  const primary = normalizeAccount({
    ...fallbackAccount,
    id: fallbackAccount?.id || generateEntityId("account"),
    name: fallbackAccount?.name || "Expy",
    accountType: fallbackAccount?.accountType || "cash",
    theme: fallbackAccount?.theme || "default",
    customColorHue: fallbackAccount?.customColorHue,
    balanceModel: fallbackAccount?.balanceModel || "standard",
    balance: user.balance ?? fallbackAccount?.balance ?? 0,
    initialBalance: user.initialBalance ?? fallbackAccount?.initialBalance ?? 0,
    expenses: Array.isArray(user.expenses) ? user.expenses : fallbackAccount?.expenses ?? [],
    transactions: Array.isArray(user.transactions) ? user.transactions : fallbackAccount?.transactions ?? [],
    includeInTotal: fallbackAccount?.includeInTotal ?? true,
    showOnHome: fallbackAccount?.showOnHome ?? true,
    archived: false,
    creditLimit: fallbackAccount?.creditLimit ?? 0,
    usedCredit: fallbackAccount?.usedCredit ?? 0,
    createdAt: fallbackAccount?.createdAt || now,
    updatedAt: now,
  });

  return primary;
}

function syncLegacyFromPrimaryAccount(userData: UserData, primaryAccount: Account): UserData {
  const visibleHomeAccounts = userData.accounts.filter((account) => !account.archived && account.showOnHome);
  const configuredHeroAccountIds = userData.preferences.homeHeroVisibleAccountIds.filter((accountId) =>
    visibleHomeAccounts.some((account) => account.id === accountId),
  );
  const ensuredHeroAccountIds =
    primaryAccount.showOnHome && !primaryAccount.archived
      ? Array.from(new Set([primaryAccount.id, ...configuredHeroAccountIds]))
      : configuredHeroAccountIds;
  const fallbackHeroAccountId =
    ensuredHeroAccountIds[0] ||
    visibleHomeAccounts[0]?.id ||
    primaryAccount.id;

  return {
    ...userData,
    balance: primaryAccount.balance,
    initialBalance: primaryAccount.initialBalance,
    expenses: primaryAccount.expenses,
    transactions: primaryAccount.transactions,
    preferences: {
      ...userData.preferences,
      homeSelectedAccountId:
        ensuredHeroAccountIds.includes(userData.preferences.homeSelectedAccountId)
          ? userData.preferences.homeSelectedAccountId
          : fallbackHeroAccountId,
      homeHeroSwipeEnabled: userData.preferences.homeHeroSwipeEnabled,
      homeHeroVisibleAccountIds: ensuredHeroAccountIds,
    },
  };
}

export function createDefaultUserData(username: string, password = ""): UserData {
  const now = new Date().toISOString();
  const primaryAccount = createEmptyAccount("Expy");

  return {
    username,
    password,
    authProvider: "local",
    email: "",
    googleId: "",
    avatarUrl: "",
    displayName: "",
    plan: "free",
    balance: 0,
    initialBalance: 0,
    expenses: [],
    transactions: [],
    accounts: [primaryAccount],
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
    subscriptions: [],
    preferences: {
      homeHeroMode: "total_balance",
      homeSelectedAccountId: primaryAccount.id,
      homeHeroSwipeEnabled: true,
      homeHeroVisibleAccountIds: [primaryAccount.id],
      quickActionIds: DEFAULT_QUICK_ACTION_IDS,
      accountListOrderIds: [primaryAccount.id],
      subscriptionListOrderIds: [],
      dismissedDashboardWarningIds: [],
      themeAccentHex: "",
    },
    savingsWishlist: [],
  };
}

export function normalizeUserData(user: Partial<UserData> & { username: string }): UserData {
  const defaults = createDefaultUserData(user.username, user.password || "");
  const normalizedAccounts =
    Array.isArray(user.accounts) && user.accounts.length > 0 ? user.accounts.map(normalizeAccount) : [];
  const primaryAccount = createPrimaryAccountFromLegacy({ ...defaults, ...user }, normalizedAccounts);
  const remainingAccounts = normalizedAccounts
    .filter((account) => account.id !== primaryAccount.id)
    .map((account) =>
      normalizeAccount({
        ...account,
        updatedAt: account.updatedAt || account.createdAt || primaryAccount.updatedAt,
      }),
    );

  const normalizedUser: UserData = {
    ...defaults,
    ...user,
    authProvider: user.authProvider || "local",
    email: user.email || "",
    googleId: user.googleId || "",
    avatarUrl: user.avatarUrl || "",
    plan: user.plan || "free",
    expenses: Array.isArray(user.expenses) ? user.expenses : [],
    transactions: Array.isArray(user.transactions) ? user.transactions : [],
    accounts: [primaryAccount, ...remainingAccounts],
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
    subscriptions: Array.isArray(user.subscriptions)
      ? user.subscriptions.map(normalizeSubscriptionItem)
      : [],
    preferences: {
      ...defaults.preferences,
      ...(user.preferences || {}),
      homeSelectedAccountId: user.preferences?.homeSelectedAccountId || primaryAccount.id,
      homeHeroSwipeEnabled: user.preferences?.homeHeroSwipeEnabled ?? defaults.preferences.homeHeroSwipeEnabled,
      homeHeroVisibleAccountIds: Array.isArray(user.preferences?.homeHeroVisibleAccountIds)
        ? user.preferences.homeHeroVisibleAccountIds
        : [primaryAccount, ...remainingAccounts]
            .filter((account) => account.showOnHome && !account.archived)
            .map((account) => account.id),
      quickActionIds: sanitizeQuickActionIds(user.preferences?.quickActionIds),
      accountListOrderIds: sanitizeOrderedIds(user.preferences?.accountListOrderIds, [primaryAccount, ...remainingAccounts].map((account) => account.id)),
      subscriptionListOrderIds: sanitizeOrderedIds(user.preferences?.subscriptionListOrderIds, Array.isArray(user.subscriptions) ? user.subscriptions.map((subscription) => normalizeSubscriptionItem(subscription).id) : []),
      dismissedDashboardWarningIds: sanitizeStringArray(user.preferences?.dismissedDashboardWarningIds),
      themeAccentHex: sanitizeAccentPreference(user.preferences?.themeAccentHex),
    },
    savingsWishlist: Array.isArray(user.savingsWishlist)
      ? user.savingsWishlist.map(normalizeWishlistItem)
      : [],
  };

  return syncLegacyFromPrimaryAccount(normalizedUser, primaryAccount);
}

export function getStoredUsers(): Record<string, UserData> {
  const rawUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "{}") as Record<string, Partial<UserData>>;

  return Object.fromEntries(
    Object.entries(rawUsers).map(([username, user]) => [username, normalizeUserData({ username, ...user })]),
  );
}

export function writeStoredUsers(users: Record<string, UserData>) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function getUserData(username: string) {
  const users = getStoredUsers();
  return users[username] ?? null;
}

export function findUserEntryByGoogleId(users: Record<string, UserData>, googleId: string) {
  return Object.entries(users).find(([, user]) => user.googleId === googleId) ?? null;
}

function sanitizeUsernameSeed(value: string) {
  const nextValue = value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10);

  return nextValue || "user";
}

export function createUniqueUsername(seed: string, users: Record<string, UserData>) {
  const base = sanitizeUsernameSeed(seed);

  if (!users[base]) {
    return base;
  }

  let counter = 2;

  while (counter < 1000) {
    const suffix = String(counter);
    const candidate = `${base.slice(0, Math.max(1, 10 - suffix.length))}${suffix}`;

    if (!users[candidate]) {
      return candidate;
    }

    counter += 1;
  }

  return `${base.slice(0, 6)}${Date.now().toString().slice(-4)}`;
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

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== USERS_STORAGE_KEY) return;

    const nextUserData = getUserData(username);
    if (nextUserData) {
      onChange(nextUserData);
    }
  };

  window.addEventListener(USER_DATA_EVENT, handleChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(USER_DATA_EVENT, handleChange);
    window.removeEventListener("storage", handleStorage);
  };
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

export function getPrimaryAccount(userData: UserData) {
  return userData.accounts[0] ?? createPrimaryAccountFromLegacy(userData, []);
}

export function setPrimaryAccount(userData: UserData, nextPrimaryAccount: Account) {
  const nextAccounts = [normalizeAccount(nextPrimaryAccount), ...userData.accounts.filter((account) => account.id !== nextPrimaryAccount.id)];

  return syncLegacyFromPrimaryAccount(
    {
      ...userData,
      accounts: nextAccounts,
    },
    nextAccounts[0],
  );
}

export function upsertAccount(userData: UserData, nextAccount: Account) {
  const existingIndex = userData.accounts.findIndex((account) => account.id === nextAccount.id);
  const nextAccounts =
    existingIndex >= 0
      ? userData.accounts.map((account) => (account.id === nextAccount.id ? normalizeAccount(nextAccount) : account))
      : [...userData.accounts, normalizeAccount(nextAccount)];

  if (existingIndex === 0 || (existingIndex === -1 && nextAccount.id === getPrimaryAccount(userData).id)) {
    return syncLegacyFromPrimaryAccount({ ...userData, accounts: nextAccounts }, nextAccounts[0]);
  }

  return {
    ...userData,
    accounts: nextAccounts,
  };
}

export function getAccount(userData: UserData, accountId: string | null | undefined) {
  if (!accountId) return null;

  return userData.accounts.find((account) => account.id === accountId) ?? null;
}

export function getActiveAccounts(userData: UserData) {
  return userData.accounts.filter((account) => !account.archived);
}

export function getVisibleHomeAccounts(userData: UserData) {
  return userData.accounts.filter((account) => !account.archived && account.showOnHome);
}

export function getHeroVisibleAccounts(userData: UserData) {
  const visibleHomeAccounts = getVisibleHomeAccounts(userData);

  return userData.preferences.homeHeroVisibleAccountIds
    .map((accountId) => visibleHomeAccounts.find((account) => account.id === accountId) ?? null)
    .filter((account): account is Account => Boolean(account));
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

export function calculateSelectableTotalBalance(userData: UserData) {
  const accountTotal = userData.accounts
    .filter((account) => !account.archived && account.includeInTotal)
    .reduce((sum, account) => sum + (account.balanceModel === "credit" ? Math.max(account.creditLimit - account.usedCredit, 0) : account.balance), 0);

  const walletTotal = userData.wallets
    .filter((wallet) => !wallet.archived && wallet.includeInTotal)
    .reduce((sum, wallet) => sum + wallet.balance, 0);

  return accountTotal + walletTotal + userData.savings;
}

export function resolveActiveAccount(userData: UserData, activeAccount: ActiveAccount) {
  if (activeAccount.kind === "main") {
    const primaryAccount = getPrimaryAccount(userData);

    return {
      kind: "main" as const,
      id: primaryAccount.id,
      name: primaryAccount.name,
      balance: primaryAccount.balance,
      initialBalance: primaryAccount.initialBalance,
      expenses: primaryAccount.expenses,
      transactions: primaryAccount.transactions,
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
    const primaryAccount = getPrimaryAccount(userData);

    return {
      kind: "main" as const,
      id: primaryAccount.id,
      name: primaryAccount.name,
      balance: primaryAccount.balance,
      initialBalance: primaryAccount.initialBalance,
      expenses: primaryAccount.expenses,
      transactions: primaryAccount.transactions,
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
