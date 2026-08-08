interface CacheEntry<T> {
  value: T;
  expires: number;
}

export function readLocalCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (entry.expires < Date.now()) {
      window.localStorage.removeItem(key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

export function writeLocalCache<T>(key: string, value: T, ttlMs: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ value, expires: Date.now() + ttlMs }));
  } catch {
    // storage full or disabled — caching is a nice-to-have, fail silently
  }
}
