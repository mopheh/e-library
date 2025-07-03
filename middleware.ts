// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Set which routes you want Clerk to run on
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return NextResponse.next();

  const authData = await auth(); // capture Clerk auth data

  // console.log("🔐 Clerk auth() output:", authData);

  const { userId } = authData;
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
  // Fetch user data from Clerk backend to access metadata
  const userRes = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
    },
  });

  const user = await userRes.json();
  const role = user.unsafe_metadata?.role || "student";
  const isOnboarded = user.unsafe_metadata?.onboarded === true;

  // Redirect to onboarding page if metadata not complete
  if (!isOnboarded) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  if (req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
  }

  const path = req.nextUrl.pathname;

  // 🔒 Strict protection for /dashboard/admin/data
  if (path === "/dashboard/admin/data" && role !== "admin") {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
  }
  if (path === "/dashboard/admin" && role !== "admin") {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    "/dashboard/:path*",
    "/",
  ],
};
// | Color      | Purpose     | Hex                               |
// | ---------- | ----------- | --------------------------------- |
// | Primary    | Deep Blue   | `#1E3A8A` (trust, authority)      |
// | Secondary  | Soft Cyan   | `#22D3EE` (tech & accessibility)  |
// | Accent     | Warm Yellow | `#FACC15` (attention, highlights) |
// | Background | Light Gray  | `#F9FAFB` (clean UI)              |
// | Text       | Charcoal    | `#1F2937`                         |
