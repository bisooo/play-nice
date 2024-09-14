import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { SpotifyTrack } from "@/types/spotify";

interface TrackCardProps {
  track: SpotifyTrack;
  isPlaying: boolean;
  onPlayPause: (trackId: string, previewUrl: string) => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  isPlaying,
  onPlayPause,
}) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-square">
          <Image
            src={track.album.images[0]?.url || "/placeholder-album.png"}
            alt={`${track.name} album cover`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-2 right-2"
            onClick={() => onPlayPause(track.id, track.preview_url || "")}
            disabled={!track.preview_url}
          >
            {isPlaying ? (
              <PauseIcon className="h-4 w-4" />
            ) : (
              <PlayIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="p-4">
          <h3 className="font-semibold truncate">{track.name}</h3>
          <p className="text-sm text-muted-foreground truncate">
            {track.artists.map((artist) => artist.name).join(", ")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
