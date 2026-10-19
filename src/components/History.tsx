"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

// The parts of GET /api/history/stats the pages read (docs/history-stats.md has the full list)
export type HistoryArtist = { id: string; name: string | null; imageUrl: string | null; plays: number };
export type HistoryTrack = HistoryArtist & { artist: string | null };
export type HistoryStats = {
  totals: { plays: number; hours: number; artists: number; tracks: number; firstPlay: string; lastPlay: string };
  eras: { year: number; plays: number; topArtists: HistoryArtist[] }[];
  travel: { country: string; plays: number }[];
  streaks: { overall: { days: number; from: string; to: string } };
  daily: Record<string, number>;
};
export type Slice = { plays: number; hours: number; topArtists: HistoryArtist[]; topTracks: HistoryTrack[] };
export type SliceQuery = { year?: number; month?: number; hours?: [number, number]; country?: string };

type State = { version: string; stats: HistoryStats } | null;

const HistoryContext = createContext<{
  state: State;
  error: Error | null;
  load: () => void;
  slices: React.MutableRefObject<Map<string, Promise<Slice>>>;
  refresh: (version: string) => void;
} | null>(null);

// Fixed stats are fetched once, the first time a page asks for them, and kept in memory for the
// visit (like On Repeat's insights). Slices are cached by their query and data version, so going
// back to one is instant; the CDN caches them per version too (src/lib/historyApi.ts).
export function HistoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(null);
  const [error, setError] = useState<Error | null>(null);
  const started = useRef(false);
  const slices = useRef(new Map<string, Promise<Slice>>());
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

// Top artists and tracks for a slice (stat #1). Keeps showing the previous result while a new one
// loads, so the lists don't blank out between filters.
export function useSlice(query: SliceQuery | null) {
  const { version } = useHistoryStats();
  const { slices, refresh } = useHistoryContext();
  const [result, setResult] = useState<{ key: string; slice: Slice } | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const requestId = useRef(0);
  const params = query && sliceParams(query).toString();
  const key = version && params !== null ? `${params}|${version}` : null;

  useEffect(() => {
    if (!key || params === null || !version) return;
    const id = ++requestId.current;
    let promise = slices.current.get(key);
    if (!promise) {
      promise = (async () => {
        const qs = new URLSearchParams(params);
        qs.set("v", version);
        const response = await fetch(`/api/history/top?${qs}`);
        if (response.status === 409) {
          const body = await response.json();
          refresh(body.version);
          throw new Error("stale");
        }
        if (!response.ok) throw new Error("Couldn't load these charts");
        return response.json();
      })();
      slices.current.set(key, promise);
      promise.catch(() => slices.current.delete(key));
    }
    promise.then(
      (slice) => {
        if (id === requestId.current) {
          setResult({ key, slice });
          setError(null);
        }
      },
      (err) => {
        if (id === requestId.current && err.message !== "stale") setError(err);
      },
    );
  }, [key, params, version, slices, refresh]);

  return { slice: result?.slice ?? null, loading: !!key && result?.key !== key, error };
}
