// Realistic concurrent-student load test.
//
// Each VU is one student browsing the app: lands on the dashboard, then
// moves between the main pages with reading time in between. Every page
// view replays the exact API calls that page fires in a real browser
// (captured from Chrome's network log, Sept 2026), in parallel like the
// browser does, plus the page request itself.
//
// The browser's React Query cache is modelled too: on a client-side
// navigation, an endpoint is skipped if it was fetched within its hook's
// staleTime; a full page load (30% of views) starts with an empty cache.
// Set NO_CLIENT_CACHE=1 for the worst case (every view refetches all).
//
// Run (needs loadtest/tokens.json from ../setup-users.ts):
//   k6 run loadtest/k6/student-journeys.js
//   BASE_URL=http://localhost:3100 VUS=150 HOLD=5m k6 run loadtest/k6/student-journeys.js
//
// "page_load" is what a student actually waits for: the slowest call in
// a page's parallel batch. That's the number to judge lag by.
import http from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";
import { Trend, Rate } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3100";
const VUS = Number(__ENV.VUS || 150);
const HOLD = __ENV.HOLD || "5m";

const users = new SharedArray("students", () => JSON.parse(open("../tokens.json")));

const pageLoad = new Trend("page_load", true);
const pageOk = new Rate("page_ok");

// Endpoint names used for per-endpoint stats (ids stripped)
const ENDPOINTS = [
  "/api/me", "/api/notifications", "/api/users/courses", "/api/users/dashboard", "/api/analytics",
  "/api/plan", "/api/users/reading-session", "/api/goals", "/api/grades", "/api/ai-insights",
  "/api/study-logs", "/api/study-logs POST", "/api/departments", "/api/books", "/api/cbt/courses",
  "/api/courses", "/api/leaderboard", "page",
];
const PAGES = ["dashboard", "progress", "library", "cbt", "workspaces", "leaderboard", "grades", "study-log"];

export const options = {
  scenarios: {
    students: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: Math.round(VUS / 3) },
        { duration: "1m", target: VUS },
        { duration: HOLD, target: VUS },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    page_ok: ["rate>0.99"],
    page_load: ["p(95)<3000"],
    // Always-true thresholds so the summary breaks timings down per endpoint/page
    ...Object.fromEntries(ENDPOINTS.map((n) => [`http_req_duration{name:${n}}`, ["max>=0"]])),
    ...Object.fromEntries(PAGES.map((p) => [`page_load{page:${p}}`, ["max>=0"]])),
  },
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

// Distinct synthetic IP per VU (anonymous limits are per IP)
const ipFor = (vu) => `10.${Math.floor(vu / 65536) % 256}.${Math.floor(vu / 256) % 256}.${vu % 256}`;

function get(path, name, headers) {
  return ["GET", `${BASE_URL}${path}`, null, { headers, tags: { name } }];
}

const lagosToday = () => new Date(Date.now() + 3600_000).toISOString().slice(0, 10);

// Exact per-page API calls from the browser capture
function apiCalls(page, u) {
  const common = [["/api/me", "/api/me"], ["/api/notifications", "/api/notifications"], ["/api/users/courses", "/api/users/courses"]];
  const byPage = {
    dashboard: [["/api/users/dashboard"], ["/api/analytics"], ["/api/plan"], ["/api/users/reading-session"], ["/api/goals"]],
    progress: [["/api/grades"], ["/api/users/reading-session"], ["/api/goals"], ["/api/ai-insights"], ["/api/plan"], ["/api/analytics"]],
    grades: [["/api/grades"]],
    "study-log": [["/api/study-logs"]],
    library: [["/api/departments?skip=0&limit=1000", "/api/departments"], [`/api/books?departmentId=${u.departmentId}&page=1&pageSize=12`, "/api/books"]],
    cbt: [["/api/cbt/courses"], ["/api/courses"]],
    workspaces: [["/api/courses"]],
    leaderboard: [["/api/leaderboard?filter=department", "/api/leaderboard"]],
  };
  return [...common, ...byPage[page].map(([p, n]) => [p, n || p])];
}

