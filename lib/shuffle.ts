/**
 * Fisher-Yates shuffle - returns a new array, uniformly shuffled.
 * (Unlike `array.sort(() => Math.random() - 0.5)`, which is biased.)
 */
export function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
