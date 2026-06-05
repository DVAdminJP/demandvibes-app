const META_API_VERSION = "v18.0";
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export function getMetaAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/meta/callback`,
    scope: "ads_read,ads_management,business_management",
    response_type: "code",
    state,
  });
  return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params}`;
}

export async function exchangeMetaCode(code: string) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/meta/callback`,
    code,
  });

  const response = await fetch(
    `${META_BASE_URL}/oauth/access_token?${params}`
  );

  if (!response.ok) {
    throw new Error(`Meta OAuth error: ${response.statusText}`);
  }

  return response.json() as Promise<{ access_token: string; expires_in: number }>;
}

export async function fetchMetaAdAccounts(accessToken: string) {
  const response = await fetch(
    `${META_BASE_URL}/me/adaccounts?fields=id,name,account_id&access_token=${accessToken}`
  );

  if (!response.ok) {
    throw new Error(`Meta API error: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.data ?? []) as Array<{ id: string; name: string; account_id: string }>;
}

export async function refreshMetaToken(accessToken: string) {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    fb_exchange_token: accessToken,
  });

  const response = await fetch(
    `${META_BASE_URL}/oauth/access_token?${params}`
  );

  if (!response.ok) return null;
  return response.json() as Promise<{ access_token: string; expires_in: number }>;
}
