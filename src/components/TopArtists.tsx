import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopArtistData } from "@/types/user";

interface TopArtistsProps {
  artists: TopArtistData[];
}

const TopArtists: React.FC<TopArtistsProps> = ({ artists }) => {
  const [revealedArtists, setRevealedArtists] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const storedRevealedArtists = localStorage.getItem("revealedArtists");
    if (storedRevealedArtists) {
      setRevealedArtists(new Set(JSON.parse(storedRevealedArtists)));
    }
  }, []);

  const handleReveal = (artistId: string) => {
    setRevealedArtists((prev) => {
      const newSet = new Set(prev);
      newSet.add(artistId);
      localStorage.setItem(
        "revealedArtists",
        JSON.stringify(Array.from(newSet))
      );
      return newSet;
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>TOP ARTISTS</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {artists.slice(0, 10).map((artist, index) => {
            const isRevealed = revealedArtists.has(artist.spotifyId);
            return (
              <div
                key={artist.spotifyId}
                className="flex flex-col items-center"
                style={{ perspective: "1000px" }}
              >
                <div
                  className="relative w-full aspect-square mb-2 transition-all duration-500 ease-in-out cursor-pointer"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                  onMouseEnter={() => handleReveal(artist.spotifyId)}
                  onClick={() => handleReveal(artist.spotifyId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleReveal(artist.spotifyId);
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
                      src={artist.imageUrl || "/placeholder-artist.png"}
                      alt={`Photo of ${artist.name}`}
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
                    {artist.name}
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

export default TopArtists;
