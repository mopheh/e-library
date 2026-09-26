/* eslint-disable @typescript-eslint/no-require-imports -- plain Node (CommonJS) script */
// Runs N copies of `next start` sharing one port (Node cluster), to emulate
// a horizontally scaled deployment for load testing.
const cluster = require("cluster");
const N = Number(process.env.WORKERS || 4);
cluster.setupPrimary({
  exec: require.resolve("next/dist/bin/next"),
  args: ["start", "-p", process.env.PORT || "3100"],
  cwd: require("path").resolve(__dirname, "../.."),
});
for (let i = 0; i < N; i++) cluster.fork();
cluster.on("exit", (w, code) => { console.log(`worker ${w.process.pid} exited (${code}), restarting`); cluster.fork(); });
console.log(`cluster: ${N} next workers`);