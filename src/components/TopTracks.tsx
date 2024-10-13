import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopTrackData } from "@/types/user";

interface TopTracksProps {
  tracks: TopTrackData[];
}

const TopTracks: React.FC<TopTracksProps> = ({ tracks }) => {
  const [revealedTracks, setRevealedTracks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const storedRevealedTracks = localStorage.getItem("revealedTracks");
    if (storedRevealedTracks) {
      setRevealedTracks(new Set(JSON.parse(storedRevealedTracks)));
    }
  }, []);

  const handleReveal = (trackId: string) => {
    setRevealedTracks((prev) => {
      const newSet = new Set(prev);
      newSet.add(trackId);
      localStorage.setItem(
        "revealedTracks",
        JSON.stringify(Array.from(newSet))
      );
      return newSet;
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>TOP TRACKS</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {tracks.slice(0, 10).map((track, index) => {
            const isRevealed = revealedTracks.has(track.spotifyId);
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
                    transform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                  onMouseEnter={() => handleReveal(track.spotifyId)}
                  onClick={() => handleReveal(track.spotifyId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleReveal(track.spotifyId);
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
                  </div>
                </div>
                <div className="text-center w-full">
                  <p
                    className={`text-sm font-medium truncate transition-all duration-300 ${
                      isRevealed ? "blur-none" : "blur-sm"
                    }`}
                  >
                    {track.name}
                  </p>
                  <p
                    className={`text-xs text-gray-500 truncate transition-all duration-300 ${
                      isRevealed ? "blur-none" : "blur-sm"
                    }`}
                  >
                    {track.artistName}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopTracks;
