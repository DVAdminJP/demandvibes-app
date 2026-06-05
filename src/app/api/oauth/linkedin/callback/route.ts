import { NextResponse } from "next/server";
import { exchangeLinkedInCode, fetchLinkedInAdAccounts } from "@/lib/oauth/linkedin";
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
    const payload = verifyOAuthState(state);
    workspaceId = payload.workspaceId;
    userId = payload.userId;
  } catch {
    return NextResponse.redirect(`${origin}/connect?error=invalid_state`);
  }

  const supabase = createAdminClient();

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
    const tokens = await exchangeLinkedInCode(code);
    const accounts = await fetchLinkedInAdAccounts(tokens.access_token);

    for (const account of accounts) {
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
      await supabase.from("platform_connections").upsert(
        {
          workspace_id: workspaceId,
          platform: "linkedin",
          account_id: String(account.id),
          account_name: account.name,
          access_token_encrypted: encrypt(tokens.access_token),
          refresh_token_encrypted: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
          token_expires_at: expiresAt,
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
      metadata: { platform: "linkedin", accountCount: accounts.length },
    });

    return NextResponse.redirect(`${origin}/connect?success=linkedin`);
  } catch (err) {
    console.error("LinkedIn OAuth callback error:", err);
    return NextResponse.redirect(`${origin}/connect?error=oauth_failed`);
  }
}
