import { NextResponse } from "next/server";
import { exchangeGoogleCode, fetchGoogleAdAccounts, fetchGoogleCustomerDetails } from "@/lib/oauth/google";
import { createAdminClient } from "@/lib/supabase/server";
import { encrypt, verifyOAuthState } from "@/lib/encryption";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) return NextResponse.redirect(`${origin}/connect?error=oauth_denied`);
  if (!code || !state) return NextResponse.redirect(`${origin}/connect?error=missing_params`);

  let workspaceId: string;
  let userId: string;

  try {
    // Verify HMAC signature and TTL — throws if tampered or expired
    const payload = verifyOAuthState(state);
    workspaceId = payload.workspaceId;
    userId = payload.userId;
  } catch {
    return NextResponse.redirect(`${origin}/connect?error=invalid_state`);
  }

  const supabase = createAdminClient();

  // Verify the userId actually belongs to this workspace (prevents state token forgery from another WS)
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (!member || !["owner", "admin"].includes(member.role)) {
    return NextResponse.redirect(`${origin}/connect?error=unauthorized`);
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    if (!tokens.access_token) throw new Error("No access token received");

    const customerNames = await fetchGoogleAdAccounts(tokens.access_token);

    for (const name of customerNames.slice(0, 10)) {
      const details = await fetchGoogleCustomerDetails(tokens.access_token, name);
      if (!details) continue;

      await supabase.from("platform_connections").upsert(
        {
          workspace_id: workspaceId,
          platform: "google",
          account_id: details.id,
          account_name: details.name,
          access_token_encrypted: encrypt(tokens.access_token),
          refresh_token_encrypted: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
          token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          is_active: true,
        },
        { onConflict: "workspace_id,platform,account_id" }
      );
    }

    await createAuditLog({
      workspaceId,
      userId,
      action: "oauth_completed",
      resource: "platform_connection",
      metadata: { platform: "google", accountCount: customerNames.length },
    });

    return NextResponse.redirect(`${origin}/connect?success=google`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${origin}/connect?error=oauth_failed`);
  }
}
