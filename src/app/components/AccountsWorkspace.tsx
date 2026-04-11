import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ArrowLeftRight, CreditCard, Landmark, Plus, Trash2, WalletCards } from "lucide-react";
import { toast } from "sonner";
import type { Account, SubscriptionItem, UserData } from "../App";
import { ACCOUNT_THEME_STYLES, ACCOUNT_TYPE_OPTIONS, DEFAULT_CUSTOM_CARD_GRADIENT_END, DEFAULT_CUSTOM_CARD_GRADIENT_START, DEFAULT_CUSTOM_CARD_HUE, applyLocalTransfer, buildTransferTargets, createAccountDraft, getAccountAvailableAmount, getAccountThemeStyle, getHomeDisplayAccount, getSubscriptionBreakdown, updateAccountInUserData } from "../utils/accounts";
import { convertToBaseCurrency, formatUserCurrency } from "../utils/currency";
import { getMonthlySubscriptionTotal, hasPlusAccess } from "../utils/premium";
import { createDefaultUserData, generateEntityId, getActiveAccounts, getPrimaryAccount, getUserData, saveUserData, subscribeToUserData } from "../utils/userData";
import { AccountSurfaceCard } from "./AccountSurfaceCard";
import { LockedFeatureCard } from "./LockedFeatureCard";
import { MoreDetailHeader } from "./MoreDetailHeader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "./ui/drawer";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { cn } from "./ui/utils";

type AccountsWorkspaceProps = {
  username: string;
  onBack: () => void;
  onOpenPremium: () => void;
  initialSection?: WorkspaceSection;
};

type WorkspaceSection = "accounts" | "subscriptions" | "transfers";

type AccountFormState = {
  id?: string;
  name: string;
  accountType: Account["accountType"];
  theme: Account["theme"];
  customGradientStart: string;
  customGradientEnd: string;
  balance: string;
  includeInTotal: boolean;
  showOnHome: boolean;
  creditLimit: string;
  usedCredit: string;
};

type SubscriptionFormState = {
  id?: string;
  name: string;
  amount: string;
  billingCycle: SubscriptionItem["billingCycle"];
  nextDueDate: string;
  linkedPaymentSourceId: string;
  category: string;
  status: SubscriptionItem["status"];
};

type TransferFormState = {
  sourceKey: string;
  destinationKey: string;
  amount: string;
  note: string;
};

type SwipeRevealDeleteRowProps = {
  itemKey: string;
  isOpen: boolean;
  onOpenChange: (itemKey: string | null) => void;
  onDelete: () => void;
  children: ReactNode;
  className?: string;
};
const SWIPE_REVEAL_OFFSET = 76;

