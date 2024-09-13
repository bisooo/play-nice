"use client";

import { useFetch } from "@/app/hooks/fetchData";
import { useCallback, useEffect, useState } from "react";
import debounce from "lodash.debounce";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "./ui/separator";

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
  // const {
  //   data: recommendations,
  //   error,
  //   isLoading,
  // } = useFetch<any>("/api/spotify/recommendations", fetchParams);

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
    <div className="flex flex-col flex-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">{genre}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuRadioGroup value={genre} onValueChange={setGenre}>
            <DropdownMenuRadioItem value="hip-hop">
              hip-hop
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="r-n-b">r-n-b</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="soul">soul</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Separator className="my-4" />
      <div className="w-full">
        <label htmlFor="slider" className="text-lg font-semibold mb-2">
          TEMPO : {tempo}
        </label>
        <Slider
          defaultValue={[120]}
          max={190}
          step={1}
          onValueChange={(e) => {
            setTempo(Number(e));
          }}
        />
      </div>
      <Separator className="my-4" />
      <div className="w-full">
        <label htmlFor="slider" className="text-lg font-semibold mb-2">
          ENERGY : {energy}
        </label>
        <Slider
          defaultValue={[0.5]}
          max={1}
          step={0.1}
          onValueChange={(e) => {
            setEnergy(Number(e));
          }}
        />
      </div>
      <Separator className="my-4" />
      <div className="w-full">
        <label htmlFor="slider" className="text-lg font-semibold mb-2">
          ACOUSTICNESS : {acousticness}
        </label>
        <Slider
          defaultValue={[0.5]}
          max={1}
          step={0.1}
          onValueChange={(e) => {
            setAcousticness(Number(e));
          }}
        />
      </div>
      <Separator className="my-4" />
      <div className="w-full">
        <label htmlFor="slider" className="text-lg font-semibold mb-2">
          DANCE-ABILITY : {danceability}
        </label>
        <Slider
          defaultValue={[0.5]}
          max={1}
          step={0.1}
          onValueChange={(e) => {
            setDanceability(Number(e));
          }}
        />
      </div>
      <Separator className="my-4" />
      <div className="w-full">
        <label htmlFor="slider" className="text-lg font-semibold mb-2">
          INSTRUMENTAL-NESS : {instrumentalness}
        </label>
        <Slider
          defaultValue={[0.5]}
          max={1}
          step={0.1}
          onValueChange={(e) => {
            setInstrumentalness(Number(e));
          }}
        />
      </div>
      <Separator className="my-4" />
      <div className="w-full">
        <label htmlFor="slider" className="text-lg font-semibold mb-2">
          LIVE-NESS : {liveness}
        </label>
        <Slider
          defaultValue={[0.5]}
          max={1}
          step={0.1}
          onValueChange={(e) => {
            setLiveness(Number(e));
          }}
        />
      </div>
      <Separator className="my-4" />
      <div className="w-full">
        <label htmlFor="slider" className="text-lg font-semibold mb-2">
          SPEECH-NESS : {speechiness}
        </label>
        <Slider
          defaultValue={[0.5]}
          max={1}
          step={0.1}
          onValueChange={(e) => {
            setSpeechiness(Number(e));
          }}
        />
      </div>
      <Separator className="my-4" />
      <div className="w-full">
        <label htmlFor="slider" className="text-lg font-semibold mb-2">
          POPULARITY : {popularity}
        </label>
        <Slider
          defaultValue={[50]}
          max={100}
          step={1}
          onValueChange={(e) => {
            setPopularity(Number(e));
          }}
        />
      </div>
      <Separator className="my-4" />
      <Button variant="outline">GENERATE</Button>
    </div>
  );
};

export default Sampler;
