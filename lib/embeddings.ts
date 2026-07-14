import { Worker } from "worker_threads";
import * as path from "path";

type WorkerResponse = { id: number; embedding?: number[]; error?: string };

// The embedding model runs in a dedicated worker thread (lib/embedding-worker.cjs)
// instead of inline, so CPU-bound inference doesn't block Node's event loop and
// stall other concurrent requests (this is called directly from the live
// /api/ask and tutor request paths, not just background parsing). One worker is
// kept alive for the process lifetime - spawning/reloading the model per call
// would be far slower than the inference itself.
class EmbeddingWorker {
  private static worker: Worker | null = null;
  private static pending = new Map<number, { resolve: (v: number[]) => void; reject: (e: Error) => void }>();
  private static nextId = 0;

  private static getWorker(): Worker {
    if (!this.worker) {
      const worker = new Worker(path.join(process.cwd(), "lib", "embedding-worker.cjs"));

      worker.on("message", (msg: WorkerResponse) => {
        const pending = this.pending.get(msg.id);
        if (!pending) return;
        this.pending.delete(msg.id);
        if (msg.error) pending.reject(new Error(msg.error));
        else pending.resolve(msg.embedding!);
      });

      worker.on("error", (err) => {
        // The worker crashed - fail every in-flight request rather than hang,
        // and drop the reference so the next call spawns a fresh worker.
        for (const p of this.pending.values()) p.reject(err);
        this.pending.clear();
        this.worker = null;
      });

      worker.on("exit", () => {
        this.worker = null;
      });

      this.worker = worker;
    }
    return this.worker;
  }

  static embed(text: string): Promise<number[]> {
    const worker = this.getWorker();
    const id = this.nextId++;
    return new Promise<number[]>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage({ id, text });
    });
  }
}

/**
 * Returns the embeddings for the given text using a local ML model.
 * This runs completely offline and avoids all API quotas and costs!
 * @param text The string to embed
 * @returns An array of numbers representing the vector (768 dimensions)
 */
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    return await EmbeddingWorker.embed(text);
  } catch (error) {
    console.error("Local embedding generation failed:", error);
    return [];
  }
}
