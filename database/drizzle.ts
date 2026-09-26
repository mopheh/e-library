import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Load testing / local dev against a plain Postgres: route the HTTP driver
// through Neon's local proxy (ghcr.io/timowilhelm/local-neon-http-proxy).
// Only active when NEON_LOCAL_PROXY is set - never in production.
if (process.env.NEON_LOCAL_PROXY) {
  neonConfig.fetchEndpoint = (host) => `http://${host}:${process.env.NEON_LOCAL_PROXY}/sql`;
}

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });
