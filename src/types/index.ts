export type Platform = "google" | "meta" | "linkedin";
export type WorkspaceRole = "owner" | "admin" | "viewer";
export type WorkspacePlan = "free" | "starter" | "pro" | "enterprise";
export type CampaignStatus = "active" | "paused" | "removed" | "archived";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: WorkspacePlan;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
}

export interface PlatformConnection {
  id: string;
  workspace_id: string;
  platform: Platform;
  account_id: string;
  account_name: string | null;
  token_expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Campaign {
  id: string;
  workspace_id: string;
  connection_id: string;
  platform: Platform;
  campaign_id: string;
  campaign_name: string;
  status: CampaignStatus;
  objective: string | null;
  created_at: string;
}

export interface CampaignMetrics {
  id: string;
  campaign_id: string;
  workspace_id: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
  platform: Platform;
}

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface AIConversation {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string | null;
  messages: AIMessage[];
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  workspace_id: string;
  user_id: string | null;
  action: string;
  resource: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DashboardMetrics {
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  avg_roas: number;
  avg_ctr: number;
  avg_cpc: number;
}

export interface PlatformMetrics {
  platform: Platform;
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  avg_roas: number;
}

export interface SpendDataPoint {
  date: string;
  google: number;
  meta: number;
  linkedin: number;
  total: number;
}
