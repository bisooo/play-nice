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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {artists.slice(0, 10).map((artist, index) => (
            <div key={artist.spotifyId} className="flex flex-col items-center">
              <div className="relative w-full aspect-square">
                <Image
                  src={artist.imageUrl || "/placeholder-artist.png"}
                  alt={artist.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="rounded-md object-cover"
                />
              </div>
              <p className="mt-2 text-sm font-medium truncate">{artist.name}</p>
              <p className="text-xs text-gray-500">#{index + 1}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopArtists;
