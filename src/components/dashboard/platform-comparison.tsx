"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PlatformMetrics } from "@/types";
import { formatCurrency, getPlatformLabel, getPlatformColor } from "@/lib/utils";

interface PlatformComparisonProps {
  data: PlatformMetrics[];
}

export function PlatformComparison({ data }: PlatformComparisonProps) {
  const chartData = data.map((d) => ({
    name: getPlatformLabel(d.platform),
    spend: d.total_spend,
    roas: d.avg_roas,
    fill: getPlatformColor(d.platform),
  }));

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">
          Platform Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-3 font-medium">Total Spend by Platform</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), "Spend"]}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="spend" radius={[4, 4, 0, 0]} fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-3 font-medium">ROAS by Platform</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${v}x`}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(2)}x`, "ROAS"]}
                  contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="roas" radius={[4, 4, 0, 0]} fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform summary table */}
        <div className="mt-4 space-y-2">
          {data.map((p) => (
            <div
              key={p.platform}
              className="flex items-center justify-between py-2 border-t border-gray-100 text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: getPlatformColor(p.platform) }}
                />
                <span className="font-medium text-gray-700">{getPlatformLabel(p.platform)}</span>
              </div>
              <div className="flex items-center gap-6 text-gray-500">
                <span>{formatCurrency(p.total_spend)}</span>
                <span className="text-emerald-600 font-medium">{p.avg_roas.toFixed(2)}x ROAS</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
