import { formatCurrency, formatRelativeDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MoreVertical,
  AlertTriangle,
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
  frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "semi_annual" | "annual";
  category: string;
  lastChargeDate: string;
  nextChargeDate: string;
  status: "active" | "inactive" | "cancelled" | "trial";
  iconUrl?: string;
}

interface SubscriptionCardProps {
  subscription: Subscription;
}

const statusConfig = {
  active: {
    label: "Active",
    icon: CheckCircle2,
    variant: "success" as const,
    dotColor: "bg-green-500",
  },
  inactive: {
    label: "Inactive",
    icon: XCircle,
    variant: "secondary" as const,
    dotColor: "bg-gray-400",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    variant: "destructive" as const,
    dotColor: "bg-red-500",
  },
  trial: {
    label: "Trial",
    icon: Clock,
    variant: "warning" as const,
    dotColor: "bg-amber-500",
  },
};

const frequencyLabels: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semi_annual: "Semi-annual",
  annual: "Annual",
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

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const status = statusConfig[subscription.status];
  const StatusIcon = status.icon;
  const categoryColor =
    categoryColors[subscription.category] || categoryColors["Other"];

  return (
    <Card className="group hover:shadow-md transition-all">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-4">
          {/* Icon placeholder */}
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shrink-0">
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

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground truncate">
                {subscription.name}
              </h3>
              <Badge variant={status.variant} className="text-xs shrink-0">
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor}`}
              >
                {subscription.category}
              </span>
              <span className="text-xs text-muted-foreground">
                {frequencyLabels[subscription.frequency]}
              </span>
              <span className="text-xs text-muted-foreground">
                Last: {formatRelativeDate(subscription.lastChargeDate)}
              </span>
            </div>
          </div>

          {/* Amount & actions */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="font-bold text-foreground">
                {formatCurrency(subscription.amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {subscription.frequency === "monthly"
                  ? "/mo"
                  : `/${subscription.frequency.replace("_", " ")}`}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  Cancel Subscription
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}