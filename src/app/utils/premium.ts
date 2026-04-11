import type {
  PaymentMethod,
  PaymentSubmission,
  PremiumClientStatus,
  SubscriptionItem,
  SupportConcernType,
  UserData,
  UserPlan,
} from "../App";

export const EXPLUS_PRICE = 99;
export const EXPRO_PRICE = 149;
export const EXPRO_UPGRADE_PRICE = 50;

export const PLAN_COPY: Record<UserPlan, { label: string; badge: string | null }> = {
  free: { label: "Expy", badge: null },
  plus: { label: "ExPlus", badge: "PLUS" },
  pro: { label: "ExPro", badge: "PRO" },
};

export const EXPLUS_FEATURES = [
  "Custom card themes",
  "Debit / credit / e-wallet account styling",
  "Subscription tracker",
  "Advanced summaries",
  "Home display chooser",
];

export const EXPRO_FEATURES = [
  "Everything in ExPlus",
  "AI-powered insights surfaces",
  "Spending heatmap calendar",
  "Future smart recommendations",
];

export const PAYMENT_METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string; helper: string }> = [
  { value: "maya", label: "Maya", helper: "Use your Maya app to scan or send payment." },
  { value: "bdo_pay", label: "BDO Pay", helper: "Open BDO Pay and complete the transfer externally." },
  { value: "gcash", label: "GCash", helper: "Pay through GCash, then paste the reference number below." },
];

export const SUPPORT_CONCERN_OPTIONS: Array<{ value: SupportConcernType; label: string }> = [
  { value: "payment_concern", label: "Payment Concern" },
  { value: "upgrade_concern", label: "Upgrade Concern" },
  { value: "account_concern", label: "Account Concern" },
  { value: "bug_report", label: "Bug Report" },
  { value: "other", label: "Other" },
];

export function hasPlusAccess(userData: UserData) {
  return userData.plan === "plus" || userData.plan === "pro";
}

export function hasProAccess(userData: UserData) {
  return userData.plan === "pro";
}

export function getResolvedUserPlan(userData: Pick<UserData, "username" | "plan">, submissions: PaymentSubmission[]): UserPlan {
  const approvedPlans = submissions
    .filter((submission) => submission.userId === userData.username && submission.status === "approved")
    .map((submission) => submission.requestedPlan);

  if (userData.plan === "pro" || approvedPlans.includes("pro")) {
    return "pro";
  }

  if (userData.plan === "plus" || approvedPlans.includes("plus")) {
    return "plus";
  }

  return "free";
}

export function getExProDisplayPrice(userData: UserData) {
  return userData.plan === "plus" ? EXPRO_UPGRADE_PRICE : EXPRO_PRICE;
}

export function getPremiumClientStatus(userData: UserData, submissions: PaymentSubmission[]): PremiumClientStatus {
  if (getResolvedUserPlan(userData, submissions) !== "free") {
    return "active";
  }

  const latestExPlus = submissions
    .filter((submission) => submission.userId === userData.username && submission.requestedPlan === "plus")
    .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime())[0];

  if (!latestExPlus) {
    return "not_purchased";
  }

  if (latestExPlus.status === "rejected") {
    return "rejected";
  }

  if (latestExPlus.status === "approved") {
    return "active";
  }

  return "verifying";
}

export function getMonthlySubscriptionTotal(subscriptions: SubscriptionItem[]) {
  return subscriptions
    .filter((subscription) => subscription.status === "active")
    .reduce((sum, subscription) => {
      switch (subscription.billingCycle) {
        case "weekly":
          return sum + subscription.amount * 4;
        case "monthly":
          return sum + subscription.amount;
        case "quarterly":
          return sum + subscription.amount / 3;
        case "yearly":
          return sum + subscription.amount / 12;
        default:
          return sum + subscription.amount;
      }
    }, 0);
}
