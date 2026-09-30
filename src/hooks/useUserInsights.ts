import { TimeRange } from '@prisma/client';
import { useEffect, useRef, useState } from 'react';
import { UserInsights } from '@/types/user';
import { useTopItemsSync } from '@/components/TopItemsSync';

// Reads straight from the DB (no client cache) so a background sync always shows up
export function useUserInsights(timeRange: TimeRange) {
  const syncStatus = useTopItemsSync();
  const [data, setData] = useState<UserInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    // Wait for the page-load sync so stale lists never flash before fresh ones
    if (syncStatus !== 'done') return;

    const id = ++requestId.current;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const response = await fetch(`/api/user-insights?timeRange=${timeRange}`);
        if (!response.ok) {
          throw new Error('Failed to fetch insights');
        }
        const insights: UserInsights = await response.json();
        if (id === requestId.current) setData(insights);
      } catch (err) {
        if (id === requestId.current) setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        if (id === requestId.current) setIsLoading(false);
      }
    })();
  }, [timeRange, syncStatus]);

  return { data, isLoading, error };
}
