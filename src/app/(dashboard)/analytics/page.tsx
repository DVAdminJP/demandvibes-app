import { Header } from "@/components/layout/header";
import { SpendChart } from "@/components/dashboard/spend-chart";
import { PlatformComparison } from "@/components/dashboard/platform-comparison";
import { mockSpendOverTime, mockPlatformMetrics } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Analytics"
        description="Deep-dive performance trends and platform comparisons"
      />
      <div className="flex-1 p-8 space-y-6">
        <SpendChart data={mockSpendOverTime} />

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <PlatformComparison data={mockPlatformMetrics} />
          </div>

          {/* ROAS Trend */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">
                ROAS Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockPlatformMetrics.map((p) => (
                <div key={p.platform}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600 capitalize">{p.platform === "google" ? "Google Ads" : p.platform === "meta" ? "Meta Ads" : "LinkedIn Ads"}</span>
                    <span className="font-semibold text-gray-900">{p.avg_roas.toFixed(2)}x</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${Math.min((p.avg_roas / 6) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{formatCurrency(p.total_spend)} spend</span>
                    <span>{p.total_clicks.toLocaleString()} clicks</span>
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Target ROAS: 4.0x</p>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-emerald-100 rounded-full relative">
                    <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full" style={{width: "67%"}} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
