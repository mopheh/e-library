// Small, fixed-scale smoke test for the AI-touching endpoints (/api/ask,
// tutor) that call paid Gemini/OpenAI/DeepSeek/OpenRouter APIs per request.
// Deliberately NOT part of the main read-heavy ramp - this holds a low,
// constant VU count so it only confirms these endpoints don't error/hang
// under a *little* concurrency, without burning real provider API spend.
//
// Run:
//   k6 run loadtest/k6/ai-smoke.js
import http from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3001";
const VUS = Number(__ENV.AI_SMOKE_VUS || 5);

const users = new SharedArray("loadtest users", function () {
  return JSON.parse(open("../tokens.json"));
});

export const options = {
  scenarios: {
    ai_smoke: {
      executor: "constant-vus",
      vus: VUS,
      duration: __ENV.AI_SMOKE_DURATION || "30s",
    },
  },
  // No hard thresholds - the point is to observe, not gate. Provider
  // latency (multi-second LLM calls) is expected and not a failure.
};

const SAMPLE_QUESTIONS = [
  "What is the difference between a stack and a queue?",
  "Summarize the key causes of the Cold War.",
  "Explain Thevenin's theorem in simple terms.",
  "What are the main functions of the human liver?",
];

function syntheticIp(vu) {
  return `10.1.${Math.floor(vu / 256) % 256}.${vu % 256}`;
}

export default function () {
  const user = users[__VU % users.length];
  const headers = {
    Authorization: `Bearer ${user.token}`,
    "X-Forwarded-For": syntheticIp(__VU),
    "Content-Type": "application/json",
  };

  const question = SAMPLE_QUESTIONS[Math.floor(Math.random() * SAMPLE_QUESTIONS.length)];

  const res = http.post(
    `${BASE_URL}/api/ask`,
    JSON.stringify({ messages: [{ role: "user", content: question }] }),
    { headers, timeout: "60s" },
  );

  check(res, {
    "ask: status is 200 or 429 (rate-limited, not crashed)": (r) => r.status === 200 || r.status === 429,
    "ask: did not 500": (r) => r.status !== 500,
  });

  // Long think time - real users don't fire AI questions back-to-back, and
  // this endpoint has its own stricter rate limit (10 req/60s/IP) to respect.
  sleep(15 + Math.random() * 15);
}
