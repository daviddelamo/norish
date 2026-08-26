import { NextRequest, NextResponse } from "next/server";
import { shouldBypassAuthProxy } from "@/lib/recipe-share-access";

import { auth } from "@norish/auth/auth";
import { SERVER_CONFIG } from "@norish/config/env-config-server";

// Simple in-memory rate limiting map
// note: in a serverless environment this would be reset frequently,
// but in a containerized long-running process (like Coolify), this persists nicely.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export async function proxy(request: NextRequest) {
  // --- Rate limiting for API routes ---
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour window
    const maxRequests = 1000; // 1000 requests per hour

    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    } else if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      console.warn(`[Proxy] Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: {
            "X-Retry-After": String(retryAfter),
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      record.count++;
    }
  }

  // WebSocket upgrade requests should not be redirected - they'll be handled at the app level
  const isWebSocket =
    request.headers.get("upgrade")?.toLowerCase() === "websocket" &&
    request.headers.get("connection")?.toLowerCase().includes("upgrade");

  if (isWebSocket) {
    return NextResponse.next();
  }

  if (shouldBypassAuthProxy(request)) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (session?.user) {
    return NextResponse.next();
  }

  // Invalid or no session - redirect to login
  // Use X-Forwarded headers when behind a reverse proxy
  const forwardedOrigin = getPublicOrigin(request);
  let loginUrl: URL;

  if (forwardedOrigin && SERVER_CONFIG.TRUSTED_ORIGINS.includes(forwardedOrigin)) {
    loginUrl = new URL("/login", forwardedOrigin);
  } else {
    loginUrl = new URL("/login", SERVER_CONFIG.AUTH_URL);
  }

  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);

  return NextResponse.redirect(loginUrl, 307);
}

function getPublicOrigin(request: NextRequest) {
  const h = request.headers;

  const proto = h.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");

  const host = h.get("x-forwarded-host") ?? h.get("host");

  if (!host) return null;

  return `${proto}://${host}`;
}

export const config = {
  matcher: [
    "/((?!api/auth|api/trpc|api/v1|trpc|_next|icons|images/splash|login|signup|auth-error|~offline|serwist/|manifest\\.webmanifest|sw\\.js|favicon\\.ico|favicon\\.svg|favicon-16x16\\.png|favicon-32x32\\.png|favicon-96x96\\.png|apple-touch-icon\\.png|android-chrome-192x192\\.png|android-chrome-512x512\\.png|web-app-manifest-192x192\\.png|web-app-manifest-512x512\\.png|site\\.webmanifest|logo\\.svg|404\\.jpg|nora\\.jpg|mockup-norish\\.png|robots|sounds/).*)",
  ],
};
