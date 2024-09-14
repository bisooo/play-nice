"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useFetch } from "@/hooks/useFetch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReloadIcon } from "@radix-ui/react-icons";

interface Track {
  item: {
    id: string;
    name: string;
    album: {
      name: string;
      images: { url: string }[];
    };
    artists: { name: string }[];
  };
}

const FETCH_INTERVAL = 30000; // 30 seconds
const MAX_RETRIES = 3;

const Dashboard: React.FC = () => {
  const [retryCount, setRetryCount] = useState(0);
  const [retryDelay, setRetryDelay] = useState(1000);

  const {
    data: track,
    error,
    isLoading,
    fetchData,
  } = useFetch<Track>("/api/spotify/current-track");

  const handleFetch = useCallback(() => {
    fetchData();
    setRetryCount(0);
    setRetryDelay(1000);
  }, [fetchData]);

  useEffect(() => {
    handleFetch();
    const intervalId = setInterval(handleFetch, FETCH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [handleFetch]);

  useEffect(() => {
    if (error?.status === 429 && retryCount < MAX_RETRIES) {
      const timer = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setRetryDelay((prev) => Math.min(prev * 2, 60000));
        fetchData();
      }, retryDelay);

      return () => clearTimeout(timer);
    }
  }, [error, retryCount, retryDelay, fetchData]);

  const handleManualRefresh = () => {
    handleFetch();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold">Now Playing</CardTitle>
        <Button variant="outline" size="icon" onClick={handleManualRefresh}>
          <ReloadIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <ReloadIcon className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
            <Button onClick={handleManualRefresh} className="mt-4">
              Retry
            </Button>
          </Alert>
        ) : track && track.item ? (
          <div className="space-y-4">
            <Image
              src={track.item.album.images[0].url}
              alt={`${track.item.name} album cover`}
              width={300}
              height={300}
              className="rounded-md mx-auto"
              unoptimized={true}
            />
            <div className="text-center">
              <h3 className="text-xl font-semibold">{track.item.name}</h3>
              <p className="text-sm text-muted-foreground">
                {track.item.artists.map((artist) => artist.name).join(", ")}
              </p>
              <p className="text-sm text-muted-foreground">
                {track.item.album.name}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Image
              src="/placeholder-album.png"
              alt="Placeholder album cover"
              width={300}
              height={300}
              className="rounded-md mx-auto"
              unoptimized={true}
            />
            <div className="text-center">
              <h3 className="text-xl font-semibold">No track playing</h3>
              <p className="text-sm text-muted-foreground">
                Start playing a song on Spotify
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Dashboard;
