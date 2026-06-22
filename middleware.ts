// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// We now strictly protect EVERYTHING under /dashboard, /courses, /library, /book, /data, /connect ...
// Notice the unified matcher
const isProtectedRoute = createRouteMatcher([
  "/(.*)/dashboard(.*)",
  "/dashboard(.*)",
  "/connect(.*)",
  "/cbt(.*)",
  "/library(.*)",
  "/book(.*)",
  "/data(.*)",
  "/roadmap(.*)",
  "/preview(.*)",
  "/profile(.*)",
  "/verify(.*)",
]);

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize rate limiter only if ENV vars exist
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Create a new ratelimiter, that allows 20 requests per 10 seconds
const ratelimit = redis ? new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, "10 s"),
  analytics: true,
}) : null;

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const path = req.nextUrl.pathname;

  // Rate Limiting for API routes
  if (path.startsWith("/api") && ratelimit) {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const { success, pending, limit, reset, remaining } = await ratelimit.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString()
          }
        }
      );
    }
  }

  // 1. If hitting a protected route, ensure we have a userId
  if (isProtectedRoute(req)) {
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // 2. Optimized user data check (using session claims/JWT)
    
    // Extract metadata from session claims (must be configured in Clerk Dashboard)
    const metadata = (sessionClaims?.metadata || {}) as any;
    const role = (metadata.role || "STUDENT").toUpperCase();
    const isOnboarded = metadata.onboarded === true;

    // Redirect to onboarding page if metadata not complete (and not already on onboarding)
    if (!isOnboarded && path !== "/onboarding" && !path.startsWith("/api")) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // 🔒 Strict protection for Admin Data - redirect non-admins back to dashboard
    if ((path.startsWith("/data") || path.startsWith("/admin")) && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
