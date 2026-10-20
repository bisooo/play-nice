"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

// The parts of GET /api/history/stats the pages read (docs/history-stats.md has the full list)
export type HistoryArtist = { id: string; name: string | null; imageUrl: string | null; plays: number };
export type HistoryTrack = HistoryArtist & { artist: string | null };
// #4: shares are of the year's plays; genres are the top Spotify genres inside a group. groups is
// missing in stats stored before the genre groups (they come back on the next daily recompute).
export type GenreYear = {
  year: number;
  plays: number;
  groups?: { key: string; share: number; topArtists: HistoryArtist[]; genres: Record<string, number> }[];
};
export type HistoryStats = {
  totals: { plays: number; hours: number; artists: number; tracks: number; firstPlay: string; lastPlay: string };
  eras: { year: number; plays: number; hours: number; topArtists: HistoryArtist[]; topTrack: HistoryTrack | null }[];
  genres: GenreYear[];
  travel: { country: string; plays: number }[];
  streaks: { overall: { days: number; from: string; to: string } };
  daily: Record<string, number>;
};
export type Slice = { plays: number; hours: number; topArtists: HistoryArtist[]; topTracks: HistoryTrack[] };
export type SliceQuery = { year?: number; month?: number; hours?: [number, number]; country?: string };
export type ArtistDive = {
  artist: { id: string; name: string | null; imageUrl: string | null };
  plays: number;
  hours: number;
  firstPlayed: { date: string; via: Omit<HistoryTrack, "plays"> };
  lastPlayed: string;
  perYear: { year: number; plays: number }[];
  peakMonth: { year: number; month: number; plays: number };
  topTracks: HistoryTrack[];
  longestStreak: { days: number; from: string; to: string };
  byHour: number[];
};

type State = { version: string; stats: HistoryStats } | null;

const HistoryContext = createContext<{
  state: State;
  error: Error | null;
  load: () => void;
  slices: React.MutableRefObject<Map<string, Promise<unknown>>>;
  refresh: (version: string) => void;
} | null>(null);

// Fixed stats are fetched once, the first time a page asks for them, and kept in memory for the
// visit (like On Repeat's insights). Slices are cached by their query and data version, so going
// back to one is instant; the CDN caches them per version too (src/lib/historyApi.ts).
export function HistoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(null);
  const [error, setError] = useState<Error | null>(null);
  const started = useRef(false);
  const slices = useRef(new Map<string, Promise<unknown>>());
  const requestId = useRef(0);

  const fetchStats = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const response = await fetch("/api/history/stats");
      if (!response.ok) throw new Error("Couldn't load the listening history");
      const body = await response.json();
      if (id === requestId.current) {
        setState({ version: body.version, stats: body.stats });
        setError(null);
      }
    } catch (err) {
      if (id === requestId.current) setError(err instanceof Error ? err : new Error("Couldn't load the listening history"));
    }
  }, []);

  const load = useCallback(() => {
    if (started.current) return;
    started.current = true;
    fetchStats();
  }, [fetchStats]);

  // New plays were prepared since the stats loaded: drop cached slices and reload
  const refresh = useCallback((version: string) => {
    if (state?.version === version) return;
    slices.current.clear();
    fetchStats();
  }, [fetchStats, state?.version]);

  return (
    <HistoryContext.Provider value={{ state, error, load, slices, refresh }}>
      {children}
    </HistoryContext.Provider>
  );
}

function useHistoryContext() {
  const context = useContext(HistoryContext);
  if (!context) throw new Error("useHistory needs HistoryProvider");
  return context;
}

export function useHistoryStats() {
  const { state, error, load } = useHistoryContext();
  useEffect(load, [load]);
  return { stats: state?.stats ?? null, version: state?.version ?? null, error };
}

export function sliceParams({ year, month, hours, country }: SliceQuery) {
  const params = new URLSearchParams();
  if (year) params.set("year", String(year));
  if (month) params.set("month", String(month));
  if (hours) {
    params.set("from", String(hours[0]));
    params.set("to", String(hours[1]));
  }
  if (country) params.set("country", country);
  return params;
}

// One interactive result (a slice, an artist): fetched with the current data version, cached in
// memory by URL + version, so going back to one is instant. Keeps showing the previous result while
// a new one loads, so pages don't blank out between picks. A 409 means new plays were prepared.
function useHistoryQuery<T>(url: string | null, notFound?: string) {
  const { version } = useHistoryStats();
  const { slices: results, refresh } = useHistoryContext();
  const [result, setResult] = useState<{ key: string; value: T } | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const requestId = useRef(0);
  const key = version && url !== null ? `${url}|${version}` : null;

  useEffect(() => {
    if (!key || url === null || !version) return;
    const id = ++requestId.current;
    let promise = results.current.get(key) as Promise<T> | undefined;
    if (!promise) {
      promise = (async () => {
        const response = await fetch(`${url}${url.includes("?") ? "&" : "?"}v=${version}`);
        if (response.status === 409) {
          const body = await response.json();
          refresh(body.version);
          throw new Error("stale");
        }
        if (response.status === 404 && notFound) throw new Error(notFound);
        if (!response.ok) throw new Error("Couldn't load this");
        return response.json();
      })();
      results.current.set(key, promise as Promise<never>);
      promise.catch(() => results.current.delete(key));
    }
    promise.then(
      (value) => {
        if (id === requestId.current) {
          setResult({ key, value });
          setError(null);
        }
      },
      (err) => {
        if (id === requestId.current && err.message !== "stale") setError(err);
      },
    );
  }, [key, url, version, results, refresh, notFound]);

  // resultKey names the result shown, so a page can replay its entrance when a new one lands
  return { value: result?.value ?? null, resultKey: result?.key ?? null, loading: !!key && result?.key !== key, error };
}

// Top artists and tracks for a slice (stat #1)
export function useSlice(query: SliceQuery | null) {
  const { value, resultKey, loading, error } = useHistoryQuery<Slice>(query && `/api/history/top?${sliceParams(query)}`);
  return { slice: value, sliceKey: resultKey, loading, error: error && new Error(error.message === "Couldn't load this" ? "Couldn't load these charts" : error.message) };
}

// One artist's history (stat #3)
export function useArtist(id: string | null) {
  const { value, resultKey, loading, error } = useHistoryQuery<ArtistDive>(id && `/api/history/artist/${encodeURIComponent(id)}`, "No plays for this artist");
  return { artist: value, artistKey: resultKey, loading, error };
}

// Every artist I've played as [id, name, plays], most played first (stat #3's search). Only
// fetched once a page asks for it.
export function useArtistList(enabled: boolean) {
  const { value, error } = useHistoryQuery<[string, string, number][]>(enabled ? "/api/history/artists" : null);
  return { list: value, error };
}
