// Load test for the read-heavy, auth-required API surface fixed/audited in
// the production-readiness pass (leaderboard, books, senior-qa,
// opportunities, users, study-rooms, workspaces, dashboard, notifications).
// Deliberately excludes AI-touching endpoints (/api/ask, tutor, question
// generation) - those hit paid provider APIs and are load-tested separately
// at a small, fixed VU count via ai-smoke.js.
//
// Run:
//   k6 run loadtest/k6/read-heavy.js
//   BASE_URL=http://localhost:3001 MAX_VUS=1000 k6 run loadtest/k6/read-heavy.js
//
// Requires loadtest/tokens.json (see ../setup-users.ts) - a pool of real
// Clerk session tokens for throwaway test users, each tagged with a
// departmentId/courseId to hit scoped endpoints realistically.
import http from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3001";
const MAX_VUS = Number(__ENV.MAX_VUS || 1000);

const users = new SharedArray("loadtest users", function () {
  return JSON.parse(open("../tokens.json"));
});

export const options = {
  scenarios: {
    ramping_load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: Math.min(50, MAX_VUS) },
        { duration: "1m", target: Math.min(200, MAX_VUS) },
        { duration: "2m", target: Math.min(500, MAX_VUS) },
        { duration: "2m", target: MAX_VUS },
        { duration: "3m", target: MAX_VUS }, // hold at peak
        { duration: "1m", target: 0 }, // ramp down
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    // Informative, not a hard CI gate - a local `next start` competing with
    // k6 for CPU on the same machine will not hit production latency, so
    // these are sanity bounds (catch real breakage) rather than SLAs.
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<3000"],
  },
};

// Each VU = one simulated distinct real user, so it gets its own synthetic
// source IP. Without this, every k6 request shares the test machine's real
// IP and the middleware's per-IP rate limiter (20 req/10s) throttles almost
// all traffic after the first few requests - that would measure "does the
// rate limiter work" instead of "how does the app perform under 1000
// concurrent users", which is a different, already-covered question.
function syntheticIp(vu) {
  return `10.${Math.floor(vu / 65536) % 256}.${Math.floor(vu / 256) % 256}.${vu % 256}`;
}

function headersFor(user, vu) {
  return {
    Authorization: `Bearer ${user.token}`,
    "X-Forwarded-For": syntheticIp(vu),
  };
}

function pick(weightedFns) {
  const total = weightedFns.reduce((s, [w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [w, fn] of weightedFns) {
    if (r < w) return fn;
    r -= w;
  }
  return weightedFns[weightedFns.length - 1][1];
}

// Simulates a dashboard page mount: several widgets fetching in parallel.
function dashboardHome(user, headers) {
  const responses = http.batch([
    ["GET", `${BASE_URL}/api/me`, null, { headers }],
    ["GET", `${BASE_URL}/api/users/dashboard`, null, { headers }],
    ["GET", `${BASE_URL}/api/notifications`, null, { headers }],
    ["GET", `${BASE_URL}/api/leaderboard?filter=department`, null, { headers }],
  ]);
  for (const res of responses) {
    check(res, { "dashboard batch: status is 200": (r) => r.status === 200 });
  }
}

function browseBooks(user, headers) {
  const page = 1 + Math.floor(Math.random() * 3);
  const res = http.get(
    `${BASE_URL}/api/books?departmentId=${user.departmentId}&page=${page}&pageSize=12`,
    { headers },
  );
  check(res, { "books: status is 200": (r) => r.status === 200 });
}

function communityBrowse(user, headers) {
  const responses = http.batch([
    ["GET", `${BASE_URL}/api/senior-qa?targetLevel=ALL`, null, { headers }],
    ["GET", `${BASE_URL}/api/opportunities`, null, { headers }],
    ["GET", `${BASE_URL}/api/users?departmentId=${user.departmentId}`, null, { headers }],
  ]);
  for (const res of responses) {
    check(res, { "community batch: status is 200": (r) => r.status === 200 });
  }
}

function courseWorkspace(user, headers) {
  if (!user.courseId) return;
  const responses = http.batch([
    ["GET", `${BASE_URL}/api/courses/${user.courseId}/study-rooms`, null, { headers }],
    ["GET", `${BASE_URL}/api/workspaces/${user.courseId}`, null, { headers }],
  ]);
  for (const res of responses) {
    check(res, { "workspace batch: status is 200": (r) => r.status === 200 });
  }
}

function departmentLeaderboard(user, headers) {
  const res = http.get(`${BASE_URL}/api/departments/${user.departmentId}/leaderboard`, { headers });
  check(res, { "department leaderboard: status is 200": (r) => r.status === 200 });
}

export default function () {
  const user = users[__VU % users.length];
  const headers = headersFor(user, __VU);

  const scenario = pick([
    [40, dashboardHome],
    [20, browseBooks],
    [20, communityBrowse],
    [10, courseWorkspace],
    [10, departmentLeaderboard],
  ]);

  scenario(user, headers);

  // Simulated think time between page loads/navigations.
  sleep(1 + Math.random() * 2);
}
