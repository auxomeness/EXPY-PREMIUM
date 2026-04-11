import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { PaymentSubmission } from "../App";
import { listPaymentSubmissions, reviewPaymentSubmission, subscribeToPayments } from "../utils/mockServer";
import { MoreDetailHeader } from "./MoreDetailHeader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type AdminPaymentsPageProps = {
  username: string;
  onBack: () => void;
};

export function AdminPaymentsPage({ username, onBack }: AdminPaymentsPageProps) {
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    setSubmissions(listPaymentSubmissions());
    return subscribeToPayments((nextSubmissions) => setSubmissions(nextSubmissions));
  }, []);

  const openCount = useMemo(
    () => submissions.filter((submission) => submission.status === "submitted" || submission.status === "verifying").length,
    [submissions],
  );

  const handleReview = async (submissionId: string, status: "approved" | "rejected") => {
    setPendingId(submissionId);
    try {
      await reviewPaymentSubmission({
        submissionId,
        status,
        reviewedBy: username,
        adminNote: note,
      });
      toast.success(status === "approved" ? "Payment approved and entitlement granted." : "Payment rejected.");
      setActiveNoteId(null);
      setNote("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to review the payment right now.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="page-shell">
      <MoreDetailHeader
        eyebrow="Admin Tools"
        title="Payment Reviews"
        subtitle="Approve or reject Premium submissions from the frontend review queue."
        onBack={onBack}
      />

      <div className="muted-tile">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Open queue</p>
        <p className="mt-2 text-lg font-semibold">{openCount} awaiting review</p>
      </div>

      {submissions.length === 0 ? (
        <div className="app-empty-state text-sm text-muted-foreground">No payment submissions yet.</div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <div key={submission.id} className="app-list-row space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="app-list-title">{submission.userId}</p>
                  <p className="app-list-meta">
                    {submission.requestedPlan.toUpperCase()} • {submission.paymentMethod.replaceAll("_", " ").toUpperCase()} • ₱{submission.amount}
                  </p>
                  <p className="app-list-meta">Ref #{submission.referenceNumber}</p>
                  <p className="app-list-meta">{new Date(submission.submittedAt).toLocaleString()}</p>
                </div>
                <span className="rounded-full border border-border/65 bg-muted/22 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {submission.status}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`payment-note-${submission.id}`}>Admin note (optional)</Label>
                <Input
                  id={`payment-note-${submission.id}`}
                  value={activeNoteId === submission.id ? note : submission.adminNote || ""}
                  onFocus={() => {
                    setActiveNoteId(submission.id);
                    setNote(submission.adminNote || "");
                  }}
                  onChange={(event) => {
                    setActiveNoteId(submission.id);
                    setNote(event.target.value);
                  }}
                  placeholder="Why was this approved or rejected?"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => void handleReview(submission.id, "approved")}
                  disabled={pendingId === submission.id || submission.status === "approved"}
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => void handleReview(submission.id, "rejected")}
                  disabled={pendingId === submission.id || submission.status === "rejected"}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
