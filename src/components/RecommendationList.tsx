import React from "react";
import { TrackCard } from "./TrackCard";
import { SpotifyTrack } from "@/types/spotify";

interface RecommendationListProps {
  tracks: SpotifyTrack[];
  playingTrack: string | null;
  handlePlayPause: (trackId: string, previewUrl: string) => void;
}

export const RecommendationList: React.FC<RecommendationListProps> = ({
  tracks,
  playingTrack,
  handlePlayPause,
}) => {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">Recommendations:</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            isPlaying={playingTrack === track.id}
            onPlayPause={handlePlayPause}
          />
        ))}
      </div>
    </div>
  );
};
