-- ============================================================
-- FUNCTION: Create workspace and add owner atomically
-- ============================================================
CREATE OR REPLACE FUNCTION create_workspace_with_owner(
  p_name TEXT,
  p_slug TEXT,
  p_user_id UUID
)
RETURNS workspaces
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_workspace workspaces;
BEGIN
  INSERT INTO workspaces (name, slug)
  VALUES (p_name, p_slug)
  RETURNING * INTO v_workspace;

  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace.id, p_user_id, 'owner');

  RETURN v_workspace;
END;
$$;

-- ============================================================
-- FUNCTION: Get aggregated dashboard metrics for a workspace
-- ============================================================
CREATE OR REPLACE FUNCTION get_dashboard_metrics(
  p_workspace_id UUID,
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_spend NUMERIC,
  total_impressions BIGINT,
  total_clicks BIGINT,
  total_conversions NUMERIC,
  avg_roas NUMERIC,
  avg_ctr NUMERIC,
  avg_cpc NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    COALESCE(SUM(spend), 0) AS total_spend,
    COALESCE(SUM(impressions), 0) AS total_impressions,
    COALESCE(SUM(clicks), 0) AS total_clicks,
    COALESCE(SUM(conversions), 0) AS total_conversions,
    COALESCE(AVG(NULLIF(roas, 0)), 0) AS avg_roas,
    COALESCE(AVG(NULLIF(ctr, 0)), 0) AS avg_ctr,
    COALESCE(AVG(NULLIF(cpc, 0)), 0) AS avg_cpc
  FROM campaign_metrics
  WHERE workspace_id = p_workspace_id
    AND date BETWEEN p_start_date AND p_end_date;
$$;

-- ============================================================
-- FUNCTION: Get spend by platform for a date range
-- ============================================================
CREATE OR REPLACE FUNCTION get_spend_by_platform(
  p_workspace_id UUID,
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  platform TEXT,
  total_spend NUMERIC,
  total_impressions BIGINT,
  total_clicks BIGINT,
  avg_roas NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    platform,
    SUM(spend) AS total_spend,
    SUM(impressions) AS total_impressions,
    SUM(clicks) AS total_clicks,
    AVG(NULLIF(roas, 0)) AS avg_roas
  FROM campaign_metrics
  WHERE workspace_id = p_workspace_id
    AND date BETWEEN p_start_date AND p_end_date
  GROUP BY platform;
$$;

-- ============================================================
-- TRIGGER: Update ai_conversations.updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
