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

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const path = req.nextUrl.pathname;

  // 1. If hitting a protected route, ensure we have a userId
  if (isProtectedRoute(req)) {
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // 2. Optimized user data check (using session claims/JWT)
    const { sessionClaims } = await auth();
    
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
