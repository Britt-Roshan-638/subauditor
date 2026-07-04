"use client";

// components/subscription-card.tsx — single subscription row for the dashboard list.

import { formatCurrency, formatRelativeDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "semi_annual" | "annual" | "yearly";
  category: string;
  lastChargeDate: string;
  nextChargeDate: string;
  status: "active" | "inactive" | "cancelled" | "trial";
  iconUrl?: string;
}

interface SubscriptionCardProps {
  subscription: Subscription;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
}

const statusConfig = {
  active: {
    label: "Active",
    icon: CheckCircle2,
    variant: "success" as const,
  },
  inactive: {
    label: "Inactive",
    icon: XCircle,
    variant: "secondary" as const,
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    variant: "destructive" as const,
  },
  trial: {
    label: "Trial",
    icon: Clock,
    variant: "warning" as const,
  },
};

const frequencyLabels: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semi_annual: "Semi-annual",
  annual: "Annual",
  yearly: "Annual",
};

const categoryColors: Record<string, string> = {
  Entertainment: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Music: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Productivity: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Health: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  News: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Storage: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  Finance: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Shopping: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  Other: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

export function SubscriptionCard({ subscription, onDelete, onStatusChange }: SubscriptionCardProps) {
  const status = statusConfig[subscription.status] ?? statusConfig.active;
  const StatusIcon = status.icon;
  const categoryColor =
    categoryColors[subscription.category] || categoryColors["Other"];
  const freqKey = subscription.frequency === "yearly" ? "annual" : subscription.frequency;

  const handleCancel = () => {
    if (onStatusChange) {
      onStatusChange(subscription.id, "cancelled");
    }
  };

  const handleDelete = () => {
    if (onDelete && confirm(`Remove ${subscription.name} from your audit?`)) {
      onDelete(subscription.id);
    }
  };

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-transparent bg-transparent px-3 py-4 transition-all hover:bg-accent/30 hover:border-border/60 sm:px-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
        {subscription.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={subscription.iconUrl}
            alt={subscription.name}
            className="h-6 w-6 rounded"
          />
        ) : (
          <span className="text-lg font-bold text-slate-500 dark:text-slate-400">
            {subscription.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="truncate font-semibold text-foreground">
            {subscription.name}
          </h3>
          <Badge variant={status.variant} className="shrink-0 text-xs">
            <StatusIcon className="mr-1 h-3 w-3" />
            {status.label}
          </Badge>
        </div>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColor}`}
          >
            {subscription.category}
          </span>
          <span className="text-xs text-muted-foreground">
            {frequencyLabels[freqKey] || subscription.frequency}
          </span>
          {subscription.lastChargeDate && (
            <span className="text-xs text-muted-foreground">
              Last: {formatRelativeDate(subscription.lastChargeDate)}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right">
          <p className="font-bold text-foreground">
            {formatCurrency(subscription.amount)}
          </p>
          <p className="text-xs text-muted-foreground">
            {freqKey === "monthly" ? "/mo" : `/${freqKey.replace("_", " ")}`}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCancel}>
              Mark as cancelled
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleDelete}
            >
              Remove from audit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
