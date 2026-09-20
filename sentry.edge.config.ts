import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,

    // 100% in dev is fine; sampled down in prod so tracing doesn't get
    // expensive/noisy at real concurrent-user volume.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.15 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });
} else {
  // No silent fallback to a fake DSN — that makes Sentry "work" while
  // quietly capturing nothing, with no signal that anything is wrong.
  console.warn("[sentry] NEXT_PUBLIC_SENTRY_DSN/SENTRY_DSN not set — edge error tracking is disabled.");
}
