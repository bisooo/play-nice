import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopArtistData } from "@/types/user";

interface TopArtistsProps {
  artists: TopArtistData[];
}

const TopArtists: React.FC<TopArtistsProps> = ({ artists }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>TOP ARTISTS</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {artists.slice(0, 10).map((artist, index) => (
            <div key={artist.spotifyId} className="flex flex-col items-center">
              <div className="relative w-full aspect-square mb-2">
                <Image
                  src={artist.imageUrl || "/placeholder-artist.png"}
                  alt={`Photo of ${artist.name}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="rounded-md object-cover"
                />
              </div>
              <div className="text-center w-full">
                <p className="text-sm font-medium truncate">{artist.name}</p>
                <p className="mt-1 text-xs text-gray-400">#{index + 1}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopArtists;
