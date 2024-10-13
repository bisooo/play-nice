import { useState, useEffect, useCallback } from 'react';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export function useClientCache<T>(
  key: string,
  fetchData: () => Promise<T>,
  duration: number = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCacheOrData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const cachedItem = localStorage.getItem(key);
    const parsedCache: CacheItem<T> | null = cachedItem ? JSON.parse(cachedItem) : null;

    if (parsedCache && Date.now() - parsedCache.timestamp < duration) {
      setData(parsedCache.data);
      setIsLoading(false);
      return;
    }

    try {
      const freshData = await fetchData();
      setData(freshData);
      localStorage.setItem(key, JSON.stringify({
        data: freshData,
        timestamp: Date.now()
      }));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [key, fetchData, duration]);

  useEffect(() => {
    fetchCacheOrData();
  }, [fetchCacheOrData]);

  return { data, isLoading, error };
}