import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import type { PaymentMethod, PaymentSubmission, UserData } from "../App";
import {
  EXPLUS_FEATURES,
  EXPLUS_PRICE,
  EXPRO_FEATURES,
  EXPRO_PRICE,
  PAYMENT_METHOD_OPTIONS,
  getExProDisplayPrice,
  getPremiumClientStatus,
} from "../utils/premium";
import { listPaymentSubmissions, submitPaymentSubmission, subscribeToPayments } from "../utils/mockServer";
import { createDefaultUserData, getUserData, subscribeToUserData } from "../utils/userData";
import { MoreDetailHeader } from "./MoreDetailHeader";
import { PlanBadge } from "./PlanBadge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";

type PremiumPageProps = {
  username: string;
  onBack: () => void;
};

function getPaymentMethodTheme(method: PaymentMethod) {
  switch (method) {
    case "maya":
      return {
        chip: "border-[#11926d]/22 bg-[#11926d]/8 text-[#0f7d5d] dark:text-[#79e1bf]",
        panel: "border-[#11926d]/20",
      };
    case "bdo_pay":
      return {
        chip: "border-[#1557b0]/22 bg-[#1557b0]/8 text-[#114894] dark:text-[#7ab6ff]",
        panel: "border-[#1557b0]/20",
      };
    case "gcash":
    default:
      return {
        chip: "border-[#2563eb]/22 bg-[#2563eb]/8 text-[#1d4ed8] dark:text-[#8cb4ff]",
        panel: "border-[#2563eb]/20",
      };
  }
}

