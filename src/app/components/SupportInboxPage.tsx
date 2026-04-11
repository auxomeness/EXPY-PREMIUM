import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { SupportMessage } from "../App";
import { listSupportMessages, subscribeToSupportMessages, updateSupportMessageStatus } from "../utils/mockServer";
import { MoreDetailHeader } from "./MoreDetailHeader";
import { Button } from "./ui/button";

type SupportInboxPageProps = {
  onBack: () => void;
};

export function SupportInboxPage({ onBack }: SupportInboxPageProps) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    setMessages(listSupportMessages());
    return subscribeToSupportMessages((nextMessages) => setMessages(nextMessages));
  }, []);

  const unreadCount = useMemo(() => messages.filter((message) => message.status === "unread").length, [messages]);

  const handleResolve = async (messageId: string, status: SupportMessage["status"]) => {
    setPendingId(messageId);
    try {
      await updateSupportMessageStatus({ messageId, status });
      toast.success(status === "resolved" ? "Support message resolved." : "Support message reopened.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update support status.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="page-shell">
      <MoreDetailHeader
        eyebrow="Admin Tools"
        title="Support Inbox"
        subtitle="Review concerns submitted through Contact Us and resolve them locally."
        onBack={onBack}
      />

      <div className="muted-tile">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Unread</p>
        <p className="mt-2 text-lg font-semibold">{unreadCount}</p>
      </div>

      {messages.length === 0 ? (
        <div className="app-empty-state text-sm text-muted-foreground">No support messages yet.</div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <div key={message.id} className="app-list-row space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="app-list-title">{message.subject}</p>
                  <p className="app-list-meta">
                    {message.userId} • {message.concernType.replaceAll("_", " ")}
                  </p>
                  <p className="app-list-meta">{new Date(message.submittedAt).toLocaleString()}</p>
                  {message.referenceNumber ? <p className="app-list-meta">Reference #{message.referenceNumber}</p> : null}
                </div>
                <span className="rounded-full border border-border/65 bg-muted/22 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {message.status}
                </span>
              </div>

              <p className="text-sm leading-6 text-foreground/84">{message.message}</p>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant={message.status === "resolved" ? "outline" : "default"}
                  onClick={() => void handleResolve(message.id, message.status === "resolved" ? "unread" : "resolved")}
                  disabled={pendingId === message.id}
                >
                  {message.status === "resolved" ? "Mark Unread" : "Mark Resolved"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
