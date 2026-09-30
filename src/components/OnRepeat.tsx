"use client";

import { createContext, useContext, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserInsights } from "@/hooks/useUserInsights";
import { TimeRange } from "@prisma/client";
import { UserInsights } from "@/types/user";
import TopArtists from "@/components/TopArtists";
import TopTracks from "@/components/TopTracks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const InsightsContext = createContext<UserInsights | null>(null);

// Shared by /on-repeat/artists and /on-repeat/tracks, so the time range and data survive switching between them
export function OnRepeatLayout({ children }: { children: ReactNode }) {
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.MEDIUM_TERM);
  const { data: insights, isLoading, error } = useUserInsights(timeRange);

  return (
    <div className="container mx-auto px-4 pt-[5.5rem] pb-6 max-w-6xl">
      <Tabs
        value={timeRange}
        onValueChange={(value) => setTimeRange(value as TimeRange)}
        className="w-full"
      >
        <TabsList className="mb-6 h-12 p-1 w-full flex items-center justify-center">
          <TabsTrigger
            value={TimeRange.SHORT_TERM}
            className="flex-1 h-full flex items-center justify-center text-xs sm:text-sm md:text-base"
          >
            COUPLE WEEKS
          </TabsTrigger>
          <TabsTrigger
            value={TimeRange.MEDIUM_TERM}
            className="flex-1 h-full flex items-center justify-center text-xs sm:text-sm md:text-base"
          >
            COUPLE MONTHS
          </TabsTrigger>
          <TabsTrigger
            value={TimeRange.LONG_TERM}
            className="flex-1 h-full flex items-center justify-center text-xs sm:text-sm md:text-base"
          >
            PAST YEAR
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : insights ? (
        <InsightsContext.Provider value={insights}>
          {children}
        </InsightsContext.Provider>
      ) : null}
    </div>
  );
}

// On laptops the two rows of five tiles are capped to fit the viewport height; the px is
// everything around the tiles (navbar, time-range tabs, card header, labels, gaps)
const fitToScreen = (chromePx: number) =>
  ({ "--tile": `calc((100dvh - ${chromePx}px) / 2)` }) as CSSProperties;

export function OnRepeatList({ kind }: { kind: "artists" | "tracks" }) {
  const insights = useContext(InsightsContext);
  if (!insights) return null;

  return kind === "artists" ? (
    <div style={fitToScreen(350)}>
      <TopArtists artists={insights.topArtists || []} />
    </div>
  ) : (
    <div style={fitToScreen(385)}>
      <TopTracks tracks={insights.topTracks || []} />
    </div>
  );
}
