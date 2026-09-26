# Local load-test stack

Runs the app against a local Postgres with **synthetic** data (no production
data is copied), so a load test measures the app, not the internet link to
Neon. Used for the 150-concurrent-student test (Sept 2026).

| Piece | What it does |
|---|---|
| `docker run pgvector/pgvector:pg17` | Postgres 17 + pgvector (same major version as Neon) |
| `neon-http-proxy.mjs` | Neon's SQL-over-HTTP protocol → local Postgres, so `@neondatabase/serverless` works unchanged (`NEON_LOCAL_PROXY` in `database/drizzle.ts`) |
| `upstash-bridge.mjs` | Upstash REST protocol → local `redis-server` |
| `seed-synthetic.cjs` | Production-sized fake data + local rows for the `tokens.json` accounts |
| `cluster.cjs` | N × `next start` on one port (emulates horizontal scaling) |

```bash
# 1. Postgres + schema (from schema.ts - the migration history can't build a fresh DB)
docker run -d --name loadtest-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=main -p 54317:5432 \
  pgvector/pgvector:pg17 postgres -c max_connections=300
docker exec loadtest-db psql -U postgres -d main -c "create extension vector; create extension pg_trgm;"
DATABASE_URL=postgres://postgres:postgres@localhost:54317/main npx drizzle-kit push --force

# 2. Test accounts (Clerk dev instance caps at 100 users) + synthetic data
npx tsx --env-file=.env loadtest/setup-users.ts
node loadtest/local/seed-synthetic.cjs

# 3. Redis + the two protocol bridges
redis-server --port 6390 --save "" --daemonize yes
node loadtest/local/upstash-bridge.mjs &
node loadtest/local/neon-http-proxy.mjs &

# 4. Build + run the app against it (CLERK_JWT_KEY = instance public key, PEM;
#    verifies tokens without network calls)
export NEON_LOCAL_PROXY=4444 DATABASE_URL=postgres://postgres:postgres@localhost:54317/main \
  UPSTASH_REDIS_REST_URL=http://localhost:8079 UPSTASH_REDIS_REST_TOKEN=local
npm run build && WORKERS=4 PORT=3100 node loadtest/local/cluster.cjs &

# 5. Load
k6 run -e VUS=150 -e HOLD=5m loadtest/k6/student-journeys.js
npx tsx --env-file=.env loadtest/cleanup-users.ts   # afterwards
```

Session tokens from `setup-users.ts` last 3 hours - re-run it before a long session.
