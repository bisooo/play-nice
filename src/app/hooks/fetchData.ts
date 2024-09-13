import { useState, useEffect } from 'react';

export type UseFetchResult<T> = {
  data: T | null;
  error: string | null;
  isLoading: boolean;
};

export function useFetch<T>(url: string, queryParams?: Record<string, any>): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const queryString = queryParams
          ? '?' +
            Object.entries(queryParams)
              .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
              .join('&')
          : '';
        const response = await fetch(`${url}${queryString}`);

        // Handle rate limiting
        if (response.status === 429) {
          throw new Error('Too many requests, please try again later.');
        }
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [url, JSON.stringify(queryParams)]);

  return { data, error, isLoading };
}
