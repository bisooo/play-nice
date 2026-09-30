"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "../components/Theme-Provider";
import { TopItemsSyncProvider } from "../components/TopItemsSync";

export default function SessionLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <SessionProvider>
        <TopItemsSyncProvider>{children}</TopItemsSyncProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
