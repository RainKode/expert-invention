/**
 * In-memory client-side fetch cache with stale-while-revalidate semantics.
 *
 * - First call: network fetch, result cached
 * - Subsequent calls within `freshMs`: return cache instantly (no network)
 * - Calls after `freshMs` but before `staleMs`: return cache instantly AND revalidate in background
 * - Calls after `staleMs`: full network fetch (stale entry evicted)
 * - Mutations: call `invalidate(prefix)` to bust related entries
 *
 * This makes repeat page navigations feel instant while keeping data fresh.
 * Deploy updates don't matter — this is session-only (memory, not disk).
 */

interface CacheEntry {
  data: unknown
  timestamp: number
  promise?: Promise<unknown>
}

const cache = new Map<string, CacheEntry>()

/** Default: fresh for 15s, stale-but-servable for 2 minutes */
const DEFAULT_FRESH_MS = 15_000
const DEFAULT_STALE_MS = 120_000

/**
 * Cached fetch with stale-while-revalidate.
 * Only caches GET-style requests (no body).
 */
export async function cachedFetch<T = unknown>(
  url: string,
  opts?: {
    freshMs?: number
    staleMs?: number
    init?: RequestInit
  }
): Promise<T> {
  const freshMs = opts?.freshMs ?? DEFAULT_FRESH_MS
  const staleMs = opts?.staleMs ?? DEFAULT_STALE_MS
  const now = Date.now()
  const entry = cache.get(url)

  // Fresh hit — return immediately
  if (entry && (now - entry.timestamp) < freshMs) {
    return entry.data as T
  }

  // Stale hit — return cached but revalidate in background
  if (entry && (now - entry.timestamp) < staleMs) {
    if (!entry.promise) {
      entry.promise = networkFetch(url, opts?.init).then((data) => {
        cache.set(url, { data, timestamp: Date.now() })
        return data
      }).catch(() => {
        // Revalidation failed — keep stale data, clear promise so we retry
        if (entry) entry.promise = undefined
      })
    }
    return entry.data as T
  }

  // Cache miss or expired — wait for network
  const data = await networkFetch(url, opts?.init)
  cache.set(url, { data, timestamp: Date.now() })
  return data as T
}

async function networkFetch(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.json()
}

/**
 * Invalidate all cache entries whose key starts with the given prefix.
 * Call this after mutations (POST/PATCH/DELETE) to bust stale data.
 *
 * Examples:
 *   invalidateCache('/api/tasks')      — busts task list + individual tasks
 *   invalidateCache('/api/notifications') — busts notification list
 *   invalidateCache()                  — busts everything
 */
export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
}
