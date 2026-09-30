"use client";

import { createContext, useContext, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserInsights } from "@/components/UserInsights";
import { TimeRange } from "@prisma/client";
import TopArtists from "@/components/TopArtists";
import TopTracks from "@/components/TopTracks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const TimeRangeContext = createContext<TimeRange>(TimeRange.MEDIUM_TERM);

// Shared by /on-repeat/artists and /on-repeat/tracks, so the time range survives switching between them
export function OnRepeatLayout({ children }: { children: ReactNode }) {
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.MEDIUM_TERM);

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
      <TimeRangeContext.Provider value={timeRange}>
        {children}
      </TimeRangeContext.Provider>
    </div>
  );
}

// On laptops the two rows of five tiles are capped to fit the viewport height; the px is
// everything around the tiles (navbar, time-range tabs, card header, labels, gaps)
const fitToScreen = (chromePx: number) =>
  ({ "--tile": `calc((100dvh - ${chromePx}px) / 2)` }) as CSSProperties;

// Until the preloaded data is in, the lists render as blurred placeholder cards. Keyed by
// time range so each switch remounts the grid and replays the card flip
export function OnRepeatList({ kind }: { kind: "artists" | "tracks" }) {
  const timeRange = useContext(TimeRangeContext);
  const { data: insights, error } = useUserInsights(timeRange);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return kind === "artists" ? (
    <div style={fitToScreen(350)}>
      <TopArtists key={timeRange} artists={insights?.topArtists} />
    </div>
  ) : (
    <div style={fitToScreen(385)}>
      <TopTracks key={timeRange} tracks={insights?.topTracks} />
    </div>
  );
}
