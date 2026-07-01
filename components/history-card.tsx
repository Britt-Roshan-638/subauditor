// components/history-card.tsx — price change history for a subscription.

import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { TrendingUp, ArrowRight } from "lucide-react";

export interface PriceChange {
  id: string;
  subscriptionId: string;
  oldAmount: number;
  newAmount: number;
  detectedAt: string;
}

interface HistoryCardProps {
  priceChanges: PriceChange[];
  className?: string;
  subscriptionName?: string;
}

export function HistoryCard({
  priceChanges,
  className,
  subscriptionName,
}: HistoryCardProps) {
  if (!priceChanges || priceChanges.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-champagne" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Price history
        </span>
      </div>

      <div className="space-y-2">
        {priceChanges.map((change) => {
          const pctChange =
            change.oldAmount > 0
              ? ((change.newAmount - change.oldAmount) / change.oldAmount) *
                100
              : 0;
          const isIncrease = pctChange > 0;
          const pctColor = isIncrease
            ? "text-rose-400"
            : "text-emerald-400";

          return (
            <div
              key={change.id}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/40 px-3 py-2.5 text-sm"
            >
              {/* Old → New amount */}
              <div className="flex items-center gap-1.5 font-mono text-xs font-medium shrink-0">
                <span className="text-muted-foreground line-through">
                  {formatCurrency(change.oldAmount)}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
                <span className="text-foreground">
                  {formatCurrency(change.newAmount)}
                </span>
              </div>

              {/* Percentage badge */}
              <span
                className={cn(
                  "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  isIncrease
                    ? "bg-rose-500/10 text-rose-400"
                    : "bg-emerald-500/10 text-emerald-400"
                )}
              >
                {isIncrease ? "+" : ""}
                {pctChange.toFixed(1)}%
              </span>

              {/* Date */}
              <span className="text-[11px] text-muted-foreground/70 whitespace-nowrap">
                {formatDate(change.detectedAt)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
