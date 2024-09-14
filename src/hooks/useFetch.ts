import { useState, useCallback } from 'react';

export type ApiError = {
  message: string;
  status?: number;
  retryAfter?: number;
};

export type UseFetchResult<T> = {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
  fetchData: (queryParams?: Record<string, any>) => Promise<void>;
};

export function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchData = useCallback(async (queryParams?: Record<string, any>) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryString = queryParams
        ? '?' +
          Object.entries(queryParams)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&')
        : '';
      const response = await fetch(`${url}${queryString}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'An error occurred', { cause: errorData });
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      if (error instanceof Error && error.cause) {
        setError({ 
          message: error.message,
          status: (error.cause as any).status,
          retryAfter: (error.cause as any).retryAfter
        });
      } else {
        setError({ message: 'An unexpected error occurred' });
      }
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  return { data, error, isLoading, fetchData };
}