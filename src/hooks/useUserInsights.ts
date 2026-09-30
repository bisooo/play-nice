import { TimeRange } from '@prisma/client';
import { useClientCache } from './useClientCache';
import { UserInsights } from '@/types/user';
import { useCallback } from 'react';

export const USER_INSIGHTS_CACHE_PREFIX = 'userInsights_';

export function useUserInsights(timeRange: TimeRange) {
  const fetchInsights = useCallback(async (): Promise<UserInsights> => {
    const response = await fetch(`/api/user-insights?timeRange=${timeRange}`);
    if (!response.ok) {
      throw new Error('Failed to fetch insights');
    }
    return response.json();
  }, [timeRange]);

  return useClientCache<UserInsights>(`${USER_INSIGHTS_CACHE_PREFIX}${timeRange}`, fetchInsights);
}