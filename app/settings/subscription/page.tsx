"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  Pause,
  Play,
  XCircle,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Receipt,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SubscriptionInfo {
  id: string;
  status: string;
  plan_id: string;
  current_start: number; // Unix timestamp
  current_end: number;   // Unix timestamp
  paid_count: number;
  total_count: number;
  quantity: number;
  short_url: string | null;
  has_scheduled_changes: boolean;
  pause_status: string | null;
}

interface LastPayment {
  amount: number;
  currency: string;
  status: string;
  date: string;
}

interface PortalData {
  plan: string;
  razorpayCustomerId: string | null;
  razorpaySubscriptionId: string | null;
  subscription: SubscriptionInfo | null;
  lastPayment: LastPayment | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(unixTimestamp: number): string {
  return new Date(unixTimestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusLabel(status: string): { text: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" | "info" } {
  switch (status) {
    case "active":
      return { text: "Active", variant: "success" };
    case "paused":
      return { text: "Paused", variant: "warning" };
    case "cancelled":
      return { text: "Cancelled", variant: "destructive" };
    case "pending":
      return { text: "Pending", variant: "info" };
    case "halted":
      return { text: "Halted", variant: "destructive" };
    case "completed":
      return { text: "Completed", variant: "secondary" };
    default:
      return { text: status, variant: "secondary" };
  }
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function SubscriptionManagementPage() {
  const router = useRouter();

  // State
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: string;
    title: string;
    description: string;
    variant: "destructive" | "default";
  }>({ open: false, action: "", title: "", description: "", variant: "default" });

  // Fetch subscription data
  const fetchPortalData = useCallback(async () => {
    try {
      const res = await fetch("/api/razorpay/portal");
      if (res.ok) {
        const data = await res.json();
        setPortalData(data);
      }
    } catch (err) {
      console.error("Failed to fetch subscription data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  // Perform subscription action
  const performAction = async (action: string, extraBody?: Record<string, string>) => {
    setActionLoading(action);
    setFeedback(null);

    try {
      const res = await fetch("/api/razorpay/subscription/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraBody }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: "success", message: data.message });
        // Refresh data after action
        await fetchPortalData();
      } else {
        setFeedback({ type: "error", message: data.error || "Action failed" });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error. Please try again." });
    } finally {
      setActionLoading(null);
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  // Confirmation dialog triggers
  const openCancelDialog = (immediate: boolean) => {
    if (immediate) {
      setConfirmDialog({
        open: true,
        action: "cancel_immediate",
        title: "Cancel subscription immediately?",
        description:
          "You will lose Pro access right away and be downgraded to the Free plan. This action cannot be undone.",
        variant: "destructive",
      });
    } else {
      setConfirmDialog({
        open: true,
        action: "cancel",
        title: "Cancel subscription at period end?",
        description:
          "Your subscription will remain active until the end of the current billing period. You will retain Pro access until then.",
        variant: "default",
      });
    }
  };

  const openPauseDialog = () => {
    setConfirmDialog({
      open: true,
      action: "pause",
      title: "Pause subscription?",
      description:
        "Your subscription will be paused for up to 3 billing cycles. You will not be charged during this period, but your Pro access will be suspended.",
      variant: "default",
    });
  };

  const openResumeDialog = () => {
    setConfirmDialog({
      open: true,
      action: "resume",
      title: "Resume subscription?",
      description:
        "Your subscription will resume immediately. Billing will continue as normal from today.",
      variant: "default",
    });
  };

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const plan = portalData?.plan || "free";
  const sub = portalData?.subscription;
  const isPro = plan === "pro";
  const isActive = sub?.status === "active";
  const isPaused = sub?.status === "paused" || sub?.pause_status === "paused";
  const isCancelled = sub?.status === "cancelled";

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to settings
        </Link>

        <h1 className="mt-6 font-display text-4xl tracking-tightest">Billing</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your SubAuditor Pro subscription.
        </p>

        {/* ---- Feedback banner ---- */}
        {feedback && (
          <div
            className={`mt-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="ml-auto shrink-0 opacity-70 hover:opacity-100"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ---- Current Plan Card ---- */}
        <Card className="mt-8 border-border bg-card/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-xl">
              <CreditCard className="h-5 w-5 text-violet-glow" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/40 px-4 py-3">
              <div>
                <span className="chip-mono text-[11px] text-muted-foreground">PLAN</span>
                <p className="mt-1 text-lg font-semibold capitalize">{plan}</p>
              </div>
              {sub && (
                <Badge variant={statusLabel(sub.status).variant}>
                  {statusLabel(sub.status).text}
                </Badge>
              )}
            </div>

            {/* ---- Subscription details (Pro users only) ---- */}
            {isPro && sub && (
              <div className="space-y-3">
                {/* Billing cycle info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/50 bg-card/40 px-4 py-3">
                    <span className="chip-mono flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      CURRENT PERIOD
                    </span>
                    <p className="mt-1 text-sm font-medium">
                      {formatDate(sub.current_start)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-card/40 px-4 py-3">
                    <span className="chip-mono flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      NEXT BILLING
                    </span>
                    <p className="mt-1 text-sm font-medium">
                      {formatDate(sub.current_end)}
                    </p>
                  </div>
                </div>

                {/* Payment cycles */}
                <div className="rounded-xl border border-border/50 bg-card/40 px-4 py-3">
                  <span className="chip-mono flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Receipt className="h-3 w-3" />
                    BILLING CYCLES
                  </span>
                  <p className="mt-1 text-sm font-medium">
                    {sub.paid_count} of {sub.total_count === 0 ? "unlimited" : sub.total_count} payments completed
                  </p>
                </div>

                {/* Last payment */}
                {portalData?.lastPayment && (
                  <div className="rounded-xl border border-border/50 bg-card/40 px-4 py-3">
                    <span className="chip-mono flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Receipt className="h-3 w-3" />
                      LAST PAYMENT
                    </span>
                    <p className="mt-1 text-sm font-medium">
                      {formatAmount(portalData.lastPayment.amount, portalData.lastPayment.currency)}
                      <span className="ml-2 text-muted-foreground">
                        ({new Date(portalData.lastPayment.date).toLocaleDateString()})
                      </span>
                    </p>
                  </div>
                )}

                {/* ---- Action buttons ---- */}
                <div className="space-y-2 pt-2">
                  {isActive && (
                    <>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={actionLoading !== null}
                          onClick={openPauseDialog}
                        >
                          {actionLoading === "pause" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Pause className="mr-2 h-4 w-4" />
                          )}
                          Pause
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={actionLoading !== null}
                          onClick={() => openCancelDialog(false)}
                        >
                          {actionLoading === "cancel" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}
                          Cancel
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                        disabled={actionLoading !== null}
                        onClick={() => openCancelDialog(true)}
                      >
                        Cancel Immediately
                      </Button>
                    </>
                  )}

                  {isPaused && (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      disabled={actionLoading !== null}
                      onClick={openResumeDialog}
                    >
                      {actionLoading === "resume" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                      Resume Subscription
                    </Button>
                  )}

                  {isCancelled && (
                    <p className="text-sm text-muted-foreground">
                      Your subscription has been cancelled. You can resubscribe anytime.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ---- Free plan upgrade prompt ---- */}
            {!isPro && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Upgrade to Pro for unlimited subscriptions, price alerts, and export.
                </p>
                <Button onClick={() => router.push("/pricing")}>Upgrade to Pro</Button>
              </div>
            )}

            {/* ---- Pro user without subscription data (legacy) ---- */}
            {isPro && !sub && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Your Pro plan is active. To manage your subscription, please contact support
                  or use the link in your Razorpay payment receipt email.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* ---- Confirmation Dialog ---- */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
              disabled={actionLoading !== null}
            >
              Keep Subscription
            </Button>
            <Button
              variant={confirmDialog.variant === "destructive" ? "destructive" : "default"}
              size="sm"
              disabled={actionLoading !== null}
              onClick={() => performAction(confirmDialog.action)}
            >
              {actionLoading === confirmDialog.action ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {confirmDialog.action === "cancel" && "Cancel at Period End"}
              {confirmDialog.action === "cancel_immediate" && "Cancel Now"}
              {confirmDialog.action === "pause" && "Pause Subscription"}
              {confirmDialog.action === "resume" && "Resume Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
