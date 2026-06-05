import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Paths that do NOT require an authenticated session
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/callback",       // Supabase SSO callback
  "/api/oauth/google/callback",  // OAuth callbacks must be public so the
  "/api/oauth/meta/callback",    // provider redirect lands before we have
  "/api/oauth/linkedin/callback",// a fresh session cookie
];

const SECURITY_HEADERS: Record<string, string> = {
  // Prevent clickjacking
  "X-Frame-Options": "DENY",
  // Stop MIME sniffing
  "X-Content-Type-Options": "nosniff",
  // Only send referrer to same origin
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Enforce HTTPS for 1 year, include sub-domains
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  // Permissions policy: disable unnecessary browser features
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  // Content Security Policy
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-eval in dev; lock down for prod
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com",
    "frame-ancestors 'none'",
  ].join("; "),
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirect = NextResponse.redirect(url);
    return applySecurityHeaders(redirect);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    const redirect = NextResponse.redirect(url);
    return applySecurityHeaders(redirect);
  }

  return applySecurityHeaders(supabaseResponse);
}
