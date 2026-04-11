import { useState } from "react";
import { toast } from "sonner";
import type { SupportConcernType } from "../App";
import { submitSupportMessage } from "../utils/mockServer";
import { SUPPORT_CONCERN_OPTIONS } from "../utils/premium";
import { MoreDetailHeader } from "./MoreDetailHeader";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

type ContactUsPageProps = {
  username: string;
  onBack: () => void;
};

export function ContactUsPage({ username, onBack }: ContactUsPageProps) {
  const [concernType, setConcernType] = useState<SupportConcernType>("payment_concern");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please complete the subject and message.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitSupportMessage({
        userId: username,
        concernType,
        subject: subject.trim(),
        message: message.trim(),
        referenceNumber: referenceNumber.trim() || undefined,
      });
      setSubmitted(true);
      setSubject("");
      setMessage("");
      setReferenceNumber("");
      toast.success("Your concern has been submitted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit your concern right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <MoreDetailHeader
        eyebrow="Support"
        title="Contact Us"
        subtitle="Send upgrade, payment, account, or bug concerns to the admin inbox."
        onBack={onBack}
      />

      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="space-y-2">
            <Label htmlFor="concern-type">Concern type</Label>
            <Select value={concernType} onValueChange={(value) => setConcernType(value as SupportConcernType)}>
              <SelectTrigger id="concern-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORT_CONCERN_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-subject">Subject</Label>
            <Input id="contact-subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="What do you need help with?" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Share the details so the admin can review it properly."
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-reference">Reference number (optional)</Label>
            <Input id="contact-reference" value={referenceNumber} onChange={(event) => setReferenceNumber(event.target.value)} placeholder="Payment reference or related code" />
          </div>

          <Button className="w-full" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Concern"}
          </Button>

          {submitted ? (
            <div className="rounded-[22px] border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-sm leading-6 text-emerald-700 dark:text-emerald-300">
              Your concern was submitted successfully. We’ll surface it in the admin inbox for review.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
