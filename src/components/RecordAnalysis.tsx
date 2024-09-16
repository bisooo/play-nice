import React from "react";
import { useFetch } from "@/hooks/useFetch";
import { ErrorAlert } from "@/components/ErrorAlert";
import { AudioFeatures } from "@/types/spotify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const RecordAnalysis: React.FC = () => {
  const [trackName, setTrackName] = React.useState("");
  const [artistName, setArtistName] = React.useState("");

  const {
    data: audioFeatures,
    error: audioFeaturesError,
    isLoading: isAudioFeaturesLoading,
    fetchData: fetchAudioFeatures,
  } = useFetch<AudioFeatures>("/api/spotify/track-analysis");

  const handleFindTrack = async () => {
    fetchAudioFeatures({ track: trackName, artist: artistName });
  };

  const getKeyName = (key: number): string => {
    const keyNames = [
      "C",
      "C♯/D♭",
      "D",
      "D♯/E♭",
      "E",
      "F",
      "F♯/G♭",
      "G",
      "G♯/A♭",
      "A",
      "A♯/B♭",
      "B",
    ];
    return keyNames[key];
  };

  const getModeName = (mode: number): string => {
    return mode === 1 ? "Major" : "Minor";
  };

  return (
    <div className="space-y-4">
      <div>
        <Label
          htmlFor="track-name"
          className={`text-lg font-semibold capitalize`}
        >
          TRACK NAME
        </Label>
        <Input
          id="track-name"
          value={trackName}
          onChange={(e) => setTrackName(e.target.value)}
          placeholder="ball w/o you"
          className="mt-2"
        />
      </div>
      <div>
        <Label
          htmlFor="artist-name"
          className={`text-lg font-semibold capitalize`}
        >
          ARTIST NAME
        </Label>
        <Input
          id="artist-name"
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
          placeholder="21 21"
          className="mt-2"
        />
      </div>
      <Button
        onClick={handleFindTrack}
        className="w-full"
        disabled={isAudioFeaturesLoading}
      >
        {isAudioFeaturesLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        FIND
      </Button>
      {audioFeaturesError && (
        <ErrorAlert message={audioFeaturesError.message} />
      )}
      {audioFeatures && (
        <Card className="mt-4">
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-lg font-semibold">Key</p>
                <p className="text-3xl font-bold">
                  {getKeyName(audioFeatures.key)}{" "}
                  {getModeName(audioFeatures.mode)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">Tempo</p>
                <p className="text-3xl font-bold">
                  {audioFeatures.tempo.toFixed(1)} BPM
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
