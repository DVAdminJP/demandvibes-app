import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { mockCampaigns } from "@/lib/mock-data";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  getPlatformColor,
  getPlatformLabel,
} from "@/lib/utils";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusVariant: Record<string, "success" | "warning" | "outline"> = {
  active: "success",
  paused: "warning",
  removed: "outline",
  archived: "outline",
};

export default function CampaignsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Campaigns"
        description="All campaigns across connected platforms"
      />
      <div className="flex-1 p-8">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Platform: All
          </Button>
          <Button variant="outline" size="sm">Status: All</Button>
          <Button variant="outline" size="sm">Last 30 days</Button>
          <div className="ml-auto text-sm text-gray-500">
            {mockCampaigns.length} campaigns
          </div>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                  <tr>
                    {[
                      "Campaign",
                      "Platform",
                      "Status",
                      "Spend",
                      "Impressions",
                      "Clicks",
                      "CTR",
                      "CPC",
                      "Conv.",
                      "ROAS",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider first:pl-6 last:pr-6"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {mockCampaigns.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-4 py-3.5 pl-6 font-medium text-gray-900 max-w-[220px]">
                        <span className="truncate block">{c.campaign_name}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: getPlatformColor(c.platform) + "18",
                            color: getPlatformColor(c.platform),
                          }}
                        >
                          {getPlatformLabel(c.platform).split(" ")[0]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={statusVariant[c.status] ?? "outline"}
                          className="capitalize"
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-gray-700 font-medium">
                        {formatCurrency(c.spend)}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">
                        {formatNumber(c.impressions)}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">
                        {formatNumber(c.clicks)}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">
                        {formatPercent(c.ctr)}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">
                        {formatCurrency(c.spend / Math.max(c.clicks, 1))}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500">
                        {c.conversions.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 pr-6">
                        <span
                          className={
                            c.roas >= 4
                              ? "text-emerald-600 font-semibold"
                              : c.roas >= 2
                              ? "text-amber-600 font-medium"
                              : "text-red-500 font-medium"
                          }
                        >
                          {c.roas.toFixed(2)}x
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
