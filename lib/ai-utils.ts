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
      const isRateLimit = err.status === 429 || err.message.includes("429") || err.message.includes("RESOURCE_EXHAUSTED");

      if ((isNetworkError || isRateLimit) && i < retries - 1) {
        console.warn(`⚠️ ${isRateLimit ? 'Rate limit' : 'Network error'} (${err.message}). Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise((res) => setTimeout(res, delay));
        // If rate limited, use longer backoff
        delay = isRateLimit ? delay * 3 : delay * 2; 
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
