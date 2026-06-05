-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTION: get user's workspace IDs
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_workspace_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid();
$$;

-- Helper function to check workspace role
CREATE OR REPLACE FUNCTION user_workspace_role(ws_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM workspace_members WHERE workspace_id = ws_id AND user_id = auth.uid();
$$;

-- ============================================================
-- WORKSPACES POLICIES
-- ============================================================
CREATE POLICY "Users can view their workspaces"
  ON workspaces FOR SELECT
  USING (id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "Owners can update their workspaces"
  ON workspaces FOR UPDATE
  USING (user_workspace_role(id) IN ('owner', 'admin'));

-- ============================================================
-- WORKSPACE MEMBERS POLICIES
-- ============================================================
CREATE POLICY "Members can view workspace members"
  ON workspace_members FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "Owners/admins can insert members"
  ON workspace_members FOR INSERT
  WITH CHECK (user_workspace_role(workspace_id) IN ('owner', 'admin'));

CREATE POLICY "Owners/admins can delete members"
  ON workspace_members FOR DELETE
  USING (user_workspace_role(workspace_id) IN ('owner', 'admin'));

-- ============================================================
-- PLATFORM CONNECTIONS POLICIES
-- ============================================================
CREATE POLICY "Members can view connections"
  ON platform_connections FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "Admins can manage connections"
  ON platform_connections FOR ALL
  USING (user_workspace_role(workspace_id) IN ('owner', 'admin'));

-- ============================================================
-- CAMPAIGNS POLICIES
-- ============================================================
CREATE POLICY "Members can view campaigns"
  ON campaigns FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "Admins can manage campaigns"
  ON campaigns FOR ALL
  USING (user_workspace_role(workspace_id) IN ('owner', 'admin'));

-- ============================================================
-- CAMPAIGN METRICS POLICIES
-- ============================================================
CREATE POLICY "Members can view metrics"
  ON campaign_metrics FOR SELECT
  USING (workspace_id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "Admins can manage metrics"
  ON campaign_metrics FOR ALL
  USING (user_workspace_role(workspace_id) IN ('owner', 'admin'));

-- ============================================================
-- AI CONVERSATIONS POLICIES
-- ============================================================
CREATE POLICY "Users can view own conversations"
  ON ai_conversations FOR SELECT
  USING (user_id = auth.uid() AND workspace_id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "Users can create conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid() AND workspace_id IN (SELECT get_user_workspace_ids()));

CREATE POLICY "Users can update own conversations"
  ON ai_conversations FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- AUDIT LOGS POLICIES
-- ============================================================
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    workspace_id IN (SELECT get_user_workspace_ids())
    AND user_workspace_role(workspace_id) IN ('owner', 'admin')
  );

-- Service role can insert audit logs (used by API routes)
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);
