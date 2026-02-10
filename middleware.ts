import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiting map
// note: in a serverless environment this would be reset frequently,
// but in a containerized long-running process (like Coolify), this persists nicely.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function middleware(request: NextRequest) {
    // Only apply to /api/ routes
    if (!request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.next();
    }

    // Get IP address
    // In Next.js, request.ip might be available, or we check x-forwarded-for
    const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "unknown";

    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour window
    const maxRequests = 1000; // 1000 requests per hour

    const record = rateLimitMap.get(ip);

    // If no record or window expired, reset
    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        return NextResponse.next();
    }

    // Check limit
    if (record.count >= maxRequests) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);

        // Log the event for visibility (optional)
        console.warn(`[Middleware] Rate limit exceeded for IP: ${ip}`);

        return NextResponse.json(
            { error: "Rate limit exceeded" },
            {
                status: 429,
                headers: {
                    "X-Retry-After": String(retryAfter),
                    "Content-Type": "application/json"
                }
            }
        );
    }

    // Increment count
    record.count++;
    return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
    matcher: "/api/:path*",
};
