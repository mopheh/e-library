// This worker runs as a plain long-lived Node process (`tsx workers/index.ts`),
// entirely outside the Next.js request lifecycle — so none of the app's
// automatic Sentry instrumentation (instrumentation.ts's onRequestError,
// the Next.js webpack/turbopack plugin) ever sees it. Without this, a
// background job that throws, or the process itself crashing, is invisible:
// books just sit stuck "parsing" forever with nobody notified. Import this
// first (before anything else) in workers/index.ts.
import "./bootstrap";
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    environment: process.env.NODE_ENV || "development",
  });
} else {
  console.warn("[sentry] NEXT_PUBLIC_SENTRY_DSN/SENTRY_DSN not set — worker error tracking is disabled.");
}

export { Sentry };
