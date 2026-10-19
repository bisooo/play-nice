"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "../components/Theme-Provider";
import { TopItemsSyncProvider } from "../components/TopItemsSync";
import { UserInsightsProvider } from "../components/UserInsights";
import { HistoryProvider } from "../components/History";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <TopItemsSyncProvider>
        <UserInsightsProvider>
          <HistoryProvider>{children}</HistoryProvider>
        </UserInsightsProvider>
      </TopItemsSyncProvider>
    </ThemeProvider>
  );
}
