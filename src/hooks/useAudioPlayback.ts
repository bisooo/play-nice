import { useState, useCallback, useRef, useEffect } from 'react';

export function useAudioPlayback() {
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = useCallback(
    (trackId: string, previewUrl: string) => {
      if (playingTrack === trackId) {
        audioRef.current?.pause();
        setPlayingTrack(null);
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = previewUrl;
          audioRef.current.play();
        } else {
          audioRef.current = new Audio(previewUrl);
          audioRef.current.play();
        }
        setPlayingTrack(trackId);
      }
    },
    [playingTrack]
  );

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, []);

  return { playingTrack, handlePlayPause };
}