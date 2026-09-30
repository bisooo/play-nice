import { useState } from 'react';
import { clearClientCache } from './useClientCache';
import { USER_INSIGHTS_CACHE_PREFIX } from './useUserInsights';

interface UpdateResult {
  success: boolean;
  message: string;
}

export function useUpdateUserTopItems() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateUserTopItems = async (): Promise<UpdateResult> => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/internal/updateUserTopItems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // The dashboard caches insights for 24h; drop them so it reads the new sync
      clearClientCache(USER_INSIGHTS_CACHE_PREFIX);
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error updating top items:', error);
      return { success: false, message: 'Failed to update top items. Please try again later.' };
    } finally {
      setIsUpdating(false);
    }
  };

  return { isUpdating, updateUserTopItems };
}