// Minimal Upstash-REST-compatible bridge over a local redis-server, for load
// testing only (the project's Upstash database no longer resolves).
// Protocol: POST /            body ["CMD", ...args]      -> {result}
//           POST /pipeline    body [[...], [...]]        -> [{result}, ...]
//           POST /multi-exec  body [[...], [...]]        -> [{result}, ...]
// With "Upstash-Encoding: base64", string results are base64 (except "OK").
import http from "http";
import { createRequire } from "module";
const require = createRequire(new URL("../../package.json", import.meta.url));
const Redis = require("ioredis");

const redis = new Redis({ port: Number(process.env.REDIS_PORT || 6390), enableAutoPipelining: true });
const PORT = Number(process.env.BRIDGE_PORT || 8079);

const enc = (v, b64) => {
  if (!b64) return v;
  if (typeof v === "string") return v === "OK" ? v : Buffer.from(v).toString("base64");
  if (Array.isArray(v)) return v.map((x) => enc(x, b64));
  return v;
};

async function run(cmd) {
  const [name, ...args] = cmd;
  return redis.call(String(name), ...args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))));
}

let served = 0;
http
  .createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", async () => {
      const b64 = (req.headers["upstash-encoding"] || "").toLowerCase() === "base64";
      res.setHeader("Content-Type", "application/json");
      try {
        const parsed = JSON.parse(body || "[]");
        const path = req.url.split("?")[0];
        if (path.endsWith("/pipeline") || path.endsWith("/multi-exec")) {
          const out = [];
          for (const cmd of parsed) {
            try { out.push({ result: enc(await run(cmd), b64) }); }
            catch (e) { out.push({ error: e.message }); }
          }
          res.end(JSON.stringify(out));
        } else {
          res.end(JSON.stringify({ result: enc(await run(parsed), b64) }));
        }
        served++;
      } catch (e) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  })
  .listen(PORT, () => console.log(`upstash bridge on :${PORT} -> redis :${process.env.REDIS_PORT || 6390}`));

setInterval(() => served && console.log(`served ${served} requests`), 30_000).unref();
