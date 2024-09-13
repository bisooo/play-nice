"use client";

import { useFetch } from "@/app/hooks/fetchData";
import { useCallback, useEffect, useState } from "react";
import debounce from "lodash.debounce";

const Sampler: React.FC = () => {
  const [genre, setGenre] = useState("hip-hop");
  // const [year, setYear] = useState(2000); // Default year
  const [tempo, setTempo] = useState(120); // Default tempo
  const [energy, setEnergy] = useState(0.5); // Default energy level
  const [acousticness, setAcousticness] = useState(0.5); // Default acousticness level
  const [danceability, setDanceability] = useState(0.5); // Default danceability level
  const [instrumentalness, setInstrumentalness] = useState(0.5); // Default instrumentalness level
  const [liveness, setLiveness] = useState(0.5); // Default liveness level
  const [speechiness, setSpeechiness] = useState(0.5); // Default speechiness level
  const [popularity, setPopularity] = useState(50); // Default popularity level

  const debounceFetchParams = useCallback(
    debounce((params: any) => {
      setFetchParams(params);
    }, 500), // Debounce time of 500ms
    []
  );
  const [fetchParams, setFetchParams] = useState({
    genre,
    tempo,
    energy,
    acousticness,
    danceability,
    instrumentalness,
    liveness,
    speechiness,
    popularity,
  });
  const {
    data: recommendations,
    error,
    isLoading,
  } = useFetch<any>("/api/spotify/recommendations", fetchParams);

  useEffect(() => {
    debounceFetchParams({
      genre,
      tempo,
      energy,
      acousticness,
      danceability,
      instrumentalness,
      liveness,
      speechiness,
      popularity,
    });
  }, [
    genre,
    tempo,
    energy,
    acousticness,
    danceability,
    instrumentalness,
    liveness,
    speechiness,
    popularity,
  ]);

  return (
    <div className="text-center">
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {recommendations && <div>{recommendations}</div>}
    </div>
  );
};

export default Sampler;
