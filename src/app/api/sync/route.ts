import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncPlatformData } from "@/lib/sync";
import { createAuditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { isValidPlatform, isValidUUID, isValidDate } from "@/lib/validate";
import type { Platform } from "@/types";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: max 10 manual syncs per user per 5 minutes
  const rl = rateLimit(`sync:${user.id}`, { limit: 10, windowSec: 300 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many sync requests" }, { status: 429 });
  }

  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .single();

  if (!member || !["owner", "admin"].includes(member.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { connectionId, platform, startDate, endDate } = body;

  if (!isValidUUID(connectionId)) {
    return NextResponse.json({ error: "Invalid connectionId" }, { status: 400 });
  }
  if (!isValidPlatform(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const end = isValidDate(endDate) ? endDate : new Date().toISOString().split("T")[0];
  const start = isValidDate(startDate)
    ? startDate
    : new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  // Verify the connection belongs to this workspace — prevents cross-workspace sync
  const { data: connection } = await supabase
    .from("platform_connections")
    .select("id")
    .eq("id", connectionId)
    .eq("workspace_id", member.workspace_id)
    .single();

  if (!connection) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  try {
    const result = await syncPlatformData(
      member.workspace_id,
      connectionId as string,
      platform as Platform,
      { startDate: start, endDate: end }
    );

    await createAuditLog({
      workspaceId: member.workspace_id,
      userId: user.id,
      action: "data_sync",
      resource: "campaign_metrics",
      metadata: { platform, connectionId, ...result },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("Sync error:", err);
    // Never leak internal error details to the client
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
