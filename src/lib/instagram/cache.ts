/**
 * Instagram API Response Cache
 *
 * Simple in-memory TTL cache with LRU eviction for server-side API responses.
 * Cache keys follow the format: ig:{userId}:{method}:{params}
 */

// ── Types ──────────────────────────────────────────────────────────────────

interface CacheEntry<T = unknown> {
  value: T
  expiresAt: number // unix ms
  lastAccessed: number // unix ms, for LRU
}

export interface CacheTTLs {
  profile: number   // 5 min
  insights: number // 1 min
  media: number    // 2 min
  comments: number // 30 sec
  connection: number // 2 min
}

// ── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_TTLS: CacheTTLs = {
  profile: 5 * 60 * 1000,
  insights: 1 * 60 * 1000,
  media: 2 * 60 * 1000,
  comments: 30 * 1000,
  connection: 2 * 60 * 1000,
}

const MAX_ENTRIES = 100

// ── Cache Implementation ────────────────────────────────────────────────────

class InstagramCache {
  private entries = new Map<string, CacheEntry>()
  private ttls: CacheTTLs

  constructor(ttls: Partial<CacheTTLs> = {}) {
    this.ttls = { ...DEFAULT_TTLS, ...ttls }
  }

  /** Build a cache key */
  key(userId: string, method: string, params?: Record<string, string>): string {
    const paramStr = params
      ? Object.entries(params)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}=${v}`)
          .join('&')
      : ''
    return `ig:${userId}:${method}${paramStr ? ':' + paramStr : ''}`
  }

  /** Get a cached value. Returns undefined if missing or expired. */
  get<T = unknown>(cacheKey: string): T | undefined {
    const entry = this.entries.get(cacheKey)
    if (!entry) return undefined

    // Expired?
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(cacheKey)
      return undefined
    }

    // Touch for LRU
    entry.lastAccessed = Date.now()
    return entry.value as T
  }

  /** Set a cached value with a custom TTL (ms). */
  set<T = unknown>(cacheKey: string, value: T, ttlMs: number): void {
    // Evict if at capacity
    if (this.entries.size >= MAX_ENTRIES && !this.entries.has(cacheKey)) {
      this.evictOldest()
    }

    this.entries.set(cacheKey, {
      value,
      expiresAt: Date.now() + ttlMs,
      lastAccessed: Date.now(),
    })
  }

  /** Invalidate a single key. */
  delete(cacheKey: string): boolean {
    return this.entries.delete(cacheKey)
  }

  /** Invalidate all keys for a user. */
  invalidateUser(userId: string): void {
    const prefix = `ig:${userId}:`
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) {
        this.entries.delete(key)
      }
    }
  }

  /** Clear the entire cache. */
  clear(): void {
    this.entries.clear()
  }

  /** Get number of cached entries. */
  get size(): number {
    return this.entries.size
  }

  /** Convenience: get TTL for a category. */
  ttlFor(category: keyof CacheTTLs): number {
    return this.ttls[category]
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private evictOldest(): void {
    let oldestKey: string | undefined
    let oldestTime = Infinity

    for (const [key, entry] of this.entries) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.entries.delete(oldestKey)
    }
  }
}

// ── Singleton ────────────────────────────────────────────────────────────────

/** Global Instagram cache instance (server-side only). */
export const instagramCache = new InstagramCache()