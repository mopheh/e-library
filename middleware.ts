// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";

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
import { redis } from "@/lib/redis";

// General API rate-limiter: 20 requests per 10 seconds per IP
const ratelimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "10 s"),
  analytics: true,
}) : null;

// Stricter limiter for the AI /ask endpoint: 10 requests per 60 seconds per IP
// This protects against LLM cost abuse at scale.
const askRatelimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  prefix: "ratelimit:ask",
  analytics: true,
}) : null;

let rateLimitWarnShown = false;

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const path = req.nextUrl.pathname;

  // Rate Limiting for API routes
  if (path.startsWith("/api")) {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";

    // Apply the stricter AI limiter first
    const limiter = (path === "/api/ask" && askRatelimit) ? askRatelimit : ratelimit;

    if (limiter) {
      try {
        const { success, limit, reset, remaining } = await limiter.limit(ip);
        if (!success) {
          return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            {
              status: 429,
              headers: {
                "X-RateLimit-Limit":     limit.toString(),
                "X-RateLimit-Remaining": remaining.toString(),
                "X-RateLimit-Reset":     reset.toString(),
              },
            }
          );
        }
      } catch (err) {
        // Fail OPEN: a Redis/Upstash hiccup should degrade rate-limiting,
        // not take down every API route on the site.
        if (!rateLimitWarnShown) {
          rateLimitWarnShown = true;
          console.warn("[middleware] Rate limiter unavailable, allowing requests through. Subsequent errors suppressed.", err);
        }
      }
    }
  }

  // 1. If hitting a protected route, ensure we have a userId
  if (isProtectedRoute(req)) {
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Extract role + onboarding from session claims.
    // Clerk stores publicMetadata directly on sessionClaims — NOT nested under
    // a "metadata" key. Some older JWT templates may still use "metadata", so
    // we fall back to that as well.
    const pub = (sessionClaims?.publicMetadata || sessionClaims?.metadata || {}) as any;
    const rawRole = (pub.role || "STUDENT") as string;
    // Normalise: "faculty-rep", "faculty rep", "FACULTY REP" -> "FACULTY REP"
    const role = rawRole.toUpperCase().replace("-", " ");
    const isOnboarded = pub.onboarded === true;

    // Redirect to onboarding page if metadata not complete (and not already on onboarding)
    if (!isOnboarded && path !== "/onboarding" && !path.startsWith("/api")) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // Protect /data and /admin pages: only ADMIN and FACULTY REP may enter.
    // The individual pages do their own fine-grained faculty-scope check,
    // so the middleware just needs to block students and aspirants here.
    let canAccessData = role === "ADMIN" || role === "FACULTY REP";
    
    if ((path.startsWith("/data") || path.startsWith("/admin")) && !canAccessData) {
      // Fallback: Check the DB directly if the JWT claim says they shouldn't have access.
      // This catches recently promoted admins whose Clerk JWTs haven't refreshed yet.
      try {
        const [dbUser] = await db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.clerkId, userId))
          .limit(1);
          
        if (dbUser && (dbUser.role === "ADMIN" || dbUser.role === "FACULTY REP")) {
          canAccessData = true;
        }
      } catch (err) {
        console.error("[middleware] DB fallback check failed:", err);
      }
      
      if (!canAccessData) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  return NextResponse.next();
}, {
  signInUrl: "/sign-in",
  signUpUrl: "/sign-up",
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
