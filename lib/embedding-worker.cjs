// Runs the local @xenova/transformers embedding model in a dedicated worker
// thread, kept alive for the life of the server process (see lib/embeddings.ts).
// Computing embeddings inline on the main thread would block Node's single
// event loop for the duration of each inference call, stalling every other
// concurrent request (DB queries, other API routes, etc.) while it runs.
// This file is a plain CommonJS script loaded directly via `new Worker(path)`,
// not part of the Next.js/webpack module graph, so it intentionally uses
// require()/dynamic import() rather than ESM import syntax.
/* eslint-disable @typescript-eslint/no-require-imports */
const { parentPort } = require("worker_threads");

const TASK = "feature-extraction";
const MODEL = "Xenova/all-mpnet-base-v2";

let extractorPromise = null;
function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = import("@xenova/transformers").then(({ pipeline }) =>
      pipeline(TASK, MODEL),
    );
  }
  return extractorPromise;
}

parentPort.on("message", async (msg) => {
  const { id, text } = msg;
  try {
    const extractor = await getExtractor();
    const output = await extractor(text, { pooling: "mean", normalize: true });
    parentPort.postMessage({ id, embedding: Array.from(output.data) });
  } catch (err) {
    parentPort.postMessage({ id, error: err instanceof Error ? err.message : String(err) });
  }
});
