# DemandVibes — Enterprise AI Marketing Analytics Platform

An agentic AI marketing analytics platform for agencies. Connect Google Ads, Meta Ads, and LinkedIn Ads accounts, view unified performance dashboards, and get AI-powered optimization recommendations via Claude.

**Live URL:** [app.demandvibes.com](https://app.demandvibes.com)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Database + Auth | Supabase (PostgreSQL + RLS) |
| Charts | Recharts |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Caching | Upstash Redis |
| Deployment | Vercel |
| Payments (Phase 2) | Stripe |

---

## Local Development Setup

### 1. Clone and install

```bash
git clone <repo>
cd demandvibes
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migrations in order:

```bash
# In your Supabase project's SQL editor, run:
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_functions.sql
```

3. Enable Google OAuth in Supabase Auth → Providers → Google
4. Set the redirect URL to `https://app.demandvibes.com/api/auth/callback`

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in all values (see table below).

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Description | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | Supabase → Settings → API |
| `GOOGLE_ADS_CLIENT_ID` | Google OAuth 2.0 client ID | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials |
| `GOOGLE_ADS_CLIENT_SECRET` | Google OAuth 2.0 client secret | Same as above |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Google Ads API developer token | [Google Ads → Tools → API Center](https://ads.google.com/aw/apicenter) |
| `META_APP_ID` | Meta / Facebook App ID | [Meta for Developers](https://developers.facebook.com) → Your App |
| `META_APP_SECRET` | Meta App Secret | Same as above |
| `LINKEDIN_CLIENT_ID` | LinkedIn OAuth Client ID | [LinkedIn Developer Portal](https://developer.linkedin.com) → Apps |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth Client Secret | Same as above |
| `ANTHROPIC_API_KEY` | Claude API key | [Anthropic Console](https://console.anthropic.com) |
| `UPSTASH_REDIS_URL` | Upstash Redis REST URL | [Upstash Console](https://console.upstash.com) |
| `UPSTASH_REDIS_TOKEN` | Upstash Redis REST token | Same as above |
| `NEXTAUTH_SECRET` | Random secret string (min 32 chars) | Run: `openssl rand -base64 32` |
| `CRON_SECRET` | Secret for securing the daily sync cron | Run: `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Full app URL | `https://app.demandvibes.com` (or `http://localhost:3000` in dev) |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/           # Email + Google SSO login
│   │   └── onboarding/      # Workspace creation flow
│   ├── (dashboard)/
│   │   ├── dashboard/       # Unified KPI dashboard with mock data
│   │   ├── connect/         # OAuth platform connection cards
│   │   ├── campaigns/       # Campaign table with filters
│   │   ├── analytics/       # Deep-dive charts and ROAS trends
│   │   ├── ai-assistant/    # Claude-powered chat with streaming
│   │   └── settings/        # Workspace, team, and billing settings
│   └── api/
│       ├── auth/callback/   # Supabase auth callback
│       ├── oauth/
│       │   ├── google/      # Google Ads OAuth initiation + callback
│       │   ├── meta/        # Meta Ads OAuth initiation + callback
│       │   └── linkedin/    # LinkedIn Ads OAuth initiation + callback
│       ├── sync/            # Manual data sync trigger
│       ├── ai/chat/         # Claude streaming API endpoint
│       └── cron/daily-sync/ # Vercel Cron job (2am UTC)
├── components/
│   ├── layout/              # Sidebar, Header
│   ├── dashboard/           # KPI cards, charts, campaign table
│   └── ui/                  # Button, Card, Badge, Input, etc.
├── lib/
│   ├── supabase/            # Client, server, middleware helpers
│   ├── oauth/               # Google, Meta, LinkedIn OAuth libs
│   ├── sync/                # Data sync functions per platform
│   ├── encryption.ts        # AES-256-GCM token encryption
│   ├── audit.ts             # Audit log helper
│   └── mock-data.ts         # Demo data for dashboard
└── types/index.ts           # Shared TypeScript types
```

---

## Database Schema

See [`supabase/migrations/`](./supabase/migrations/) for the full schema including:
- `workspaces` — Multi-tenant workspace isolation
- `workspace_members` — Role-based access (owner, admin, viewer)
- `platform_connections` — Encrypted OAuth tokens per platform
- `campaigns` — Unified campaign records across platforms
- `campaign_metrics` — Daily performance data (spend, impressions, ROAS, etc.)
- `ai_conversations` — Chat history per user
- `audit_logs` — Full audit trail for all data access events

All tables have Row Level Security (RLS) policies enforcing workspace-level data isolation.

---

## OAuth Setup

### Google Ads
1. Create credentials at Google Cloud Console (OAuth 2.0 Client ID)
2. Add authorized redirect URI: `https://app.demandvibes.com/api/oauth/google/callback`
3. Enable the Google Ads API
4. Apply for a developer token at ads.google.com/aw/apicenter

### Meta Ads
1. Create an app at developers.facebook.com
2. Add product: Facebook Login
3. Add valid OAuth redirect URI: `https://app.demandvibes.com/api/oauth/meta/callback`
4. Required permissions: `ads_read`, `ads_management`, `business_management`

### LinkedIn Ads
1. Create an app at developer.linkedin.com
2. Add authorized redirect URL: `https://app.demandvibes.com/api/oauth/linkedin/callback`
3. Request access to: `r_ads`, `r_ads_reporting`, `r_organization_social`

---

## Deployment (Vercel)

1. Push to GitHub and import to [Vercel](https://vercel.com)
2. Add all environment variables in Vercel project settings
3. The daily sync cron runs automatically at 2am UTC (configured in `vercel.json`)
4. Add `CRON_SECRET` env var to match the `Authorization: Bearer <secret>` header

---

## AI Assistant

The AI assistant uses `claude-sonnet-4-20250514` with streaming responses. Features:
- Select specific campaigns as context for targeted analysis
- Pre-built prompts for common optimization questions
- Conversation history saved to Supabase
- System prompt includes workspace context and campaign performance data

---

## Phase 2 Roadmap

- [ ] Stripe billing integration
- [ ] Advanced audience overlap analysis
- [ ] Automated budget reallocation recommendations
- [ ] Email performance reports
- [ ] White-label client portal
- [ ] Custom attribution models
