"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

// syncing: request in flight; done: DB is as fresh as it will get this visit
type SyncStatus = "syncing" | "done";

const TopItemsSyncContext = createContext<SyncStatus>("syncing");

// Syncs the owner's top items on page load; the server skips it unless data is over 24h old
export function TopItemsSyncProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>("syncing");

  useEffect(() => {
    fetch("/api/internal/updateUserTopItems", { method: "POST" })
      .then((response) => {
        if (!response.ok) console.error("Top items sync failed:", response.status);
      })
      .catch((error) => console.error("Top items sync failed:", error))
      // On failure On Repeat still shows whatever is in the DB
      .finally(() => setStatus("done"));
  }, []);

  return <TopItemsSyncContext.Provider value={status}>{children}</TopItemsSyncContext.Provider>;
}

export function useTopItemsSync() {
  return useContext(TopItemsSyncContext);
}
