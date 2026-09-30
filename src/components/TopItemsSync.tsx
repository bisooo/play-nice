"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useSession } from "next-auth/react";

// idle: no session yet; syncing: request in flight; done: DB is as fresh as it will get this visit
type SyncStatus = "idle" | "syncing" | "done";

const TopItemsSyncContext = createContext<SyncStatus>("idle");

// Syncs the signed-in user's top items on page load; the server skips it unless data is over 24h old
export function TopItemsSyncProvider({ children }: { children: ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const [status, setStatus] = useState<SyncStatus>("idle");
  const syncedFor = useRef<string | null>(null);

  const userId = session?.id;

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !userId || syncedFor.current === userId) return;
    syncedFor.current = userId;
    setStatus("syncing");
    fetch("/api/internal/updateUserTopItems", { method: "POST" })
      .then((response) => {
        if (!response.ok) console.error("Top items sync failed:", response.status);
      })
      .catch((error) => console.error("Top items sync failed:", error))
      // On failure the dashboard still shows whatever is in the DB
      .finally(() => {
        if (syncedFor.current === userId) setStatus("done");
      });
  }, [sessionStatus, userId]);

  return <TopItemsSyncContext.Provider value={status}>{children}</TopItemsSyncContext.Provider>;
}

export function useTopItemsSync() {
  return useContext(TopItemsSyncContext);
}
