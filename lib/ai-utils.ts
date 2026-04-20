/**
 * Helper to retry a function with exponential backoff and a timeout.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
  timeoutMs: number = 30000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < retries; i++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Operation timed out")), timeoutMs)
      );

      // Race the function against the timeout
      return (await Promise.race([fn(), timeoutPromise])) as T;
    } catch (err: any) {
      lastError = err;
      const isNetworkError = 
        err.message.includes("ECONNRESET") || 
        err.message.includes("ETIMEDOUT") ||
        err.message.includes("fetch failed") ||
        err.message.includes("Operation timed out");

      if (isNetworkError && i < retries - 1) {
        console.warn(`⚠️ Network error (${err.message}). Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
