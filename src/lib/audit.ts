import { createAdminClient } from "@/lib/supabase/server";

interface AuditParams {
  workspaceId: string;
  userId?: string;
  action: string;
  resource: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog({
  workspaceId,
  userId,
  action,
  resource,
  metadata = {},
}: AuditParams) {
  const supabase = createAdminClient();

  await supabase.from("audit_logs").insert({
    workspace_id: workspaceId,
    user_id: userId ?? null,
    action,
    resource,
    metadata,
  });
}
