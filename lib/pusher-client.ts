// lib/pusher-client.ts
//
// A module-level singleton Pusher client.
//
// Problem: Every time a React component does `new Pusher(...)` inside useEffect
// it opens a BRAND NEW WebSocket connection, even if the previous instance is
// still alive.  At 1,000 users, components that re-mount (hot-reload, Strict
// Mode double-invoke, route transitions) can easily multiply the real
// connection count 3-5×, blowing through Pusher's concurrent-connection limit
// on the free / starter plan.
//
// Solution: return the single app-wide instance and increment a reference
// counter.  Only disconnect when the last consumer calls `releasePusher()`.

import Pusher from "pusher-js";

let instance: Pusher | null = null;
let refCount = 0;

function getKey()     { return process.env.NEXT_PUBLIC_PUSHER_KEY!; }
function getCluster() { return process.env.NEXT_PUBLIC_PUSHER_CLUSTER!; }

/**
 * Get (or lazily create) the shared Pusher client.
 * Call `releasePusher()` in the cleanup function of your `useEffect`.
 */
export function getPusherClient(): Pusher {
  if (!instance) {
    instance = new Pusher(getKey(), { cluster: getCluster() });
  }
  refCount++;
  return instance;
}

/**
 * Decrement the reference counter.
 * When it reaches 0, the underlying connection is disconnected and
 * the singleton is cleared so it can be re-created fresh on next use.
 */
export function releasePusher(): void {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && instance) {
    instance.disconnect();
    instance = null;
  }
}
