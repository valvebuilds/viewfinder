interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  // 1. Check in-flight requests (deduplication)
  if (inFlightRequests.has(key)) {
    console.log(`Cache: Deduplicating request for ${key}`);
    return inFlightRequests.get(key) as Promise<T>;
  }

  // 2. Check cache
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    console.log(`Cache: Serving from cache for ${key}`);
    return cached.data;
  }

  // 3. Fetch data if not in cache or expired
  console.log(`Cache: Fetching new data for ${key}`);
  const requestPromise = fetcher();
  inFlightRequests.set(key, requestPromise);

  try {
    const data = await requestPromise;
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  } finally {
    inFlightRequests.delete(key);
  }
}

export function invalidateCache(key: string) {
  cache.delete(key);
  console.log(`Cache: Invalidated cache for ${key}`);
}

export function invalidateAllCache() {
  cache.clear();
  console.log(`Cache: Invalidated all cache entries`);
}
