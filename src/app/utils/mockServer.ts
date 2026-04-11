import type {
  PaymentMethod,
  PaymentSubmission,
  PaymentSubmissionStatus,
  SupportConcernType,
  SupportMessage,
  SupportMessageStatus,
  UserPlan,
} from "../App";
import { getUserData, getStoredUsers, saveUserData, writeStoredUsers } from "./userData";

const PAYMENT_STORAGE_KEY = "expy_payment_submissions";
const SUPPORT_STORAGE_KEY = "expy_support_messages";
const PAYMENT_EVENT = "expy:payments-updated";
const SUPPORT_EVENT = "expy:support-updated";
const LOCAL_LATENCY_MS = 160;

function delay() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, LOCAL_LATENCY_MS);
  });
}

function emitWindowEvent(name: string) {
  window.dispatchEvent(new CustomEvent(name));
}

function readArray<T>(key: string): T[] {
  const payload = localStorage.getItem(key);
  if (!payload) return [];

  try {
    return JSON.parse(payload) as T[];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, value: T[], eventName: string) {
  localStorage.setItem(key, JSON.stringify(value));
  emitWindowEvent(eventName);
}

export function listPaymentSubmissions() {
  return readArray<PaymentSubmission>(PAYMENT_STORAGE_KEY).sort(
    (left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime(),
  );
}

export function listSupportMessages() {
  return readArray<SupportMessage>(SUPPORT_STORAGE_KEY).sort(
    (left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime(),
  );
}

export function subscribeToPayments(onChange: (submissions: PaymentSubmission[]) => void) {
  const handleChange = () => onChange(listPaymentSubmissions());
  const handleStorage = (event: StorageEvent) => {
    if (event.key === PAYMENT_STORAGE_KEY) {
      onChange(listPaymentSubmissions());
    }
  };

  window.addEventListener(PAYMENT_EVENT, handleChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(PAYMENT_EVENT, handleChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export function subscribeToSupportMessages(onChange: (messages: SupportMessage[]) => void) {
  const handleChange = () => onChange(listSupportMessages());
  const handleStorage = (event: StorageEvent) => {
    if (event.key === SUPPORT_STORAGE_KEY) {
      onChange(listSupportMessages());
    }
  };

  window.addEventListener(SUPPORT_EVENT, handleChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(SUPPORT_EVENT, handleChange);
    window.removeEventListener("storage", handleStorage);
  };
}

export async function submitPaymentSubmission(input: {
  userId: string;
  requestedPlan: Exclude<UserPlan, "free">;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
}) {
  await delay();

  const submissions = listPaymentSubmissions();
  const nextSubmission: PaymentSubmission = {
    id: `payment-${Date.now()}`,
    userId: input.userId,
    requestedPlan: input.requestedPlan,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    referenceNumber: input.referenceNumber,
    status: "verifying",
    submittedAt: new Date().toISOString(),
  };

  writeArray(PAYMENT_STORAGE_KEY, [nextSubmission, ...submissions], PAYMENT_EVENT);
  return nextSubmission;
}

function updateUserPlan(userId: string, plan: UserPlan) {
  const currentUser = getUserData(userId);
  if (!currentUser) return;

  saveUserData(userId, {
    ...currentUser,
    plan,
  });
}

export async function reviewPaymentSubmission(input: {
  submissionId: string;
  status: Extract<PaymentSubmissionStatus, "approved" | "rejected">;
  reviewedBy: string;
  adminNote?: string;
}) {
  await delay();

  const submissions = listPaymentSubmissions();
  let reviewedSubmission: PaymentSubmission | null = null;

  const nextSubmissions = submissions.map((submission) => {
    if (submission.id !== input.submissionId) return submission;

    reviewedSubmission = {
      ...submission,
      status: input.status,
      reviewedBy: input.reviewedBy,
      adminNote: input.adminNote?.trim() || undefined,
      reviewedAt: new Date().toISOString(),
    };

    return reviewedSubmission;
  });

  if (!reviewedSubmission) {
    throw new Error("Unable to locate the selected payment submission.");
  }

  writeArray(PAYMENT_STORAGE_KEY, nextSubmissions, PAYMENT_EVENT);

  if (input.status === "approved") {
    updateUserPlan(reviewedSubmission.userId, reviewedSubmission.requestedPlan);
  }

  return reviewedSubmission;
}

export async function submitSupportMessage(input: {
  userId: string;
  concernType: SupportConcernType;
  subject: string;
  message: string;
  referenceNumber?: string;
}) {
  await delay();

  const messages = listSupportMessages();
  const nextMessage: SupportMessage = {
    id: `support-${Date.now()}`,
    userId: input.userId,
    concernType: input.concernType,
    subject: input.subject,
    message: input.message,
    referenceNumber: input.referenceNumber?.trim() || undefined,
    status: "unread",
    submittedAt: new Date().toISOString(),
  };

  writeArray(SUPPORT_STORAGE_KEY, [nextMessage, ...messages], SUPPORT_EVENT);
  return nextMessage;
}

export async function updateSupportMessageStatus(input: { messageId: string; status: SupportMessageStatus }) {
  await delay();

  const messages = listSupportMessages();
  const nextMessages = messages.map((message) =>
    message.id === input.messageId ? { ...message, status: input.status } : message,
  );

  writeArray(SUPPORT_STORAGE_KEY, nextMessages, SUPPORT_EVENT);
  return nextMessages.find((message) => message.id === input.messageId) ?? null;
}

export function seedAdminFriendlyDemoState() {
  const users = getStoredUsers();
  const demoUser = users.demouser;

  if (!demoUser) return;

  if (demoUser.plan !== "free") {
    return;
  }

  users.demouser = {
    ...demoUser,
    plan: "free",
  };

  writeStoredUsers(users);
}
