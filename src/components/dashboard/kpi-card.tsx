import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  description?: string;
}

export function KPICard({ title, value, change, icon, description }: KPICardProps) {
  const isPositive = (change ?? 0) >= 0;

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            {description && (
              <p className="mt-1 text-xs text-gray-400">{description}</p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
            {icon}
          </div>
        </div>
        {change !== undefined && (
          <div className="mt-3 flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                isPositive ? "text-emerald-600" : "text-red-600"
              )}
            >
              {isPositive ? "+" : ""}{change?.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-400">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
