"use client";
import Image from "next/image";
import { useFetch } from "@/app/hooks/fetchData";

const Dashboard: React.FC = () => {
  const {
    data: track,
    error,
    isLoading,
  } = useFetch<any>("/api/spotify/current-track");

  return (
    <div className="flex flex-col flex-center justify-between">
      {isLoading ? (
        <Image
          src="loading-circle.png"
          alt="LOGO"
          width={48}
          height={48}
          className="cover"
          unoptimized={true}
        />
      ) : error ? (
        <p>Error: {error}</p>
      ) : track && track.item ? (
        <div>
          <p>{track.item.name}</p>
          <Image
            src={track.item.album?.images[0].url}
            alt="LOGO"
            width={640}
            height={640}
            className="cover"
            unoptimized={true}
          />
          <p className="text-left">{track.item.album?.name}</p>
        </div>
      ) : (
        <div>
          <p>{"UNTITLED TRACK"}</p>
          <Image
            src={"./placeholder-album.png"}
            alt="LOGO"
            width={640}
            height={640}
            className="cover"
            unoptimized={true}
          />
          <p className="text-left">{"UNTITLED ALBUM"}</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
