"use client"
import Image from "next/image";
import { useFetch } from '@/app/hooks/fetchData';

const Dashboard : React.FC = () => {

  const {data : track, error, isLoading} = useFetch<any>('/api/spotify/current-track');

  return (
      <div className="flex flex-col flex-center justify-between">
        {isLoading ? 
                    <Image 
                    src="loading-circle.png"
                    alt="LOGO"
                    width={100}
                    height={100}
                    className="cover"
                    unoptimized={true}
                  /> : 
                  error ? 
                  <p>Error: {error}</p> :
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
                    <p className='text-left'>{track.item.album?.name}</p>
                  </div>
        }
      </div>
  );
}

export default Dashboard;