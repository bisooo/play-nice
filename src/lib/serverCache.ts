interface CacheItem<T> {
    data: T;
    expiry: number;
  }
  
  class ServerCache {
    private cache: Map<string, CacheItem<any>>;
    private defaultDuration: number;
  
    constructor(defaultDuration: number = 60 * 60 * 1000) { // 1 hour in milliseconds
      this.cache = new Map();
      this.defaultDuration = defaultDuration;
    }
  
    get<T>(key: string): T | null {
      const item = this.cache.get(key);
      if (!item) return null;
      if (Date.now() > item.expiry) {
        this.cache.delete(key);
        return null;
      }
      return item.data as T;
    }
  
    set<T>(key: string, data: T, duration?: number): void {
      this.cache.set(key, {
        data,
        expiry: Date.now() + (duration || this.defaultDuration)
      });
    }
  
    delete(key: string): void {
      this.cache.delete(key);
    }
  
    clear(): void {
      this.cache.clear();
    }
  }
  
  export const serverCache = new ServerCache();