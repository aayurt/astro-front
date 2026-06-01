interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

const DB_NAME = 'astro-cache';
const STORE_NAME = 'api-cache';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const cacheDB = {
  async get<T>(key: string): Promise<T | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => {
        const entry = req.result as CacheEntry<T> | undefined;
        if (!entry) {
          resolve(null);
          return;
        }
        const expired = Date.now() - entry.timestamp > entry.ttl;
        if (expired) {
          resolve(null);
          return;
        }
        resolve(entry.data);
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  },

  async set<T>(key: string, data: T, ttl: number): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl };
      tx.objectStore(STORE_NAME).put(entry, key);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    });
  },

  async delete(key: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    });
  },

  async clear(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    });
  },
};

/**
 * Stale-while-revalidate: return cached data immediately if available,
 * then fetch fresh data in background and update cache.
 * If no cache, wait for the network call.
 */
export async function staleWhileRevalidate<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number,
  onData: (data: T, isStale: boolean) => void,
): Promise<void> {
  const cached = await cacheDB.get<T>(key);

  if (cached !== null) {
    onData(cached, true);
  }

  try {
    const fresh = await fetchFn();
    await cacheDB.set(key, fresh, ttl);
    onData(fresh, false);
  } catch (err) {
    if (cached === null) throw err;
    console.warn(`[Cache] Background refresh failed for "${key}":`, err);
  }
}
