import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLinkedInAuthUrl } from "@/lib/oauth/linkedin";
import { createOAuthState } from "@/lib/encryption";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .single();

  if (!member) return NextResponse.json({ error: "No workspace" }, { status: 400 });
  if (!["owner", "admin"].includes(member.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const state = createOAuthState(member.workspace_id, user.id);

  await createAuditLog({
    workspaceId: member.workspace_id,
    userId: user.id,
    action: "oauth_initiated",
    resource: "platform_connection",
    metadata: { platform: "linkedin" },
  });

  return NextResponse.json({ url: getLinkedInAuthUrl(state) });
}
