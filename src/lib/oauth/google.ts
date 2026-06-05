import { OAuth2Client } from "google-auth-library";

const SCOPES = ["https://www.googleapis.com/auth/adwords"];

export function getGoogleOAuthClient() {
  return new OAuth2Client(
    process.env.GOOGLE_ADS_CLIENT_ID,
    process.env.GOOGLE_ADS_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google/callback`
  );
}

export function getGoogleAuthUrl(state: string): string {
  const client = getGoogleOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state,
  });
}

export async function exchangeGoogleCode(code: string) {
  const client = getGoogleOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function fetchGoogleAdAccounts(accessToken: string) {
  // Uses Google Ads API to list accessible customer accounts
  const response = await fetch(
    "https://googleads.googleapis.com/v17/customers:listAccessibleCustomers",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Google Ads API error: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.resourceNames ?? []) as string[];
}

export async function fetchGoogleCustomerDetails(
  accessToken: string,
  customerId: string
) {
  const id = customerId.replace("customers/", "");
  const response = await fetch(
    `https://googleads.googleapis.com/v17/customers/${id}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        "login-customer-id": id,
      },
    }
  );

  if (!response.ok) return null;

  const data = await response.json();
  return {
    id,
    name: data.descriptiveName ?? data.id,
  };
}
