const LINKEDIN_BASE_URL = "https://www.linkedin.com";
const LINKEDIN_API_URL = "https://api.linkedin.com/v2";

export function getLinkedInAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/linkedin/callback`,
    state,
    scope: "r_ads r_ads_reporting r_organization_social",
  });
  return `${LINKEDIN_BASE_URL}/oauth/v2/authorization?${params}`;
}

export async function exchangeLinkedInCode(code: string) {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/linkedin/callback`,
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
  });

  const response = await fetch(`${LINKEDIN_BASE_URL}/oauth/v2/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!response.ok) {
    throw new Error(`LinkedIn OAuth error: ${response.statusText}`);
  }

  return response.json() as Promise<{
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  }>;
}

export async function fetchLinkedInAdAccounts(accessToken: string) {
  const response = await fetch(
    `${LINKEDIN_API_URL}/adAccountsV2?q=search&search.type.values[0]=BUSINESS&search.status.values[0]=ACTIVE`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "LinkedIn-Version": "202305",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`LinkedIn API error: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.elements ?? []) as Array<{
    id: number;
    name: string;
    type: string;
  }>;
}
