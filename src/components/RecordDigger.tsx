import React, { useCallback } from "react";
import { useFetch } from "@/hooks/useFetch";
import { useRetry } from "@/hooks/useRetry";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { ParameterControls } from "@/components/ParameterControls";
import { RecommendationList } from "@/components/RecommendationList";
import { GenerateButton } from "@/components/GenerateButton";
import { ErrorAlert } from "@/components/ErrorAlert";
import { SpotifyRecommendationsResponse, FetchParams } from "@/types/spotify";
import { Loader2 } from "lucide-react";

export const RecordDigger: React.FC = () => {
  const [fetchParams, setFetchParams] = React.useState<FetchParams>({
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
    error: recommendationsError,
    isLoading: isRecommendationsLoading,
    fetchData: fetchRecommendations,
  } = useFetch<SpotifyRecommendationsResponse>("/api/spotify/recommendations");

  const handleGenerate = useCallback(() => {
    retryReset();
    fetchRecommendations(fetchParams);
  }, [fetchRecommendations, fetchParams]);

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

  const isRateLimitError = recommendationsError?.status === 429;
  const errorMessage = isRateLimitError
    ? `We've hit Spotify's rate limit. Retrying in ${countdown} seconds. (Attempt ${
        retryCount + 1
      }/${5})`
    : recommendationsError?.message;

  if (isRateLimitError) {
    retryFetch();
  }

  return (
    <div className="space-y-6">
      <ParameterControls fetchParams={fetchParams} updateParam={updateParam} />
      <GenerateButton
        onClick={handleGenerate}
        isLoading={isRecommendationsLoading}
        countdown={countdown}
      />
      {recommendationsError && (
        <ErrorAlert message={errorMessage || "An error occurred"} />
      )}
      {isRecommendationsLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : recommendations ? (
        <RecommendationList
          tracks={recommendations.tracks}
          playingTrack={playingTrack}
          handlePlayPause={handlePlayPause}
        />
      ) : !recommendationsError ? (
        <p className="text-center text-muted-foreground">
          Click Generate to see recommendations here.
        </p>
      ) : null}
    </div>
  );
};