function PaymentQrPlaceholder({ method }: { method: PaymentMethod }) {
  const option = PAYMENT_METHOD_OPTIONS.find((item) => item.value === method)!;
  const theme = getPaymentMethodTheme(method);

  return (
    <div className={`overflow-hidden rounded-[28px] border bg-card/98 shadow-[0_20px_38px_-32px_rgba(15,23,42,0.22)] ${theme.panel}`}>
      <div className="px-5 py-5">
        <p className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${theme.chip}`}>
          {option.label}
        </p>
        <p className="mt-4 text-[1.05rem] font-semibold tracking-[-0.02em]">Scan to pay</p>
        <p className="mt-1 max-w-[18rem] text-sm leading-6 text-muted-foreground">{option.helper}</p>
      </div>

      <div className="grid place-items-center px-5 pb-5">
        <div className="grid h-48 w-full place-items-center rounded-[24px] border border-border/70 bg-background">
          <div className="grid grid-cols-6 gap-1 rounded-[20px] bg-white p-3">
            {Array.from({ length: 36 }).map((_, index) => (
              <div key={index} className={`h-4 w-4 rounded-[4px] ${index % 3 === 0 ? "bg-black" : "bg-black/18"}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanFeatureList({ features }: { features: string[] }) {
  return (
    <div className="space-y-2.5">
      {features.map((feature) => (
        <div key={feature} className="flex items-center gap-3 rounded-[20px] border border-border/70 bg-card/92 px-4 py-3.5 shadow-[0_14px_32px_-28px_rgba(15,23,42,0.12)]">
            <div className="app-list-icon">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
          <p className="text-sm font-medium tracking-[-0.01em]">{feature}</p>
        </div>
      ))}
    </div>
  );
}

export function PremiumPage({ username, onBack }: PremiumPageProps) {
  const [userData, setUserData] = useState<UserData>(createDefaultUserData(username));
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("maya");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activationAnnounced, setActivationAnnounced] = useState(false);
  useEffect(() => {
    const currentUserData = getUserData(username) ?? createDefaultUserData(username);
    setUserData(currentUserData);
    setSubmissions(listPaymentSubmissions());

    const unsubscribeUser = subscribeToUserData(username, (nextUserData) => {
      setUserData(nextUserData);
    });

    const unsubscribePayments = subscribeToPayments((nextSubmissions) => {
      setSubmissions(nextSubmissions);
    });

    return () => {
      unsubscribeUser();
      unsubscribePayments();
    };
  }, [username]);

  const clientStatus = useMemo(() => getPremiumClientStatus(userData, submissions), [submissions, userData]);
  const latestSubmission = useMemo(
    () =>
      submissions
        .filter((submission) => submission.userId === username && submission.requestedPlan === "plus")
        .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime())[0] ?? null,
    [submissions, username],
  );

  useEffect(() => {
    if (clientStatus === "active" && latestSubmission?.reviewedAt && !activationAnnounced) {
      toast.success(userData.plan === "pro" ? "ExPro Activated" : "ExPlus Activated");
      setActivationAnnounced(true);
    }
  }, [activationAnnounced, clientStatus, latestSubmission?.reviewedAt, userData.plan]);

  const handleSubmit = async () => {
    if (!referenceNumber.trim()) {
      toast.error("Paste the payment reference number first.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPaymentSubmission({
        userId: username,
        requestedPlan: "plus",
        amount: EXPLUS_PRICE,
        paymentMethod,
        referenceNumber: referenceNumber.trim(),
      });
      setReferenceNumber("");
      toast.success("Your payment is now being verified.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit payment right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const exPlusBadge =
    clientStatus === "active"
      ? "Owned"
      : clientStatus === "verifying"
        ? "Verifying"
        : clientStatus === "rejected"
          ? "Rejected"
          : "₱99 one-time";

  return (
    <div className="page-shell">
      <MoreDetailHeader
        eyebrow="Premium"
        title="Premium"
        subtitle="A cleaner premium layer for account controls, subscriptions, and advanced summaries."
        onBack={onBack}
        actions={<PlanBadge plan={userData.plan} />}
      />

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">ExPlus</p>
            <h2 className="text-[2rem] font-semibold tracking-[-0.05em]">
              {userData.plan === "free" ? "Upgrade once." : userData.plan === "plus" ? "ExPlus is active." : "ExPro is active."}
            </h2>
            <p className="max-w-[30rem] text-sm leading-6 text-muted-foreground">
              Unlock account customization, subscription tracking, and richer summaries without changing the base flow of the app.
            </p>
          </div>

          <div className="space-y-2 rounded-[24px] border border-border/70 bg-muted/16 px-4 py-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Current tier</span>
              <span className="font-semibold">{userData.plan === "free" ? "Free" : userData.plan === "plus" ? "ExPlus" : "ExPro"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="font-semibold">{clientStatus === "not_purchased" ? "No request yet" : clientStatus === "verifying" ? "Verifying" : clientStatus === "rejected" ? "Rejected" : "Activated"}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Price</span>
              <span className="font-semibold">₱{EXPLUS_PRICE} one-time</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[1.02rem] font-semibold tracking-[-0.02em]">ExPlus</h3>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                  clientStatus === "active"
                    ? "border-emerald-500/18 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : clientStatus === "verifying"
                      ? "border-amber-500/18 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      : clientStatus === "rejected"
                        ? "border-red-500/18 bg-red-500/10 text-red-700 dark:text-red-300"
                        : "border-border/70 bg-muted/22 text-muted-foreground"
                }`}>{exPlusBadge}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">One-time upgrade with card themes, subscriptions, advanced summaries, and home display controls.</p>
            </div>
          </div>

          <PlanFeatureList features={EXPLUS_FEATURES} />

          {clientStatus === "active" ? (
            <div className="rounded-[24px] border border-emerald-500/18 bg-emerald-500/10 px-4 py-4 text-sm leading-6 text-emerald-700 dark:text-emerald-300">
              ExPlus Activated. Your account has been successfully upgraded.
            </div>
          ) : (
            <div className="space-y-5 rounded-[28px] border border-border/70 bg-card/88 px-5 py-5 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.18)]">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Payment method</p>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHOD_OPTIONS.map((option) => {
                    const selected = option.value === paymentMethod;
                    const theme = getPaymentMethodTheme(option.value);

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPaymentMethod(option.value)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${selected ? theme.chip : "border-border/70 bg-background text-foreground hover:bg-accent"}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground">₱{EXPLUS_PRICE} one-time payment</p>
              </div>

              <PaymentQrPlaceholder method={paymentMethod} />

              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Reference number</p>
                <Input
                  id="reference-number"
                  value={referenceNumber}
                  onChange={(event) => setReferenceNumber(event.target.value)}
                  placeholder="Paste the payment reference number"
                  disabled={clientStatus === "verifying" || isSubmitting}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Confirmation</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Review the details, then submit your payment for verification.</p>
                </div>
                <Button
                  className="h-11 w-full rounded-full bg-foreground px-5 text-background hover:bg-foreground/92"
                  disabled={clientStatus === "verifying" || isSubmitting}
                  onClick={() => void handleSubmit()}
                >
                  {clientStatus === "verifying" ? "Payment Submitted" : isSubmitting ? "Submitting..." : "Confirm Payment"}
                </Button>
              </div>

              <div className="rounded-[22px] border border-border/65 bg-muted/18 px-4 py-4 text-sm leading-6 text-muted-foreground">
                {clientStatus === "verifying"
                  ? "Your payment is being verified. You can keep using Expy while the queue is reviewed."
                  : clientStatus === "rejected"
                    ? latestSubmission?.adminNote || "Your last submission was rejected. Review the payment details, then submit again."
                    : "Once you confirm payment, your status moves to Verifying immediately while the admin queue reviews it."}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[1.02rem] font-semibold tracking-[-0.02em]">ExPro</h3>
                <span className="rounded-full border border-border/70 bg-muted/22 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Coming Soon</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Everything in ExPlus, plus the ExPro-only analytics layer and future AI-driven surfaces.</p>
            </div>
          </div>

          <PlanFeatureList features={EXPRO_FEATURES} />

          <div className="rounded-[24px] border border-border/70 bg-muted/16 px-4 py-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">ExPro price</span>
              <span className="font-semibold">₱{EXPRO_PRICE}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Your upgrade price</span>
              <span className="font-semibold">₱{getExProDisplayPrice(userData)}</span>
            </div>
          </div>

          <Button className="w-full" variant="outline" disabled>
            <Clock3 className="mr-1 h-4 w-4" />
            Coming Soon
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <div className="app-list-icon">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="app-list-title">Current status</p>
              <p className="app-list-meta">
                {latestSubmission
                  ? `Latest ExPlus request: ${latestSubmission.status.toUpperCase()} • ${new Date(latestSubmission.submittedAt).toLocaleString()}`
                  : "No payment submission yet."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
