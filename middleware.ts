// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Set which routes you want Clerk to run on
const isProtectedRoute = createRouteMatcher([
  "/(.*)/dashboard",
  "/student(.*)",
  "/admin(.*)",
  "/",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return NextResponse.next();

  const authData = await auth(); // capture Clerk auth data

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
    return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
  }

  const path = req.nextUrl.pathname;

  // 🔒 Strict protection for /dashboard/admin/data
  if (path === "/dashboard/admin/data" && role !== "admin") {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
  }
  if (path === "/dashboard/admin" && role !== "admin") {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    "/:path*",
    "/",
  ],
};
// middleware.ts
// import { clerkMiddleware } from "@clerk/nextjs/server"
// import { NextResponse } from "next/server"

// export default clerkMiddleware(async (auth, req) => {
//   const { userId } = await auth()
//   const path = req.nextUrl.pathname

//   // ✅ Allow static/public assets and Clerk auth routes
//   const safePrefixes = [
//     "/_next",
//     "/api",
//     "/trpc",
//     "/favicon.ico",
//     "/images",
//     "/fonts",
//     "/uploads",
//     "/icons",
//     "/univault.png",
//   ]
//   const clerkAuthRoutes = [
//     "/sign-in",
//     "/sign-up",
//     "/sso-callback",
//     "/reset-password",
//   ]

//   if (
//     safePrefixes.some((prefix) => path.startsWith(prefix)) ||
//     clerkAuthRoutes.includes(path)
//   ) {
//     return NextResponse.next()
//   }
//   // ✅ Allow static files (even in root) based on extension
//   const staticFilePattern =
//     /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?|ttf|pdf|csv|docx?|xlsx?|zip|webmanifest)$/
//   if (staticFilePattern.test(path)) {
//     return NextResponse.next()
//   }
//   // ✅ Allow signed-in users only
//   if (!userId) {
//     return NextResponse.redirect(new URL("/sign-in", req.url))
//   }

//   // ✅ Allow access to /admin/data/...
//   if (path.startsWith("/admin/data")) {
//     return NextResponse.next()
//   }

//   // 🚫 Redirect all other routes to /admin/data
//   return NextResponse.redirect(new URL("/admin/data", req.url))
// })

// export const config = {
//   matcher: [
//     "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
//     "/(api|trpc)(.*)",
//     "/:path*",
//     "/",
//   ],
// }
