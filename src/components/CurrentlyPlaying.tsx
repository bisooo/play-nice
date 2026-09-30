"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReloadIcon } from "@radix-ui/react-icons";
import ColorThief from "colorthief";
import { NowPlaying } from "@/types/spotify";

// Spotify rate-limits per app over a rolling 30s window. Every visitor polls every 5s, but the
// route is CDN-cached for 5s, so Spotify sees about one call per 5s. Hidden tabs don't poll at all.
const POLL_MS = 5000;
// When a track is about to end, check again just after it does instead of waiting a full interval
const TRACK_END_SLACK_MS = 1000;
const IMAGE_TIMEOUT_MS = 3000;

type Colors = string[] | null;

// Loads the cover before the track is shown, so the crossfade never reveals a blank image,
// and pulls the background palette from it in the same pass
function loadCover(url: string | null): Promise<Colors> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new window.Image();
    const timer = setTimeout(() => resolve(null), IMAGE_TIMEOUT_MS);
    img.crossOrigin = "anonymous";
    img.onload = () => {
      clearTimeout(timer);
      try {
        const palette = new ColorThief().getPalette(img, 10);
        resolve(palette.map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = url;
  });
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.6, ease: "easeInOut" },
};

const CurrentlyPlaying: React.FC<{
  onColorsExtracted: (colors: string[]) => void;
}> = ({ onColorsExtracted }) => {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);
  const stopped = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const shownTrackId = useRef<string | null | undefined>(undefined);
  const onColors = useRef(onColorsExtracted);
  onColors.current = onColorsExtracted;

  const poll = useCallback(async () => {
    clearTimeout(timer.current);
    const id = ++requestId.current;
    let delay = POLL_MS;

    try {
      const response = await fetch("/api/spotify/current-track", { cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        if (response.status === 429) {
          const retryAfter = Number(response.headers.get("Retry-After")) || 60;
          delay = Math.max(POLL_MS, retryAfter * 1000);
        }
        throw new Error(body.message || "Couldn't load what's playing");
      }
      const next: NowPlaying = await response.json();
      if (next.isPlaying && next.track) {
        const remaining = next.track.durationMs - next.progressMs + TRACK_END_SLACK_MS;
        delay = Math.max(TRACK_END_SLACK_MS, Math.min(POLL_MS, remaining));
      }

      // Only re-render when the track changes, so polling never restarts the fade
      const nextTrackId = next.track?.id ?? null;
      if (nextTrackId !== shownTrackId.current) {
        const colors = await loadCover(next.track?.imageUrl ?? null);
        if (id !== requestId.current || stopped.current) return;
        shownTrackId.current = nextTrackId;
        setNowPlaying(next);
        if (colors) onColors.current(colors);
      }
      if (id === requestId.current) setError(null);
    } catch (err) {
      if (id === requestId.current) {
        setError(err instanceof Error ? err.message : "Couldn't load what's playing");
      }
    } finally {
      if (id === requestId.current && !stopped.current && !document.hidden) {
        timer.current = setTimeout(poll, delay);
      }
    }
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) clearTimeout(timer.current);
      else poll();
    };
    stopped.current = false;
    poll();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      stopped.current = true;
      clearTimeout(timer.current);
    };
  }, [poll]);

  const track = nowPlaying?.track;

  return (
    <Card
      data-testid="now-playing"
      className="w-full bg-transparent backdrop-blur-[2px] border border-white/10 [container-type:inline-size]"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 sm:p-6 sm:pb-2">
        {/* Stays on one line when the card shrinks to fit a short screen (cqw = card width) */}
        <CardTitle className="whitespace-nowrap font-bold text-white text-[clamp(0.875rem,calc((100cqw-88px)/7),1.125rem)] sm:text-[clamp(0.875rem,calc((100cqw-104px)/7),1.5rem)]">
          NOW PLAYING
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={poll}
          aria-label="Refresh now playing"
          className="text-white hover:text-white/70"
        >
          <ReloadIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        {!nowPlaying && error ? (
          <Alert
            variant="destructive"
            className="bg-red-500/50 border-red-500/50"
          >
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button
              onClick={poll}
              className="mt-4 bg-white/10 hover:bg-white/20 text-white"
            >
              Retry
            </Button>
          </Alert>
        ) : !nowPlaying ? (
          <div className="flex justify-center items-center aspect-square w-full max-w-[var(--art-max,100%)] mx-auto">
            <ReloadIcon className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : (
          // Old and new track share one grid cell so they crossfade without the card changing height
          <div className="grid grid-cols-1">
            <AnimatePresence initial={false}>
              <motion.div
                key={track?.id ?? "none"}
                {...fade}
                className="space-y-4 min-w-0 [grid-area:1/1]"
              >
                <Image
                  src={track?.imageUrl ?? "/placeholder-album.png"}
                  alt={track ? `${track.name} album cover` : "Placeholder album cover"}
                  width={300}
                  height={300}
                  className="rounded-md mx-auto w-full max-w-[var(--art-max,100%)] h-auto aspect-square object-cover"
                  crossOrigin={track?.imageUrl ? "anonymous" : undefined}
                  unoptimized={true}
                />
                {/* One line each, cut with an ellipsis, so long titles never change the card's height */}
                {track ? (
                  <div className="text-center">
                    <h3 title={track.name} className="truncate text-base sm:text-xl font-semibold text-white">
                      {track.name}
                    </h3>
                    <p title={track.artists.join(", ")} className="truncate text-sm text-white/80">
                      {track.artists.join(", ")}
                    </p>
                    <p title={track.album} className="truncate text-sm text-white/60">
                      {track.album}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <h3 className="text-base sm:text-xl font-semibold text-white">No track playing</h3>
                    <p className="text-sm text-white/80">Nothing on right now</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentlyPlaying;
