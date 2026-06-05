/**
 * Validates required environment variables at startup.
 * Call this in the root layout (server component) so a missing secret
 * causes an immediate, clear error instead of a cryptic runtime failure.
 */

const REQUIRED_SERVER_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
  "NEXTAUTH_SECRET",
] as const;

export function assertEnv() {
  if (typeof window !== "undefined") return; // client-side: skip

  const missing: string[] = [];

  for (const key of REQUIRED_SERVER_VARS) {
    const val = process.env[key];
    if (!val || val.trim() === "") {
      missing.push(key);
    }
  }

  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    throw new Error("NEXTAUTH_SECRET must be at least 32 characters long");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        "Copy .env.local.example to .env.local and fill in all values."
    );
  }
}