function SwipeRevealDeleteRow({ itemKey, isOpen, onOpenChange, onDelete, children, className }: SwipeRevealDeleteRowProps) {
  const gestureRef = useRef<{ x: number; y: number; pointerId: number; active: boolean } | null>(null);
  const dragDistanceRef = useRef(0);
  const suppressClickRef = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const visibleDeleteAction = isOpen || dragOffset < -6;

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    gestureRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
      active: false,
    };
    dragDistanceRef.current = 0;
    suppressClickRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = gestureRef.current;

    if (!start || start.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;

    if (!start.active) {
      const horizontalIntent = Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1;
      if (!horizontalIntent) {
        return;
      }
      start.active = true;
    }

    const nextOffset = Math.min(0, Math.max(-SWIPE_REVEAL_OFFSET, (isOpen ? -SWIPE_REVEAL_OFFSET : 0) + deltaX));
    dragDistanceRef.current = Math.max(dragDistanceRef.current, Math.abs(deltaX));
    suppressClickRef.current = dragDistanceRef.current > 10;
    setDragOffset(nextOffset);
  };

  const finishGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = gestureRef.current;

    if (!start || start.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const finalOffset = dragOffset;
    gestureRef.current = null;
    setDragOffset(0);

    if (!start.active) {
      suppressClickRef.current = false;
      return;
    }

    if (finalOffset < -SWIPE_REVEAL_OFFSET * 0.45) {
      onOpenChange(itemKey);
      suppressClickRef.current = false;
      return;
    }

    onOpenChange(null);
    suppressClickRef.current = false;
  };

  return (
    <div className={cn("relative overflow-hidden rounded-[24px]", className)}>
      {visibleDeleteAction ? (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="h-11 w-11 rounded-full shadow-[0_18px_32px_-22px_rgba(220,38,38,0.55)]"
            onClick={onDelete}
            aria-label="Delete permanently"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </Button>
        </div>
      ) : null}

      <div
        className="relative transition-transform duration-200 ease-out"
        style={{
          transform: `translate3d(${dragOffset || (isOpen ? -SWIPE_REVEAL_OFFSET : 0)}px, 0, 0)`,
          touchAction: "pan-y",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishGesture}
        onPointerCancel={() => {
          gestureRef.current = null;
          setDragOffset(0);
        }}
        onClickCapture={(event) => {
          if (suppressClickRef.current) {
            event.preventDefault();
            event.stopPropagation();
            suppressClickRef.current = false;
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}

const sectionLabels: Array<{ id: WorkspaceSection; label: string }> = [
  { id: "accounts", label: "Accounts" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "transfers", label: "Transfers" },
];

const SUBSCRIPTION_PRESETS: SubscriptionPreset[] = [
  { id: "netflix", name: "Netflix", monogram: "N", category: "Streaming" },
  { id: "spotify", name: "Spotify", monogram: "S", category: "Music" },
  { id: "youtube-premium", name: "YouTube Premium", monogram: "YT", category: "Video" },
  { id: "disney-plus", name: "Disney+", monogram: "D+", category: "Streaming" },
  { id: "apple-music", name: "Apple Music", monogram: "AM", category: "Music" },
  { id: "prime-video", name: "Prime Video", monogram: "PV", category: "Streaming" },
  { id: "icloud", name: "iCloud+", monogram: "IC", category: "Cloud" },
  { id: "chatgpt", name: "ChatGPT Plus", monogram: "CG", category: "AI" },
  { id: "notion", name: "Notion", monogram: "NO", category: "Productivity" },
  { id: "other", name: "Other", monogram: "OT", category: "General" },
];

function defaultAccountForm(): AccountFormState {
  return {
    name: "",
    accountType: "bank_account",
    theme: "default",
    customGradientStart: DEFAULT_CUSTOM_CARD_GRADIENT_START,
    customGradientEnd: DEFAULT_CUSTOM_CARD_GRADIENT_END,
    balance: "",
    includeInTotal: true,
    showOnHome: true,
    creditLimit: "",
    usedCredit: "",
  };
}

function defaultSubscriptionForm(): SubscriptionFormState {
  return {
    name: "",
    amount: "",
    billingCycle: "monthly",
    nextDueDate: new Date().toISOString().split("T")[0],
    linkedPaymentSourceId: "",
    category: "Software",
    status: "active",
  };
}

function defaultTransferForm(): TransferFormState {
  return {
    sourceKey: "",
    destinationKey: "",
    amount: "",
    note: "",
  };
}

function getSubscriptionBrandMeta(name: string) {
  const normalized = name.trim().toLowerCase();
  const matchedPreset = SUBSCRIPTION_PRESETS.find((preset) => preset.id !== "other" && normalized.includes(preset.name.toLowerCase()));

  if (matchedPreset) {
    return {
      wordmark: matchedPreset.name,
      monogram: matchedPreset.monogram,
      descriptor: matchedPreset.category,
    };
  }

  const trimmedName = name.trim() || "Other";
  const compactName = trimmedName.replace(/\s+/g, " ");
  const monogram = compactName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "OT";

  return {
    wordmark: compactName,
    monogram,
    descriptor: "General",
  };
}

export function AccountsWorkspace({ username, onBack, onOpenPremium, initialSection = "accounts" }: AccountsWorkspaceProps) {
  const [userData, setUserData] = useState<UserData>(createDefaultUserData(username));
  const [activeSection, setActiveSection] = useState<WorkspaceSection>(initialSection);
  const [accountDrawerOpen, setAccountDrawerOpen] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountFormState>(defaultAccountForm());
  const [subscriptionDrawerOpen, setSubscriptionDrawerOpen] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState<SubscriptionFormState>(defaultSubscriptionForm());
  const [transferDrawerOpen, setTransferDrawerOpen] = useState(false);
  const [transferForm, setTransferForm] = useState<TransferFormState>(defaultTransferForm());
  const [isSavingTransfer, setIsSavingTransfer] = useState(false);
  const [openDeleteRowKey, setOpenDeleteRowKey] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDeleteState | null>(null);

  useEffect(() => {
    const currentUserData = getUserData(username) ?? createDefaultUserData(username);
    setUserData(currentUserData);

    return subscribeToUserData(username, (nextUserData) => {
      setUserData(nextUserData);
    });
  }, [username]);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const plusAccess = hasPlusAccess(userData);
  const activeAccounts = useMemo(() => getActiveAccounts(userData), [userData]);
  const displayedAccounts = activeAccounts;
  const primaryAccount = useMemo(() => getPrimaryAccount(userData), [userData]);
  const homeAccount = useMemo(() => getHomeDisplayAccount(userData), [userData]);
  const transferTargets = useMemo(() => buildTransferTargets(userData), [userData]);
  const subscriptionBreakdown = useMemo(() => getSubscriptionBreakdown(userData.subscriptions), [userData.subscriptions]);
  const monthlySubscriptionTotal = useMemo(() => getMonthlySubscriptionTotal(userData.subscriptions), [userData.subscriptions]);
  const displayedSubscriptions = userData.subscriptions;
  const selectedSubscriptionPreset = useMemo(() => {
    const normalized = subscriptionForm.name.trim().toLowerCase();
    return SUBSCRIPTION_PRESETS.find((preset) => preset.name.toLowerCase() === normalized) ?? SUBSCRIPTION_PRESETS.find((preset) => preset.id === "other")!;
  }, [subscriptionForm.name]);
  const accountThemePreview = useMemo(
    () =>
      getAccountThemeStyle({
        theme: accountForm.theme,
        customGradientStart: accountForm.customGradientStart,
        customGradientEnd: accountForm.customGradientEnd,
      }),
    [accountForm.customGradientEnd, accountForm.customGradientStart, accountForm.theme],
  );

  const openAccountDrawer = (account?: Account) => {
    if (account) {
      setAccountForm({
        id: account.id,
        name: account.name,
        accountType: account.accountType,
        theme: account.theme,
        customGradientStart:
          account.customColorMode === "black"
            ? "#020304"
            : account.customColorMode === "white"
              ? "#ffffff"
              : account.customGradientStart ?? DEFAULT_CUSTOM_CARD_GRADIENT_START,
        customGradientEnd:
          account.customColorMode === "black"
            ? "#1a202a"
            : account.customColorMode === "white"
              ? "#cfd8e3"
              : account.customGradientEnd ?? DEFAULT_CUSTOM_CARD_GRADIENT_END,
        balance: account.balance.toFixed(2),
        includeInTotal: account.includeInTotal,
        showOnHome: account.showOnHome,
        creditLimit: account.creditLimit.toFixed(2),
        usedCredit: account.usedCredit.toFixed(2),
      });
    } else {
      const draft = createAccountDraft();
      setAccountForm({
        ...defaultAccountForm(),
        name: draft.name,
        accountType: draft.accountType,
        theme: draft.theme,
        customGradientStart: draft.customGradientStart ?? DEFAULT_CUSTOM_CARD_GRADIENT_START,
        customGradientEnd: draft.customGradientEnd ?? DEFAULT_CUSTOM_CARD_GRADIENT_END,
      });
    }

    setAccountDrawerOpen(true);
  };

  const handleSaveAccount = () => {
    const parsedBalance = Number.parseFloat(accountForm.balance || "0");
    const parsedCreditLimit = Number.parseFloat(accountForm.creditLimit || "0");
    const parsedUsedCredit = Number.parseFloat(accountForm.usedCredit || "0");

    if (!accountForm.name.trim()) {
      toast.error("Please enter an account name.");
      return;
    }

    const existing = userData.accounts.find((account) => account.id === accountForm.id) ?? createAccountDraft(accountForm.name.trim());
    const balanceModel = accountForm.accountType === "credit_card" ? "credit" : "standard";
    const now = new Date().toISOString();

    const nextAccount: Account = {
      ...existing,
      name: accountForm.name.trim(),
      accountType: accountForm.accountType,
      theme: accountForm.theme,
      customColorMode: "color",
      customGradientStart: accountForm.customGradientStart,
      customGradientEnd: accountForm.customGradientEnd,
      customColorHue: DEFAULT_CUSTOM_CARD_HUE,
      balanceModel,
      balance: balanceModel === "credit" ? 0 : convertToBaseCurrency(parsedBalance || 0, userData.currencySettings),
      initialBalance: balanceModel === "credit" ? 0 : convertToBaseCurrency(parsedBalance || 0, userData.currencySettings),
      includeInTotal: accountForm.includeInTotal,
      showOnHome: accountForm.showOnHome,
      creditLimit: balanceModel === "credit" ? convertToBaseCurrency(parsedCreditLimit || 0, userData.currencySettings) : 0,
      usedCredit: balanceModel === "credit" ? convertToBaseCurrency(parsedUsedCredit || 0, userData.currencySettings) : 0,
      updatedAt: now,
    };

    const baseNextUserData = updateAccountInUserData(userData, nextAccount);
    const visibleHomeIds = baseNextUserData.accounts
      .filter((account) => !account.archived && account.showOnHome)
      .map((account) => account.id);
    const nextHeroVisibleAccountIds = baseNextUserData.preferences.homeHeroVisibleAccountIds
      .filter((accountId) => visibleHomeIds.includes(accountId));

    if (nextAccount.showOnHome && !nextHeroVisibleAccountIds.includes(nextAccount.id)) {
      nextHeroVisibleAccountIds.push(nextAccount.id);
    }

    const fallbackHeroAccountId =
      nextHeroVisibleAccountIds[0] ||
      visibleHomeIds[0] ||
      baseNextUserData.preferences.homeSelectedAccountId;

    saveUserData(username, {
      ...baseNextUserData,
      preferences: {
        ...baseNextUserData.preferences,
        accountListOrderIds: [...baseNextUserData.preferences.accountListOrderIds.filter((accountId) => accountId !== nextAccount.id), nextAccount.id],
        homeHeroVisibleAccountIds: nextHeroVisibleAccountIds,
        homeSelectedAccountId: nextHeroVisibleAccountIds.includes(baseNextUserData.preferences.homeSelectedAccountId)
          ? baseNextUserData.preferences.homeSelectedAccountId
          : fallbackHeroAccountId,
      },
    });
    setAccountDrawerOpen(false);
    setAccountForm(defaultAccountForm());
    toast.success(accountForm.id ? "Account updated" : "Account created");
  };

  const handleSaveSubscription = () => {
    if (!subscriptionForm.name.trim()) {
      toast.error("Please enter a subscription name.");
      return;
    }

    const amount = Number.parseFloat(subscriptionForm.amount || "0");
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid subscription amount.");
      return;
    }

    const now = new Date().toISOString();
    const nextSubscription: SubscriptionItem = {
      id: subscriptionForm.id || generateEntityId("subscription"),
      name: subscriptionForm.name.trim(),
      amount: convertToBaseCurrency(amount, userData.currencySettings),
      billingCycle: subscriptionForm.billingCycle,
      nextDueDate: new Date(subscriptionForm.nextDueDate).toISOString(),
      linkedPaymentSourceId: subscriptionForm.linkedPaymentSourceId,
      category: subscriptionForm.category.trim() || "General",
      status: subscriptionForm.status,
      createdAt: now,
      updatedAt: now,
    };

    const nextSubscriptions = userData.subscriptions.some((subscription) => subscription.id === nextSubscription.id)
      ? userData.subscriptions.map((subscription) => (subscription.id === nextSubscription.id ? nextSubscription : subscription))
      : [nextSubscription, ...userData.subscriptions];

    saveUserData(username, {
      ...userData,
      subscriptions: nextSubscriptions,
      preferences: {
        ...userData.preferences,
          subscriptionListOrderIds: userData.preferences.subscriptionListOrderIds,
      },
    });

    setSubscriptionDrawerOpen(false);
    setSubscriptionForm(defaultSubscriptionForm());
    toast.success(subscriptionForm.id ? "Subscription updated" : "Subscription added");
  };

  const handleSubmitTransfer = async () => {
    const amount = Number.parseFloat(transferForm.amount || "0");
    if (!transferForm.sourceKey || !transferForm.destinationKey) {
      toast.error("Select both a source and destination.");
      return;
    }

    if (transferForm.sourceKey === transferForm.destinationKey) {
      toast.error("Choose different accounts for the transfer.");
      return;
    }

    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid transfer amount.");
      return;
    }

    setIsSavingTransfer(true);
    try {
      const nextUserData = applyLocalTransfer(userData, {
        sourceKey: transferForm.sourceKey,
        destinationKey: transferForm.destinationKey,
        amount: convertToBaseCurrency(amount, userData.currencySettings),
        note: transferForm.note,
      });
      saveUserData(username, nextUserData);
      setTransferDrawerOpen(false);
      setTransferForm(defaultTransferForm());
      toast.success("Transfer completed");
    } finally {
      setIsSavingTransfer(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!pendingDelete) {
      return;
    }

    if (pendingDelete.type === "account") {
      if (pendingDelete.id === primaryAccount.id) {
        toast.error("The main Expy account cannot be deleted.");
        setPendingDelete(null);
        setOpenDeleteRowKey(null);
        return;
      }

      const nextAccounts = userData.accounts.filter((account) => account.id !== pendingDelete.id);
      const visibleHomeAccounts = nextAccounts.filter((account) => !account.archived && account.showOnHome);
      const nextHeroVisibleAccountIds = userData.preferences.homeHeroVisibleAccountIds.filter((accountId) =>
        visibleHomeAccounts.some((account) => account.id === accountId),
      );
      const fallbackHomeAccountId = nextHeroVisibleAccountIds[0] || visibleHomeAccounts[0]?.id || primaryAccount.id;
      const timestamp = new Date().toISOString();

      saveUserData(username, {
        ...userData,
        accounts: nextAccounts,
        subscriptions: userData.subscriptions.map((subscription) =>
          subscription.linkedPaymentSourceId === pendingDelete.id
            ? { ...subscription, linkedPaymentSourceId: "", updatedAt: timestamp }
            : subscription,
        ),
        preferences: {
          ...userData.preferences,
          accountListOrderIds: userData.preferences.accountListOrderIds.filter((accountId) => accountId !== pendingDelete.id),
          homeHeroVisibleAccountIds: nextHeroVisibleAccountIds,
          homeSelectedAccountId: nextHeroVisibleAccountIds.includes(userData.preferences.homeSelectedAccountId)
            ? userData.preferences.homeSelectedAccountId
            : fallbackHomeAccountId,
        },
      });

      toast.success("Account deleted permanently");
    } else {
      saveUserData(username, {
        ...userData,
        subscriptions: userData.subscriptions.filter((subscription) => subscription.id !== pendingDelete.id),
        preferences: {
          ...userData.preferences,
          subscriptionListOrderIds: userData.preferences.subscriptionListOrderIds.filter((subscriptionId) => subscriptionId !== pendingDelete.id),
        },
      });
      toast.success("Subscription deleted permanently");
    }

    setPendingDelete(null);
    setOpenDeleteRowKey(null);
  };

  return (
    <div className="page-shell">
      <MoreDetailHeader
        eyebrow="Accounts"
        title="Accounts"
        subtitle="Manage account types, subscription tracking, and money movement without mixing them with Custom Wallets."
        onBack={onBack}
        actions={
          <Button variant="outline" onClick={() => openAccountDrawer()}>
            <Plus className="mr-1 h-4 w-4" />
            Add Account
          </Button>
        }
      />

      <Card className="hero-card border-0">
        <CardContent className="relative space-y-5 overflow-hidden pt-5">
          <div className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-white/8 blur-2xl" />
          <div>
            <div>
              <p className="text-sm text-primary-foreground/72">Balance</p>
              <p className="mt-2 text-[2.2rem] font-semibold tracking-[-0.05em] text-primary-foreground">
                {formatUserCurrency(homeAccount.balanceModel === "credit" ? getAccountAvailableAmount(homeAccount) : homeAccount.balance, userData.currencySettings)}
              </p>
              <p className="mt-1 text-sm text-primary-foreground/72">{homeAccount.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {sectionLabels.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            className={`filter-chip ${activeSection === section.id ? "filter-chip-active" : ""}`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {activeSection === "accounts" && (
        <section className="space-y-4">
          <div className="space-y-4">
            {displayedAccounts.map((account) => {
              const providerLabel = account.theme === "custom_card" || account.accountType === "cash" ? account.name : ACCOUNT_THEME_STYLES[account.theme].label;
              const rowKey = `account:${account.id}`;
              const deleteDisabled = account.id === primaryAccount.id;

              return (
                deleteDisabled ? (
                  <AccountSurfaceCard
                    key={account.id}
                    account={account}
                    currencySettings={userData.currencySettings}
                    brandLabel={providerLabel}
                    forceChip={account.id === primaryAccount.id && account.accountType === "cash"}
                    interactive
                    onClick={() => openAccountDrawer(account)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openAccountDrawer(account);
                      }
                    }}
                  />
                ) : (
                  <SwipeRevealDeleteRow
                    key={account.id}
                    itemKey={rowKey}
                    isOpen={openDeleteRowKey === rowKey}
                    onOpenChange={setOpenDeleteRowKey}
                    onDelete={() => setPendingDelete({ type: "account", id: account.id, label: account.name })}
                  >
                    <AccountSurfaceCard
                      account={account}
                      currencySettings={userData.currencySettings}
                      brandLabel={providerLabel}
                      forceChip={account.id === primaryAccount.id && account.accountType === "cash"}
                      interactive
                      onClick={() => {
                        if (openDeleteRowKey === rowKey) {
                          setOpenDeleteRowKey(null);
                          return;
                        }

                        openAccountDrawer(account);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();

                          if (openDeleteRowKey === rowKey) {
                            setOpenDeleteRowKey(null);
                            return;
                          }

                          openAccountDrawer(account);
                        }
                      }}
                    />
                  </SwipeRevealDeleteRow>
                )
              );
            })}
          </div>

        </section>
      )}

      {activeSection === "subscriptions" && (
        plusAccess ? (
          <section className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="muted-tile">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Monthly Total</p>
                <p className="mt-2 text-lg font-semibold">{formatUserCurrency(monthlySubscriptionTotal, userData.currencySettings)}</p>
              </div>
              <div className="muted-tile">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Upcoming</p>
                <p className="mt-2 text-lg font-semibold">{subscriptionBreakdown.upcoming.length}</p>
              </div>
            </div>

            <Button onClick={() => setSubscriptionDrawerOpen(true)} className="w-full">
              <Plus className="mr-1 h-4 w-4" />
              Add Subscription
            </Button>

            {userData.subscriptions.length === 0 ? (
              <div className="app-empty-state text-sm text-muted-foreground">
                No subscriptions yet. Add streaming apps, software, or recurring services to track renewal pressure.
              </div>
            ) : (
              <div className="space-y-3">
                {displayedSubscriptions.map((subscription) => {
                  const linkedAccount = userData.accounts.find((account) => account.id === subscription.linkedPaymentSourceId);
                  const brandMeta = getSubscriptionBrandMeta(subscription.name);
                  const rowKey = `subscription:${subscription.id}`;

                  return (
                    <SwipeRevealDeleteRow
                      key={subscription.id}
                      itemKey={rowKey}
                      isOpen={openDeleteRowKey === rowKey}
                      onOpenChange={setOpenDeleteRowKey}
                      onDelete={() => setPendingDelete({ type: "subscription", id: subscription.id, label: subscription.name })}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (openDeleteRowKey === rowKey) {
                            setOpenDeleteRowKey(null);
                            return;
                          }

                          setSubscriptionForm({
                            id: subscription.id,
                            name: subscription.name,
                            amount: subscription.amount.toFixed(2),
                            billingCycle: subscription.billingCycle,
                            nextDueDate: subscription.nextDueDate.split("T")[0],
                            linkedPaymentSourceId: subscription.linkedPaymentSourceId,
                            category: subscription.category,
                            status: subscription.status,
                          });
                          setSubscriptionDrawerOpen(true);
                        }}
                        className="w-full rounded-[24px] border border-border/70 bg-card/92 px-4 py-4 text-left shadow-[0_16px_32px_-28px_rgba(15,23,42,0.12)] transition-colors hover:bg-accent/20"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-border/70 bg-background text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
                              {brandMeta.monogram}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-base font-semibold tracking-[-0.02em]">{brandMeta.wordmark}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{brandMeta.descriptor}</p>
                              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                <span>{subscription.billingCycle.toUpperCase()}</span>
                                <span>{new Date(subscription.nextDueDate).toLocaleDateString()}</span>
                                <span>{linkedAccount ? linkedAccount.name : "No payment source"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-base font-semibold">{formatUserCurrency(subscription.amount, userData.currencySettings)}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">{subscription.status}</p>
                          </div>
                        </div>
                      </button>
                    </SwipeRevealDeleteRow>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <LockedFeatureCard
            title="Subscription Tracker"
            description="Track renewals, totals, and linked payment sources with an ExPlus subscription workspace."
            planLabel="ExPlus"
          />
        )
      )}

      {activeSection === "transfers" && (
        <section className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Flow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-muted-foreground">
                Move money between accounts, Custom Wallets, and Savings while keeping History and totals aligned.
              </p>
              <Button className="w-full" onClick={() => setTransferDrawerOpen(true)}>
                <ArrowLeftRight className="mr-1 h-4 w-4" />
                New Transfer
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {transferTargets.map((target) => (
              <div key={target.id} className="app-list-row flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="app-list-icon">
                    {target.type === "account" ? <Landmark className="h-4 w-4 text-primary" /> : target.type === "wallet" ? <WalletCards className="h-4 w-4 text-primary" /> : <CreditCard className="h-4 w-4 text-primary" />}
                  </div>
                  <div>
                    <p className="app-list-title">{target.label}</p>
                    <p className="app-list-meta">{target.helper}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                  setTransferForm((current) => ({ ...current, destinationKey: target.id }));
                  setTransferDrawerOpen(true);
                }}>
                  Use
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <Drawer open={accountDrawerOpen} onOpenChange={setAccountDrawerOpen}>
        <DrawerContent className="max-h-[min(80dvh,720px)]">
          <DrawerHeader>
            <DrawerTitle>{accountForm.id ? "Edit Account" : "Create Account"}</DrawerTitle>
            <DrawerDescription>Only the fields needed to save the account.</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-4">
            <div className="space-y-2">
              <Label htmlFor="account-name">Account name</Label>
              <Input id="account-name" value={accountForm.name} onChange={(event) => setAccountForm((current) => ({ ...current, name: event.target.value }))} placeholder="Main card, Payroll, GCash..." />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="account-type">Account type</Label>
                <Select value={accountForm.accountType} onValueChange={(value) => setAccountForm((current) => ({ ...current, accountType: value as Account["accountType"] }))}>
                  <SelectTrigger id="account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-balance">{accountForm.accountType === "credit_card" ? "Outstanding paid amount" : "Balance"}</Label>
                <Input id="account-balance" type="number" step="0.01" value={accountForm.balance} onChange={(event) => setAccountForm((current) => ({ ...current, balance: event.target.value }))} />
              </div>
            </div>

            {accountForm.accountType === "credit_card" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="credit-limit">Credit limit</Label>
                  <Input id="credit-limit" type="number" step="0.01" value={accountForm.creditLimit} onChange={(event) => setAccountForm((current) => ({ ...current, creditLimit: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="used-credit">Used credit</Label>
                  <Input id="used-credit" type="number" step="0.01" value={accountForm.usedCredit} onChange={(event) => setAccountForm((current) => ({ ...current, usedCredit: event.target.value }))} />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="account-theme">Card theme</Label>
              <Select value={accountForm.theme} onValueChange={(value) => setAccountForm((current) => ({ ...current, theme: value as Account["theme"] }))}>
                <SelectTrigger id="account-theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCOUNT_THEME_STYLES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {accountForm.theme === "custom_card" && (
              <div className="space-y-4 rounded-[22px] border border-border/70 bg-card/80 px-4 py-4">
                <div>
                  <p className="app-list-title">Custom card color</p>
                  <p className="app-list-meta">Choose your gradient start and end colors directly.</p>
                </div>
                <div className="h-24 rounded-[22px] border border-white/10 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.46)]" style={accountThemePreview.previewStyle} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="custom-gradient-start">Gradient start</Label>
                    <div className="flex items-center gap-3 rounded-[18px] border border-border/70 bg-background px-3 py-2">
                      <input
                        id="custom-gradient-start"
                        type="color"
                        value={accountForm.customGradientStart}
                        onChange={(event) => setAccountForm((current) => ({ ...current, customGradientStart: event.target.value }))}
                        className="h-10 w-10 appearance-none rounded-full border-0 bg-transparent p-0 shadow-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0"
                      />
                      <span className="text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">{accountForm.customGradientStart}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-gradient-end">Gradient end</Label>
                    <div className="flex items-center gap-3 rounded-[18px] border border-border/70 bg-background px-3 py-2">
                      <input
                        id="custom-gradient-end"
                        type="color"
                        value={accountForm.customGradientEnd}
                        onChange={(event) => setAccountForm((current) => ({ ...current, customGradientEnd: event.target.value }))}
                        className="h-10 w-10 appearance-none rounded-full border-0 bg-transparent p-0 shadow-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0"
                      />
                      <span className="text-sm font-medium uppercase tracking-[0.08em] text-muted-foreground">{accountForm.customGradientEnd}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 rounded-[22px] border border-border/70 bg-card/80 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="app-list-title">Show on home</p>
                  <p className="app-list-meta">Use this account as a selectable home hero source.</p>
                </div>
                <Switch checked={accountForm.showOnHome} onCheckedChange={(checked) => setAccountForm((current) => ({ ...current, showOnHome: checked }))} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="app-list-title">Include in total balance</p>
                  <p className="app-list-meta">Affects Total Balance hero mode and summary totals.</p>
                </div>
                <Switch checked={accountForm.includeInTotal} onCheckedChange={(checked) => setAccountForm((current) => ({ ...current, includeInTotal: checked }))} />
              </div>
            </div>
          </div>
          <DrawerFooter className="sticky bottom-0 border-t border-border/70 bg-card/96 px-5 pt-3 backdrop-blur">
            <Button onClick={handleSaveAccount} className="w-full">Save Account</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => {
        if (!open) {
          setPendingDelete(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `Delete ${pendingDelete.label} permanently? This cannot be recovered.`
                : "Delete this item permanently? This cannot be recovered."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Drawer open={subscriptionDrawerOpen} onOpenChange={setSubscriptionDrawerOpen}>
        <DrawerContent className="max-h-[min(80dvh,720px)]">
          <DrawerHeader>
            <DrawerTitle>{subscriptionForm.id ? "Edit Subscription" : "Add Subscription"}</DrawerTitle>
            <DrawerDescription>Pick a service first, then fill in the payment details.</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-4">
            <div className="space-y-2">
              <Label>Service</Label>
              <div className="grid grid-cols-2 gap-2.5">
                {SUBSCRIPTION_PRESETS.map((preset) => {
                  const selected = selectedSubscriptionPreset.id === preset.id || (preset.id === "other" && !SUBSCRIPTION_PRESETS.some((item) => item.id !== "other" && item.name.toLowerCase() === subscriptionForm.name.trim().toLowerCase()));

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSubscriptionForm((current) => ({
                        ...current,
                        name: preset.id === "other" ? current.name && selectedSubscriptionPreset.id === "other" ? current.name : "" : preset.name,
                        category: preset.category,
                      }))}
                      className={`flex items-center gap-3 rounded-[18px] border px-3 py-3 text-left transition-colors ${selected ? "border-foreground bg-foreground text-background" : "border-border/70 bg-card/90 hover:bg-accent"}`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border text-[11px] font-semibold uppercase tracking-[0.14em] ${selected ? "border-white/16 bg-white/10 text-background" : "border-border/70 bg-background text-foreground"}`}>
                        {preset.monogram}
                      </div>
                      <span className="truncate text-sm font-medium">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription-name">Name</Label>
              <Input id="subscription-name" value={subscriptionForm.name} onChange={(event) => setSubscriptionForm((current) => ({ ...current, name: event.target.value }))} placeholder="Netflix, Spotify, Other..." />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subscription-amount">Amount</Label>
                <Input id="subscription-amount" type="number" step="0.01" value={subscriptionForm.amount} onChange={(event) => setSubscriptionForm((current) => ({ ...current, amount: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscription-cycle">Billing cycle</Label>
                <Select value={subscriptionForm.billingCycle} onValueChange={(value) => setSubscriptionForm((current) => ({ ...current, billingCycle: value as SubscriptionItem["billingCycle"] }))}>
                  <SelectTrigger id="subscription-cycle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subscription-due">Next due date</Label>
                <Input id="subscription-due" type="date" value={subscriptionForm.nextDueDate} onChange={(event) => setSubscriptionForm((current) => ({ ...current, nextDueDate: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscription-source">Linked payment source</Label>
                <Select value={subscriptionForm.linkedPaymentSourceId} onValueChange={(value) => setSubscriptionForm((current) => ({ ...current, linkedPaymentSourceId: value }))}>
                  <SelectTrigger id="subscription-source">
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="subscription-status">Status</Label>
                <Select value={subscriptionForm.status} onValueChange={(value) => setSubscriptionForm((current) => ({ ...current, status: value as SubscriptionItem["status"] }))}>
                  <SelectTrigger id="subscription-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>
          <DrawerFooter className="sticky bottom-0 border-t border-border/70 bg-card/96 px-5 pt-3 backdrop-blur">
            <Button onClick={handleSaveSubscription} className="w-full">Save Subscription</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={transferDrawerOpen} onOpenChange={setTransferDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Transfer Money</DrawerTitle>
            <DrawerDescription>Move value between accounts, Custom Wallets, and Savings.</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-5 pb-5">
            <div className="space-y-2">
              <Label htmlFor="transfer-source">Source</Label>
              <Select value={transferForm.sourceKey} onValueChange={(value) => setTransferForm((current) => ({ ...current, sourceKey: value }))}>
                <SelectTrigger id="transfer-source">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {transferTargets.map((target) => (
                    <SelectItem key={`source-${target.id}`} value={target.id}>
                      {target.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-destination">Destination</Label>
              <Select value={transferForm.destinationKey} onValueChange={(value) => setTransferForm((current) => ({ ...current, destinationKey: value }))}>
                <SelectTrigger id="transfer-destination">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {transferTargets.map((target) => (
                    <SelectItem key={`destination-${target.id}`} value={target.id}>
                      {target.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="transfer-amount">Amount</Label>
                <Input id="transfer-amount" type="number" step="0.01" value={transferForm.amount} onChange={(event) => setTransferForm((current) => ({ ...current, amount: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-note">Note</Label>
                <Input id="transfer-note" value={transferForm.note} onChange={(event) => setTransferForm((current) => ({ ...current, note: event.target.value }))} placeholder="Optional note" />
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={() => void handleSubmitTransfer()} disabled={isSavingTransfer}>
              {isSavingTransfer ? "Saving..." : "Confirm Transfer"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
