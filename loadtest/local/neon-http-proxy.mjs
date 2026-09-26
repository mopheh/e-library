// Local stand-in for Neon's SQL-over-HTTP endpoint, for load testing the
// app against a local Postgres (same protocol @neondatabase/serverless uses):
//   POST /sql  {query, params}          -> {fields, rows, command, rowCount}
//   POST /sql  {queries:[{query,params}]} -> {results:[...]}  (one transaction)
// Rows are arrays of raw text values (Neon-Raw-Text-Output / Array-Mode);
// the driver parses types itself from fields[].dataTypeID.
import http from "http";
import { createRequire } from "module";
const require = createRequire(new URL("../../package.json", import.meta.url));
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.PG_URL || "postgres://postgres:postgres@localhost:54317/main",
  max: Number(process.env.POOL || 60),
});
const raw = { getTypeParser: () => (v) => v };
const PORT = Number(process.env.PORT || 4444);

const toResult = (r) => ({
  command: r.command,
  rowCount: r.rowCount,
  rows: r.rows,
  fields: r.fields.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID, tableID: f.tableID, columnID: f.columnID, dataTypeSize: f.dataTypeSize, dataTypeModifier: f.dataTypeModifier, format: "text" })),
  rowAsArray: true,
});
const q = (client, { query, params }) => client.query({ text: query, values: params ?? [], rowMode: "array", types: raw });

let served = 0, errors = 0;
http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", async () => {
    res.setHeader("Content-Type", "application/json");
    try {
      const payload = JSON.parse(body);
      if (Array.isArray(payload.queries)) {
        const client = await pool.connect();
        try {
          const iso = req.headers["neon-batch-isolation-level"];
          await client.query(`BEGIN${iso ? " ISOLATION LEVEL " + String(iso).replace(/[^A-Za-z ]/g, "") : ""}`);
          const results = [];
          for (const item of payload.queries) results.push(toResult(await q(client, item)));
          await client.query("COMMIT");
          res.end(JSON.stringify({ results }));
        } catch (e) {
          await client.query("ROLLBACK").catch(() => {});
          throw e;
        } finally {
          client.release();
        }
      } else {
        res.end(JSON.stringify(toResult(await q(pool, payload))));
      }
      served++;
    } catch (e) {
      errors++;
      res.statusCode = 400;
      res.end(JSON.stringify({ message: e.message, code: e.code, detail: e.detail, severity: e.severity, constraint: e.constraint, table: e.table, column: e.column }));
    }
  });
}).listen(PORT, () => console.log(`neon http proxy on :${PORT}`));

setInterval(() => console.log(`served=${served} errors=${errors} pool total=${pool.totalCount} idle=${pool.idleCount} waiting=${pool.waitingCount}`), 30_000).unref();
