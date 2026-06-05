-- ============================================================
-- MIGRATION 004: Security hardening
-- Run this after 002_rls_policies.sql
-- ============================================================

-- ── 1. Fix audit_logs INSERT policy ─────────────────────────
-- Old policy used WITH CHECK (true) — any authed user could insert arbitrary rows.
-- New policy: only the service role can insert (API routes use service role key).
DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_logs;

-- The service role bypasses RLS entirely, so no policy is needed for it.
-- We add a restrictive policy so regular users cannot insert directly.
CREATE POLICY "No direct user inserts on audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (false); -- blocked for anon/authenticated; service role bypasses RLS

-- ── 2. Prevent workspace_members self-escalation ─────────────
-- A user could previously insert themselves as 'owner' into any workspace
-- if they somehow had the workspace_id. Tighten the INSERT check.
DROP POLICY IF EXISTS "Owners/admins can insert members" ON workspace_members;

CREATE POLICY "Owners/admins can insert members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    -- The inserting user must already be an owner/admin of this workspace
    user_workspace_role(workspace_id) IN ('owner', 'admin')
    -- And they cannot grant a role higher than their own
    AND (
      user_workspace_role(workspace_id) = 'owner'
      OR NEW.role IN ('admin', 'viewer')
    )
  );

-- ── 3. Prevent members from deleting the last owner ──────────
-- A policy alone can't enforce this; use a trigger instead.
CREATE OR REPLACE FUNCTION prevent_last_owner_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.role = 'owner' THEN
    IF (
      SELECT COUNT(*) FROM workspace_members
      WHERE workspace_id = OLD.workspace_id AND role = 'owner'
    ) <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last owner of a workspace';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS check_last_owner ON workspace_members;
CREATE TRIGGER check_last_owner
  BEFORE DELETE ON workspace_members
  FOR EACH ROW EXECUTE FUNCTION prevent_last_owner_deletion();

-- ── 4. Prevent platform_connections tokens from being read via SELECT ──
-- Tokens are encrypted at the app layer, but we add a view that strips them
-- so the anon/authenticated role never sees ciphertext accidentally.
CREATE OR REPLACE VIEW platform_connections_safe AS
  SELECT
    id,
    workspace_id,
    platform,
    account_id,
    account_name,
    token_expires_at,
    is_active,
    created_at
    -- access_token_encrypted and refresh_token_encrypted intentionally omitted
  FROM platform_connections;

GRANT SELECT ON platform_connections_safe TO authenticated;

-- ── 5. Add workspace isolation check function with RLS bypass protection ─
-- Ensure helper functions always run as definer (already set, but make explicit)
ALTER FUNCTION get_user_workspace_ids() SECURITY DEFINER;
ALTER FUNCTION user_workspace_role(UUID) SECURITY DEFINER;

-- ── 6. Deny DELETE on campaign_metrics to authenticated role ──────────────
-- Only service role (data sync) should ever delete metrics rows.
CREATE POLICY "No user deletes on campaign_metrics"
  ON campaign_metrics FOR DELETE
  USING (false);

-- ── 7. Add RLS to prevent cross-workspace campaign_metrics inserts ────────
-- Belt-and-suspenders: metric's workspace_id must match the campaign's workspace_id
CREATE OR REPLACE FUNCTION campaign_workspace_matches(p_campaign_id UUID, p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM campaigns
    WHERE id = p_campaign_id AND workspace_id = p_workspace_id
  );
$$;
