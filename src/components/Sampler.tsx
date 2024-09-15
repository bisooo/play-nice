"use client";

import React, { useState, useCallback } from "react";
import { useFetch } from "@/hooks/useFetch";
import { useRetry } from "@/hooks/useRetry";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { ParameterControls } from "@/components/ParameterControls";
import { RecommendationList } from "@/components/RecommendationList";
import { GenerateButton } from "@/components/GenerateButton";
import { ErrorAlert } from "@/components/ErrorAlert";
import { SpotifyRecommendationsResponse, FetchParams } from "@/types/spotify";

const Sampler: React.FC = () => {
  const [fetchParams, setFetchParams] = useState<FetchParams>({
    genre: "hip-hop",
    tempo: 95,
    energy: 0.5,
    acousticness: 0.5,
    danceability: 0.5,
    instrumentalness: 0.5,
    liveness: 0.5,
    speechiness: 0.5,
    popularity: 50,
  });

  const {
    data: recommendations,
    error,
    isLoading,
    fetchData,
  } = useFetch<SpotifyRecommendationsResponse>("/api/spotify/recommendations");

  const handleGenerate = useCallback(() => {
    retryReset();
    fetchData(fetchParams);
  }, [fetchData, fetchParams]);

  const {
    retryCount,
    countdown,
    retryFetch,
    reset: retryReset,
  } = useRetry(handleGenerate);

  const { playingTrack, handlePlayPause } = useAudioPlayback();

  const updateParam = (key: keyof FetchParams, value: string | number) => {
    setFetchParams((prev) => ({ ...prev, [key]: value }));
  };

  const isRateLimitError = error?.status === 429;
  const errorMessage = isRateLimitError
    ? `We've hit Spotify's rate limit. Retrying in ${countdown} seconds. (Attempt ${
        retryCount + 1
      }/${5})`
    : error?.message;

  if (isRateLimitError) {
    retryFetch();
  }

  return (
    <div className="flex flex-col items-center justify-between space-y-6 p-6 max-w-4xl mx-auto pt-32">
      <ParameterControls fetchParams={fetchParams} updateParam={updateParam} />
      <GenerateButton
        onClick={handleGenerate}
        isLoading={isLoading}
        countdown={countdown}
      />
      {error && <ErrorAlert message={errorMessage || "An error occurred"} />}
      {recommendations ? (
        <RecommendationList
          tracks={recommendations.tracks}
          playingTrack={playingTrack}
          handlePlayPause={handlePlayPause}
        />
      ) : !error && !isLoading ? (
        <p className="text-center text-muted-foreground">
          Click Generate to see recommendations here.
        </p>
      ) : null}
    </div>
  );
};

export default Sampler;
