import React from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { genres } from "@/lib/constants";

interface FetchParams {
  genre: string;
  tempo: number;
  energy: number;
  acousticness: number;
  danceability: number;
  instrumentalness: number;
  liveness: number;
  speechiness: number;
  popularity: number;
}

interface ParameterControlsProps {
  fetchParams: FetchParams;
  updateParam: (key: keyof FetchParams, value: string | number) => void;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  fetchParams,
  updateParam,
}) => {
  return (
    <div className="w-full space-y-6">
      <div className="w-full flex items-center space-x-4">
        <label
          htmlFor="genre-select"
          className="text-lg font-semibold whitespace-nowrap"
        >
          GENRE:
        </label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              id="genre-select"
              variant="outline"
              className="w-full justify-between"
            >
              {fetchParams.genre.toUpperCase()}
              <span className="ml-2">▼</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
            <ScrollArea className="h-[300px]">
              <DropdownMenuRadioGroup
                value={fetchParams.genre}
                onValueChange={(value) => updateParam("genre", value)}
              >
                {genres.map((genre) => (
                  <DropdownMenuRadioItem key={genre} value={genre}>
                    {genre.toUpperCase()}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Separator className="my-4" />
      {Object.entries(fetchParams).map(([key, value]) => {
        if (key === "genre") return null;
        return (
          <div key={key} className="w-full space-y-2">
            <label htmlFor={key} className="text-lg font-semibold capitalize">
              {key.toUpperCase()}:{" "}
              {typeof value === "number" ? value.toFixed(2) : value}
            </label>
            <Slider
              id={key}
              min={key === "tempo" ? 60 : key === "popularity" ? 0 : 0}
              max={key === "tempo" ? 190 : key === "popularity" ? 100 : 1}
              step={key === "tempo" || key === "popularity" ? 1 : 0.01}
              value={[value as number]}
              onValueChange={(e) => updateParam(key as keyof FetchParams, e[0])}
              aria-label={`Adjust ${key}`}
            />
            <Separator className="my-4" />
          </div>
        );
      })}
    </div>
  );
};
