"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useFetch } from "@/hooks/useFetch";
import { ParameterControls } from "@/components/ParameterControls";
import { RecommendationList } from "@/components/RecommendationList";
import { GenerateButton } from "@/components/GenerateButton";
import { ErrorAlert } from "@/components/ErrorAlert";
import { SpotifyRecommendationsResponse } from "@/types/spotify";

interface FetchParams {
  genre: string;
  tempo: number;
  energy: number;
  acousticness: number;
  danceability: number;
  instrumentalness: number;
  liveness: number;
  speechiness: number;
  popularity: number;
}

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second

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

  const [retryCount, setRetryCount] = useState(0);
  const [retryDelay, setRetryDelay] = useState(INITIAL_RETRY_DELAY);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    data: recommendations,
    error,
    isLoading,
    fetchData,
  } = useFetch<SpotifyRecommendationsResponse>("/api/spotify/recommendations");

  const updateParam = (key: keyof FetchParams, value: string | number) => {
    setFetchParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = useCallback(() => {
    setRetryCount(0);
    setRetryDelay(INITIAL_RETRY_DELAY);
    fetchData(fetchParams);
  }, [fetchData, fetchParams]);

  const retryFetch = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      const jitter = Math.random() * 1000;
      const nextDelay = Math.min(retryDelay * 2 + jitter, 60000); // Cap at 60 seconds
      setRetryDelay(nextDelay);
      setRetryCount((prevCount) => prevCount + 1);
      setCountdown(Math.ceil(nextDelay / 1000));
    } else {
      setCountdown(null);
    }
  }, [retryCount, retryDelay]);

  useEffect(() => {
    if (error?.status === 429) {
      retryFetch();
    } else {
      setCountdown(null);
    }
  }, [error, retryFetch]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            handleGenerate();
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown, handleGenerate]);

  const handlePlayPause = useCallback(
    (trackId: string, previewUrl: string) => {
      if (playingTrack === trackId) {
        audioRef.current?.pause();
        setPlayingTrack(null);
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = previewUrl;
          audioRef.current.play();
        } else {
          audioRef.current = new Audio(previewUrl);
          audioRef.current.play();
        }
        setPlayingTrack(trackId);
      }
    },
    [playingTrack]
  );

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, []);

  const isRateLimitError = error?.status === 429;
  const errorMessage = isRateLimitError
    ? `We've hit Spotify's rate limit. Retrying in ${countdown} seconds. (Attempt ${
        retryCount + 1
      }/${MAX_RETRIES})`
    : error?.message;

  return (
    <div className="flex flex-col items-center justify-between space-y-6 p-6 max-w-4xl mx-auto">
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
