"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { TimeRange } from "@prisma/client";
import { UserInsights } from "@/types/user";
import { useTopItemsSync } from "@/components/TopItemsSync";

const TIME_RANGES = [
  TimeRange.SHORT_TERM,
  TimeRange.MEDIUM_TERM,
  TimeRange.LONG_TERM,
];

type InsightsState = {
  data: Partial<Record<TimeRange, UserInsights>>;
  errors: Partial<Record<TimeRange, Error>>;
};

const UserInsightsContext = createContext<InsightsState>({ data: {}, errors: {} });

// Preloads every time range once the page-load sync is done, so On Repeat never waits on a
// fetch. Memory only (no localStorage), fetched after the sync, so it can't hide a fresh one.
export function UserInsightsProvider({ children }: { children: ReactNode }) {
  const syncStatus = useTopItemsSync();
  const [state, setState] = useState<InsightsState>({ data: {}, errors: {} });
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    // Wait for the page-load sync so stale lists never flash before fresh ones
    if (syncStatus !== "done") return;

    TIME_RANGES.forEach(async (timeRange) => {
      try {
        const response = await fetch(
          `/api/user-insights?timeRange=${timeRange}`,
        );
        if (!response.ok) throw new Error("Failed to fetch insights");
        const insights: UserInsights = await response.json();
        if (id === requestId.current)
          setState((prev) => ({
            ...prev,
            data: { ...prev.data, [timeRange]: insights },
          }));
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("An error occurred");
        if (id === requestId.current)
          setState((prev) => ({
            ...prev,
            errors: { ...prev.errors, [timeRange]: error },
          }));
      }
    });
  }, [syncStatus]);

  return (
    <UserInsightsContext.Provider value={state}>
      {children}
    </UserInsightsContext.Provider>
  );
}

export function useUserInsights(timeRange: TimeRange) {
  const { data, errors } = useContext(UserInsightsContext);
  return { data: data[timeRange] ?? null, error: errors[timeRange] ?? null };
}
