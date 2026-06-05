import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercent, getPlatformLabel, getPlatformColor } from "@/lib/utils";

interface Campaign {
  id: string;
  campaign_name: string;
  platform: "google" | "meta" | "linkedin";
  status: "active" | "paused" | "removed" | "archived";
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
  ctr: number;
}

interface RecentCampaignsTableProps {
  campaigns: Campaign[];
}

const statusVariant: Record<string, "success" | "warning" | "outline"> = {
  active: "success",
  paused: "warning",
  removed: "outline",
  archived: "outline",
};

export function RecentCampaignsTable({ campaigns }: RecentCampaignsTableProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">
          Recent Campaigns
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Campaign", "Platform", "Status", "Spend", "Impressions", "Clicks", "Conv.", "ROAS"].map(
                  (h) => (
                    <th
                      key={h}
                      className="pb-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider pr-4 last:pr-0"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {campaigns.slice(0, 6).map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 pr-4 font-medium text-gray-900 max-w-[200px] truncate">
                    {c.campaign_name}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: getPlatformColor(c.platform) + "20",
                        color: getPlatformColor(c.platform),
                      }}
                    >
                      {getPlatformLabel(c.platform).split(" ")[0]}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={statusVariant[c.status] ?? "outline"} className="capitalize">
                      {c.status}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-gray-700">{formatCurrency(c.spend)}</td>
                  <td className="py-3 pr-4 text-gray-500">{formatNumber(c.impressions)}</td>
                  <td className="py-3 pr-4 text-gray-500">{formatNumber(c.clicks)}</td>
                  <td className="py-3 pr-4 text-gray-500">{c.conversions}</td>
                  <td className="py-3 text-emerald-600 font-semibold">{c.roas.toFixed(2)}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
