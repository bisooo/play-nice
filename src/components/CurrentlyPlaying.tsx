"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useFetch } from "@/hooks/useFetch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReloadIcon } from "@radix-ui/react-icons";
import ColorThief from "colorthief";

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

const CurrentlyPlaying: React.FC<{
  onColorsExtracted: (colors: string[]) => void;
}> = ({ onColorsExtracted }) => {
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

  useEffect(() => {
    if (track && track.item) {
      const img = new window.Image();
      img.crossOrigin = "Anonymous";
      img.src = track.item.album.images[0].url;
      img.onload = () => {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(img, 10);
        const colors = palette.map(
          (color) => `rgb(${color[0]}, ${color[1]}, ${color[2]})`
        );
        onColorsExtracted(colors);
      };
    }
  }, [track, onColorsExtracted]);

  const handleManualRefresh = () => {
    handleFetch();
  };

  return (
    <Card className="w-full bg-transparent backdrop-blur-[2px] border border-white/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold text-white">
          NOW PLAYING
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleManualRefresh}
          className="text-white hover:text-white/70"
        >
          <ReloadIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <ReloadIcon className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : error ? (
          <Alert
            variant="destructive"
            className="bg-red-500/50 border-red-500/50"
          >
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
            <Button
              onClick={handleManualRefresh}
              className="mt-4 bg-white/10 hover:bg-white/20 text-white"
            >
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
              <h3 className="text-xl font-semibold text-white">
                {track.item.name}
              </h3>
              <p className="text-sm text-white/80">
                {track.item.artists.map((artist) => artist.name).join(", ")}
              </p>
              <p className="text-sm text-white/60">{track.item.album.name}</p>
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
              <h3 className="text-xl font-semibold text-white">
                No track playing
              </h3>
              <p className="text-sm text-white/80">
                Start playing a song on Spotify
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentlyPlaying;
