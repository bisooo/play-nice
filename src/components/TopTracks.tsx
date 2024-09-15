import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopTrackData } from "@/types/user";

interface TopTracksProps {
  tracks: TopTrackData[];
}

const TopTracks: React.FC<TopTracksProps> = ({ tracks }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>TOP TRACKS</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tracks.slice(0, 10).map((track, index) => (
            <div key={track.spotifyId} className="flex flex-col items-center">
              <div className="relative w-full aspect-square">
                <Image
                  src={track.imageUrl || "/placeholder-album.png"}
                  alt={track.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="rounded-md object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-md">
                  <p className="text-sm font-medium truncate">{track.name}</p>
                  <p className="text-xs truncate">{track.artistName}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">#{index + 1}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopTracks;