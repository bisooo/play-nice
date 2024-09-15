"use client";

import { useState, Suspense, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserInsights } from "@/hooks/useUserInsights";
import { TimeRange } from "@prisma/client";
import TopArtists from "@/components/TopArtists";
import TopTracks from "@/components/TopTracks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.MEDIUM_TERM);
  const { data: insights, isLoading, error } = useUserInsights(timeRange);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pt-24">
      <Tabs
        value={timeRange}
        onValueChange={(value) => setTimeRange(value as TimeRange)}
        className="w-full"
      >
        <TabsList className="mb-8 h-12 p-1 flex items-center justify-center">
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
        <TabsContent value={timeRange}>
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
            <div className="space-y-12">
              <Suspense
                fallback={
                  <div className="text-center">Loading Top Artists...</div>
                }
              >
                <TopArtists artists={insights.topArtists || []} />
              </Suspense>
              <Suspense
                fallback={
                  <div className="text-center">Loading Top Tracks...</div>
                }
              >
                <TopTracks tracks={insights.topTracks || []} />
              </Suspense>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
