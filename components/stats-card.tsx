// components/stats-card.tsx — stat card used on dashboard.

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: {
    value: number;
    label: string;
  };
  trendDirection?: "up" | "down" | "neutral";
  iconColor?: string;
  iconBgColor?: string;
  className?: string;
}

export function StatsCard({
  icon: Icon,
  label,
  value,
  trend,
  trendDirection = "neutral",
  iconColor = "text-blue-600",
  iconBgColor = "bg-blue-100 dark:bg-blue-900/30",
  className,
}: StatsCardProps) {
  const TrendIcon =
    trendDirection === "up"
      ? TrendingUp
      : trendDirection === "down"
      ? TrendingDown
      : Minus;

  const trendColor =
    trendDirection === "up"
      ? "text-green-600 dark:text-green-400"
      : trendDirection === "down"
      ? "text-red-600 dark:text-red-400"
      : "text-muted-foreground";

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-foreground">
              {value}
            </p>
            {trend && (
              <div className="mt-2 flex items-center gap-1.5">
                <TrendIcon className={cn("h-4 w-4", trendColor)} />
                <span className={cn("text-sm font-medium", trendColor)}>
                  {trendDirection === "up" ? "+" : trendDirection === "down" ? "-" : ""}
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-sm text-muted-foreground">
                  {trend.label}
                </span>
              </div>
            )}
          </div>
          <div
            className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
              iconBgColor
            )}
          >
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}