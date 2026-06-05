import {
  DollarSign,
  Eye,
  MousePointer,
  TrendingUp,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { KPICard } from "@/components/dashboard/kpi-card";
import { SpendChart } from "@/components/dashboard/spend-chart";
import { PlatformComparison } from "@/components/dashboard/platform-comparison";
import { RecentCampaignsTable } from "@/components/dashboard/recent-campaigns-table";
import {
  mockDashboardMetrics,
  mockPlatformMetrics,
  mockSpendOverTime,
  mockCampaigns,
} from "@/lib/mock-data";
import { formatCurrency, formatNumber, formatROAS } from "@/lib/utils";

export default function DashboardPage() {
  const m = mockDashboardMetrics;

  const kpis = [
    {
      title: "Total Spend",
      value: formatCurrency(m.total_spend),
      change: 12.4,
      icon: <DollarSign className="h-5 w-5" />,
      description: "Last 30 days",
    },
    {
      title: "Total Impressions",
      value: formatNumber(m.total_impressions),
      change: 8.1,
      icon: <Eye className="h-5 w-5" />,
      description: "Across all platforms",
    },
    {
      title: "Total Clicks",
      value: formatNumber(m.total_clicks),
      change: 5.7,
      icon: <MousePointer className="h-5 w-5" />,
      description: `CTR: ${(m.avg_ctr * 100).toFixed(2)}%`,
    },
    {
      title: "Avg. ROAS",
      value: formatROAS(m.avg_roas),
      change: -2.3,
      icon: <TrendingUp className="h-5 w-5" />,
      description: `${m.total_conversions.toLocaleString()} conversions`,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Dashboard"
        description="Performance overview across all connected platforms"
      />
      <div className="flex-1 p-8 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <KPICard key={kpi.title} {...kpi} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <SpendChart data={mockSpendOverTime} />
          </div>
          <div>
            <PlatformComparison data={mockPlatformMetrics} />
          </div>
        </div>

        {/* Recent Campaigns */}
        <RecentCampaignsTable campaigns={mockCampaigns} />
      </div>
    </div>
  );
}