// staleTime (seconds) per endpoint, from the hooks. 0 = refetched on every
// mount; Infinity = fetched once per full page load (layout-level)
const STALE_SECS = {
  "/api/me": 300, "/api/users/courses": 120, "/api/notifications": Infinity,
  "/api/users/dashboard": 3600, "/api/analytics": 300, "/api/plan": 60, "/api/users/reading-session": 120,
  "/api/goals": 300, "/api/grades": 300, "/api/ai-insights": 3600, "/api/study-logs": 60,
  "/api/departments": 300, "/api/books": 300, "/api/courses": 300, "/api/cbt/courses": 0, "/api/leaderboard": 0,
};
const clientCache = {}; // per VU (k6 VUs don't share module state)

const PAGE_PATH = {
  dashboard: "/dashboard", progress: "/dashboard/progress", grades: "/dashboard/grades", "study-log": "/dashboard/study-log",
  library: "/library", cbt: "/cbt", workspaces: "/workspaces", leaderboard: "/dashboard/leaderboard",
};

function pickPage(first) {
  if (first) return "dashboard";
  const weights = [["dashboard", 30], ["progress", 12], ["library", 16], ["cbt", 10], ["workspaces", 8], ["leaderboard", 8], ["grades", 8], ["study-log", 8]];
  let r = Math.random() * 100;
  for (const [p, w] of weights) { if ((r -= w) < 0) return p; }
  return "dashboard";
}

export default function () {
  const u = users[(__VU - 1) % users.length];
  const headers = { Authorization: `Bearer ${u.token}`, "X-Forwarded-For": ipFor(__VU) };
  const page = pickPage(__ITER === 0);

  // Full load 30% of the time (HTML), otherwise a client-side navigation (RSC payload)
  const fullLoad = __ITER === 0 || Math.random() < 0.3;
  const pageReq = fullLoad
    ? get(PAGE_PATH[page], "page", headers)
    : ["GET", `${BASE_URL}${PAGE_PATH[page]}`, null, { headers: { ...headers, RSC: "1" }, tags: { name: "page" } }];

  if (fullLoad) for (const k of Object.keys(clientCache)) delete clientCache[k];
  const now = Date.now();
  const calls = apiCalls(page, u).filter(([, n]) => {
    if (__ENV.NO_CLIENT_CACHE) return true;
    const last = clientCache[n];
    return last === undefined || (now - last) / 1000 >= STALE_SECS[n];
  });
  for (const [, n] of calls) clientCache[n] = now;

  const batch = [pageReq, ...calls.map(([p, n]) => get(p, n, headers))];
  const started = Date.now();
  const responses = http.batch(batch);
  const elapsed = Date.now() - started;

  const allOk = responses.every((r) => r.status === 200);
  pageOk.add(allOk, { page });
  pageLoad.add(elapsed, { page });
  for (const r of responses) {
    check(r, { "status 200": (res) => res.status === 200 });
    if (__ENV.DEBUG && r.status !== 200) {
      console.warn(`${r.status} ${r.request.method} ${r.request.url.replace(BASE_URL, "")} ${Math.round(r.timings.duration)}ms ${String(r.body).slice(0, 120)}`);
    }
  }

  // ~5% of page views: the student logs some offline study (a write that
  // also invalidates their cached analytics/plan)
  if (u.courseId && Math.random() < 0.05) {
    const res = http.post(
      `${BASE_URL}/api/study-logs`,
      JSON.stringify({ courseId: u.courseId, date: lagosToday(), timesRead: 1, minutes: 30, method: "NOTES" }),
      { headers: { ...headers, "Content-Type": "application/json" }, tags: { name: "/api/study-logs POST" } },
    );
    check(res, { "log study 201": (r) => r.status === 201 });
    // The app refetches the study-log page data after a save
    delete clientCache["/api/study-logs"];
    delete clientCache["/api/plan"];
  }

  // Reading time before the next page
  sleep(4 + Math.random() * 6);
}
