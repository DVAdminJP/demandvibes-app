import { createAdminClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encryption";
import type { Platform } from "@/types";

interface DateRange {
  startDate: string;
  endDate: string;
}

export async function syncPlatformData(
  workspaceId: string,
  connectionId: string,
  platform: Platform,
  dateRange: DateRange
) {
  const supabase = createAdminClient();

  const { data: connection, error } = await supabase
    .from("platform_connections")
    .select("*")
    .eq("id", connectionId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !connection) {
    throw new Error(`Connection not found: ${connectionId}`);
  }

  const accessToken = connection.access_token_encrypted
    ? decrypt(connection.access_token_encrypted)
    : null;

  if (!accessToken) {
    throw new Error("No access token available");
  }

  switch (platform) {
    case "google":
      return syncGoogleData(workspaceId, connection, accessToken, dateRange);
    case "meta":
      return syncMetaData(workspaceId, connection, accessToken, dateRange);
    case "linkedin":
      return syncLinkedInData(workspaceId, connection, accessToken, dateRange);
  }
}

async function syncGoogleData(
  workspaceId: string,
  connection: { id: string; account_id: string },
  accessToken: string,
  dateRange: DateRange
) {
  const supabase = createAdminClient();
  const customerId = connection.account_id.replace(/-/g, "");

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.all_conversions_value,
      segments.date
    FROM campaign
    WHERE segments.date BETWEEN '${dateRange.startDate}' AND '${dateRange.endDate}'
  `;

  const response = await fetch(
    `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!response.ok) {
    throw new Error(`Google Ads sync failed: ${response.statusText}`);
  }

  const data = await response.json();
  const rows = data.results ?? [];

  for (const row of rows) {
    const spend = (row.metrics.costMicros ?? 0) / 1_000_000;
    const roas =
      spend > 0 ? (row.metrics.allConversionsValue ?? 0) / spend : 0;

    const { data: campaign } = await supabase
      .from("campaigns")
      .upsert(
        {
          workspace_id: workspaceId,
          connection_id: connection.id,
          platform: "google",
          campaign_id: String(row.campaign.id),
          campaign_name: row.campaign.name,
          status: row.campaign.status?.toLowerCase() ?? "active",
          objective: row.campaign.advertisingChannelType,
        },
        { onConflict: "workspace_id,platform,campaign_id" }
      )
      .select()
      .single();

    if (campaign) {
      await supabase.from("campaign_metrics").upsert(
        {
          campaign_id: campaign.id,
          workspace_id: workspaceId,
          date: row.segments.date,
          spend,
          impressions: row.metrics.impressions ?? 0,
          clicks: row.metrics.clicks ?? 0,
          conversions: row.metrics.conversions ?? 0,
          ctr: row.metrics.ctr ?? 0,
          cpc: (row.metrics.averageCpc ?? 0) / 1_000_000,
          roas,
          platform: "google",
        },
        { onConflict: "campaign_id,date" }
      );
    }
  }

  return { synced: rows.length };
}

async function syncMetaData(
  workspaceId: string,
  connection: { id: string; account_id: string },
  accessToken: string,
  dateRange: DateRange
) {
  const supabase = createAdminClient();
  const accountId = connection.account_id;

  const params = new URLSearchParams({
    fields:
      "campaign_id,campaign_name,spend,impressions,clicks,conversions,ctr,cpc,purchase_roas,date_start",
    time_range: JSON.stringify({
      since: dateRange.startDate,
      until: dateRange.endDate,
    }),
    level: "campaign",
    access_token: accessToken,
    limit: "500",
  });

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/insights?${params}`
  );

  if (!response.ok) {
    throw new Error(`Meta Ads sync failed: ${response.statusText}`);
  }

  const data = await response.json();
  const rows = data.data ?? [];

  for (const row of rows) {
    const roas = parseFloat(row.purchase_roas?.[0]?.value ?? "0");

    const { data: campaign } = await supabase
      .from("campaigns")
      .upsert(
        {
          workspace_id: workspaceId,
          connection_id: connection.id,
          platform: "meta",
          campaign_id: row.campaign_id,
          campaign_name: row.campaign_name,
          status: "active",
        },
        { onConflict: "workspace_id,platform,campaign_id" }
      )
      .select()
      .single();

    if (campaign) {
      await supabase.from("campaign_metrics").upsert(
        {
          campaign_id: campaign.id,
          workspace_id: workspaceId,
          date: row.date_start,
          spend: parseFloat(row.spend ?? "0"),
          impressions: parseInt(row.impressions ?? "0"),
          clicks: parseInt(row.clicks ?? "0"),
          conversions: parseFloat(row.conversions ?? "0"),
          ctr: parseFloat(row.ctr ?? "0") / 100,
          cpc: parseFloat(row.cpc ?? "0"),
          roas,
          platform: "meta",
        },
        { onConflict: "campaign_id,date" }
      );
    }
  }

  return { synced: rows.length };
}

async function syncLinkedInData(
  workspaceId: string,
  connection: { id: string; account_id: string },
  accessToken: string,
  dateRange: DateRange
) {
  const supabase = createAdminClient();
  const accountId = connection.account_id;

  const params = new URLSearchParams({
    q: "analytics",
    pivot: "CAMPAIGN",
    dateRange: JSON.stringify({
      start: { year: parseInt(dateRange.startDate.slice(0, 4)), month: parseInt(dateRange.startDate.slice(5, 7)), day: parseInt(dateRange.startDate.slice(8, 10)) },
      end: { year: parseInt(dateRange.endDate.slice(0, 4)), month: parseInt(dateRange.endDate.slice(5, 7)), day: parseInt(dateRange.endDate.slice(8, 10)) },
    }),
    fields: "costInLocalCurrency,impressions,clicks,externalWebsiteConversions,dateRange",
    accounts: `urn:li:sponsoredAccount:${accountId}`,
  });

  const response = await fetch(
    `https://api.linkedin.com/v2/adAnalyticsV2?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": "202305",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`LinkedIn sync failed: ${response.statusText}`);
  }

  const data = await response.json();
  const rows = data.elements ?? [];

  for (const row of rows) {
    const spend = parseFloat(row.costInLocalCurrency ?? "0");
    const clicks = row.clicks ?? 0;
    const impressions = row.impressions ?? 0;
    const conversions = row.externalWebsiteConversions ?? 0;
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;

    const dateStart = row.dateRange?.start;
    const date = dateStart
      ? `${dateStart.year}-${String(dateStart.month).padStart(2, "0")}-${String(dateStart.day).padStart(2, "0")}`
      : dateRange.startDate;

    const campaignUrn = row.pivotValues?.[0] ?? "";
    const campaignId = campaignUrn.split(":").pop() ?? "unknown";

    const { data: campaign } = await supabase
      .from("campaigns")
      .upsert(
        {
          workspace_id: workspaceId,
          connection_id: connection.id,
          platform: "linkedin",
          campaign_id: campaignId,
          campaign_name: `LinkedIn Campaign ${campaignId}`,
          status: "active",
        },
        { onConflict: "workspace_id,platform,campaign_id" }
      )
      .select()
      .single();

    if (campaign) {
      await supabase.from("campaign_metrics").upsert(
        {
          campaign_id: campaign.id,
          workspace_id: workspaceId,
          date,
          spend,
          impressions,
          clicks,
          conversions,
          ctr,
          cpc,
          roas: 0,
          platform: "linkedin",
        },
        { onConflict: "campaign_id,date" }
      );
    }
  }

  return { synced: rows.length };
}
