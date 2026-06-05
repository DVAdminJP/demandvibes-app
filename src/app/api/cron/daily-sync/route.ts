import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { syncPlatformData } from "@/lib/sync";
import type { Platform } from "@/types";

// Vercel Cron: runs daily at 2am UTC
// Add to vercel.json: { "crons": [{ "path": "/api/cron/daily-sync", "schedule": "0 2 * * *" }] }
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];

  // Fetch all active connections
  const { data: connections, error } = await supabase
    .from("platform_connections")
    .select("id, workspace_id, platform")
    .eq("is_active", true);

  if (error || !connections) {
    return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
  }

  const results = [];

  for (const connection of connections) {
    try {
      const result = await syncPlatformData(
        connection.workspace_id,
        connection.id,
        connection.platform as Platform,
        { startDate, endDate }
      );
      results.push({ connectionId: connection.id, platform: connection.platform, ...result });
    } catch (err) {
      results.push({
        connectionId: connection.id,
        platform: connection.platform,
        error: String(err),
      });
    }
  }

  return NextResponse.json({
    success: true,
    syncedAt: new Date().toISOString(),
    results,
  });
}
