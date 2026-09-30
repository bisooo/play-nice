import React from "react";
import { TimeRange } from "@prisma/client";
import { useReveals } from "@/hooks/useReveals";
import MoveBadge from "@/components/MoveBadge";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopTrackData } from "@/types/user";

interface TopTracksProps {
  // undefined while loading: renders blurred placeholder cards in the same layout
  tracks?: TopTrackData[];
  timeRange: TimeRange;
}

const TopTracks: React.FC<TopTracksProps> = ({ tracks, timeRange }) => {
  const { isRevealed, moveOf, reveal } = useReveals(
    "tracks",
    timeRange,
    tracks?.slice(0, 10).map((track) => track.spotifyId),
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle>TOP TRACKS</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-[repeat(5,minmax(0,var(--tile,1fr)))] lg:justify-center gap-x-6 gap-y-4">
          {tracks
            ? tracks.slice(0, 10).map((track, index) => {
                const faceUp = isRevealed(track.spotifyId, index + 1);
                return (
                  <div
                    key={track.spotifyId}
                    className="flex flex-col items-center"
                    style={{ perspective: "1000px" }}
                  >
                    <div
                      className="relative w-full aspect-square mb-2 transition-all duration-500 ease-in-out cursor-pointer"
                      style={{
                        transformStyle: "preserve-3d",
                        transform: faceUp ? "rotateY(180deg)" : "rotateY(0deg)",
                      }}
                      onMouseEnter={() => reveal(track.spotifyId, index + 1)}
                      onClick={() => reveal(track.spotifyId, index + 1)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          reveal(track.spotifyId, index + 1);
                        }
                      }}
                    >
                      <div
                        className="absolute w-full h-full bg-black flex items-center justify-center rounded-md"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <p className="text-4xl font-bold text-white">
                          #{index + 1}
                        </p>
                      </div>
                      <div
                        className="absolute w-full h-full"
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                        }}
                      >
                        <Image
                          src={track.imageUrl || "/placeholder-album.png"}
                          alt={`Album art for ${track.name}`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="rounded-md object-cover"
                        />
                        <MoveBadge move={moveOf(track.spotifyId)} />
                      </div>
                    </div>
                    <div className="text-center w-full">
                      <p
                        className={`text-sm font-medium truncate transition-all duration-300 ${
                          faceUp ? "blur-none" : "blur-sm"
                        }`}
                      >
                        {track.name}
                      </p>
                      <p
                        className={`text-xs text-gray-500 truncate transition-all duration-300 ${
                          faceUp ? "blur-none" : "blur-sm"
                        }`}
                      >
                        {track.artistName}
                      </p>
                    </div>
                  </div>
                );
              })
            : Array.from({ length: 10 }, (_, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="relative w-full aspect-square mb-2 bg-black flex items-center justify-center rounded-md">
                    <p className="text-4xl font-bold text-white">
                      #{index + 1}
                    </p>
                  </div>
                  <div className="text-center w-full animate-pulse">
                    <p className="text-sm font-medium truncate blur-sm">
                      Loading name
                    </p>
                    <p className="text-xs text-gray-500 truncate blur-sm">
                      Artist name
                    </p>
                  </div>
                </div>
              ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopTracks;
