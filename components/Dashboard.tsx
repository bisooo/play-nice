"use client"
import { useEffect, useState } from 'react';
import Image from "next/image";

const Dashboard : React.FC = () => {

  const [track, setTrack] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchTrack = async () => {
      try {
        const response = await fetch('/api/spotify/current-track');
        if (!response.ok) throw new Error('Failed to fetch current track');
        const data = await response.json();
        setTrack(data);
      } catch (error) {
        setError((error as Error).message);
      }
    };

    fetchTrack();
  }, []);

  return (
      <div className="flex flex-col flex-center justify-between">
        {error ? <p>Error: {error}</p> :track ? <p>NOW PLAYING: {track.item.name}</p> : <></> }
        {track ? 
                <Image 
                src={track.item.album?.images[0].url}
                alt="LOGO"
                width={640}
                height={640}
                className="cover"
                unoptimized={true}
              /> :
              <Image 
                src="loading.jpg"
                alt="LOGO"
                width={300}
                height={300}
                className="cover"
                unoptimized={true}
              />
        }

      </div>
  );
}

export default Dashboard;