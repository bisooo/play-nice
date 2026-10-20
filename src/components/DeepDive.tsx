"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { MotionConfig, motion } from "framer-motion";
import { logoFont } from "@/lib/fonts";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useArtist, useArtistList, useSlice } from "@/components/History";
import type { ArtistDive } from "@/components/History";

// Stat #3, Deep Dive: one of my top artists, its facts face down until tapped (like On Repeat's
// cards), then plays per year and top songs. The artist lives in the URL (?artist=<id>).

const logo = logoFont.className;
const n = (x: number) => x.toLocaleString("en-US");
const plays = (x: number) => `${n(x)} ${x === 1 ? "play" : "plays"}`;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const day = (date: string, options: Intl.DateTimeFormatOptions) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { ...options, timeZone: "UTC" });
const clean = (name: string | null) => (name ?? "").replace(/ \((feat|with)[^)]*\)/i, "");
const PARTS = [
  { name: "Late nights", from: 0, to: 5 },
  { name: "Mornings", from: 6, to: 11 },
  { name: "Afternoons", from: 12, to: 17 },
  { name: "Evenings", from: 18, to: 23 },
];
const clock = (hour: number) => `${hour % 12 || 12} ${hour < 12 ? "am" : "pm"}`;

type Fact = { key: string; question: string; answer: string; detail: string; image?: string | null };

function factsOf(dive: ArtistDive): Fact[] {
  const best = [...dive.perYear].sort((a, b) => b.plays - a.plays)[0];
  const peakHour = dive.byHour.indexOf(Math.max(...dive.byHour));
  const part = PARTS.map((p) => ({ ...p, plays: dive.byHour.slice(p.from, p.to + 1).reduce((a, b) => a + b, 0) })).sort((a, b) => b.plays - a.plays)[0];
  const streak = dive.longestStreak;
  const sameYear = streak.from.slice(0, 4) === streak.to.slice(0, 4);
  const top = dive.topTracks[0];
  return [
    { key: "found", question: "How I found them", answer: clean(dive.firstPlayed.via.name), detail: day(dive.firstPlayed.date, { day: "numeric", month: "long", year: "numeric" }), image: dive.firstPlayed.via.imageUrl },
    { key: "year", question: "Biggest year", answer: String(best.year), detail: plays(best.plays) },
    { key: "month", question: "Peak month", answer: `${MONTHS[dive.peakMonth.month - 1]} ${dive.peakMonth.year}`, detail: `${plays(dive.peakMonth.plays)} in one month` },
    {
      key: "streak",
      question: "Longest streak",
      answer: streak.days > 1 ? `${streak.days} days in a row` : "One day at a time",
      detail: streak.days > 1 ? `${day(streak.from, sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" })} to ${day(streak.to, { day: "numeric", month: "short", year: "numeric" })}` : "never two days running",
    },
    { key: "song", question: "Most played song", answer: clean(top?.name ?? ""), detail: top ? `${top.artist} · ${plays(top.plays)}` : "", image: top?.imageUrl },
    { key: "hour", question: "When I play them", answer: part.name, detail: `peaking at ${clock(peakHour)}` },
  ];
}

function FlipCard({ fact, up, onFlip }: { fact: Fact; up: boolean; onFlip: () => void }) {
  return (
    <button
      type="button"
      onClick={onFlip}
      aria-label={up ? `${fact.question}: ${fact.answer}, ${fact.detail}` : `${fact.question}: tap to reveal`}
      className="relative h-36 rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:h-44"
      style={{ perspective: "1000px" }}
    >
      <div className="relative h-full w-full transition-transform duration-500 motion-reduce:transition-none" style={{ transformStyle: "preserve-3d", transform: up ? "rotateY(180deg)" : "none" }}>
        <div className="absolute inset-0 flex flex-col justify-between rounded-lg border bg-black p-3 sm:p-4" style={{ backfaceVisibility: "hidden" }}>
          <p className={`${logo} text-sm uppercase leading-snug sm:text-lg`}>{fact.question}</p>
          <p className={`${logo} text-[10px] text-blue-400 sm:text-xs`}>TAP TO REVEAL</p>
        </div>
        <div className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-lg border bg-card p-3 sm:p-4" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <p className={`${logo} text-[10px] uppercase text-muted-foreground sm:text-xs`}>{fact.question}</p>
          <div className="flex items-end gap-2.5">
            {fact.image !== undefined && (
              <div className="relative h-10 w-10 shrink-0 sm:h-14 sm:w-14">
                <Image src={fact.image || "/placeholder-album.png"} alt="" fill sizes="56px" className="rounded object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className="line-clamp-2 text-base font-bold leading-tight sm:text-xl">{fact.answer}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">{fact.detail}</p>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function Years({ dive }: { dive: ArtistDive }) {
  const max = Math.max(...dive.perYear.map((y) => y.plays));
  return (
    <Card className="min-w-0">
      <CardContent className="p-4 sm:p-5">
        <h2 className={`${logo} mb-3 text-sm text-muted-foreground`}>PLAYS PER YEAR</h2>
        <div className="flex h-36 items-end gap-1.5 sm:h-44">
          {dive.perYear.map((y, i) => (
            <div key={y.year} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] tabular-nums text-muted-foreground">{y.plays >= max / 8 ? n(y.plays) : ""}</span>
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.03 }}
                  className={`w-full origin-bottom rounded-t ${y.plays === max ? "bg-blue-500" : "bg-white/20"}`}
                  style={{ height: `${Math.max(2, (y.plays / max) * 80)}%` }}
                />
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground">{"’"}{String(y.year).slice(2)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TopSongs({ dive }: { dive: ArtistDive }) {
  return (
    <Card className="min-w-0">
      <CardContent className="p-4 sm:p-5">
        <h2 className={`${logo} mb-3 text-sm text-muted-foreground`}>TOP SONGS</h2>
        <ol className="space-y-1.5">
          {dive.topTracks.map((track, i) => (
            <li key={track.id} className="flex items-center gap-2.5 text-sm">
              <span className={`w-4 text-right text-xs font-bold ${i === 0 ? "text-blue-400" : "text-muted-foreground"}`}>{i + 1}</span>
              <div className="relative h-8 w-8 shrink-0">
                <Image src={track.imageUrl || "/placeholder-album.png"} alt="" fill sizes="32px" className="rounded object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate">{track.name}</p>
                <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
              </div>
              <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">{plays(track.plays)}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`flex shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition-colors ${
      active ? "border-blue-500 bg-blue-500/15 text-white" : "border-white/15 text-muted-foreground hover:border-white/40 hover:text-white"
    }`}
  >
    {children}
  </button>
);

const fold = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Search over every artist I've played: names starting with the query first, then any match
function Search({ onPick, onClose }: { onPick: (id: string) => void; onClose: () => void }) {
  const { list, error } = useArtistList(true);
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const q = fold(query.trim());
  const results = !q || !list
    ? []
    : [
        ...list.filter(([, name]) => fold(name).split(/\s+/).some((word) => word.startsWith(q)) || fold(name).startsWith(q)),
        ...list.filter(([, name]) => !fold(name).split(/\s+/).some((word) => word.startsWith(q)) && !fold(name).startsWith(q) && fold(name).includes(q)),
      ].slice(0, 8);
  return (
    <div className="mt-3 rounded-lg border bg-card p-2 sm:max-w-md">
      <input
        ref={input}
        id="artist-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
          if (event.key === "Enter" && results[0]) onPick(results[0][0]);
        }}
        placeholder={list ? `Search ${n(list.length)} artists` : "Loading artists…"}
        aria-label="Search artists"
        className="w-full rounded-md bg-muted px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-blue-500 sm:text-sm"
      />
      {error && <p className="px-2 pt-2 text-sm text-red-400">Couldn&apos;t load the artists. Try again in a bit.</p>}
      {results.length > 0 && (
        <ul className="mt-1">
          {results.map(([id, name, count]) => (
            <li key={id}>
              <button type="button" onClick={() => onPick(id)} className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none">
                <span className="truncate">{name}</span>
                <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">{plays(count)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {q && list && results.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No artist I&apos;ve played matches that.</p>}
    </div>
  );
}

export default function DeepDive() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { slice, error: listError } = useSlice({});
  const artists = slice?.topArtists ?? [];
  const id = searchParams.get("artist") ?? artists[0]?.id ?? null;
  const { artist: dive, artistKey, loading, error } = useArtist(id);
  // Revealed facts, per artist, for this visit
  const [revealed, setRevealed] = useState<Record<string, Set<string>>>({});
  const shown = dive && artistKey ? revealed[dive.artist.id] ?? new Set<string>() : new Set<string>();

  const [searching, setSearching] = useState(false);
  const pick = (artistId: string) => {
    setSearching(false);
    window.history.pushState(null, "", `${pathname}?artist=${artistId}`);
  };
  // An artist picked from search, outside the top 10, gets its own chip at the front
  const extra = dive && !artists.some((a) => a.id === dive.artist.id) ? dive.artist : null;
  const flip = (key: string) =>
    dive && setRevealed((current) => ({ ...current, [dive.artist.id]: new Set(Array.from(current[dive.artist.id] ?? []).concat(key)) }));
  const failure = listError ?? error;

  return (
    <MotionConfig reducedMotion="user">
      <div className="container mx-auto max-w-6xl px-4 pb-6 pt-[5.5rem]">
        <div className="-mx-4 flex min-h-[2.25rem] gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {artists.length > 0 && (
            <button
              type="button"
              onClick={() => setSearching((open) => !open)}
              aria-expanded={searching}
              className={`${logo} flex shrink-0 items-center rounded-full border border-dashed px-3 text-xs transition-colors ${searching ? "border-blue-400 text-white" : "border-white/25 text-white/60 hover:border-blue-400 hover:text-white"}`}
            >
              + ANY ARTIST
            </button>
          )}
          {extra && (
            <Chip active onClick={() => undefined}>
              <span className="relative h-6 w-6 shrink-0">
                <Image src={extra.imageUrl || "/placeholder.jpg"} alt="" fill sizes="24px" className="rounded-full object-cover" />
              </span>
              {extra.name}
            </Chip>
          )}
          {artists.map((a) => (
            <Chip key={a.id} active={a.id === id} onClick={() => pick(a.id)}>
              <span className="relative h-6 w-6 shrink-0">
                <Image src={a.imageUrl || "/placeholder.jpg"} alt="" fill sizes="24px" className="rounded-full object-cover" />
              </span>
              {a.name}
            </Chip>
          ))}
        </div>
        {searching && <Search onPick={pick} onClose={() => setSearching(false)} />}

        {failure ? (
          <Alert variant="destructive" className="mt-6">
            <AlertTitle>Couldn&apos;t load this artist</AlertTitle>
            <AlertDescription>{failure.message}. Try another artist, or again in a bit.</AlertDescription>
          </Alert>
        ) : !dive ? (
          <div className="mt-5 space-y-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="h-20 w-20 animate-pulse rounded-full bg-muted sm:h-32 sm:w-32" />
              <div className="h-8 w-48 animate-pulse rounded bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
              {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-36 animate-pulse rounded-lg bg-white/[0.04] sm:h-44" />)}
            </div>
          </div>
        ) : (
          <motion.div key={artistKey} initial={{ opacity: 0, y: 6 }} animate={{ opacity: loading ? 0.4 : 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}>
            <div className="mt-5 flex items-center gap-4 sm:gap-6">
              <div className="relative h-20 w-20 shrink-0 sm:h-32 sm:w-32">
                <Image src={dive.artist.imageUrl || "/placeholder.jpg"} alt="" fill sizes="128px" className="rounded-full object-cover" />
              </div>
              <div className="min-w-0">
                <h1 className={`${logo} text-[1.6rem] uppercase leading-tight sm:text-[2.6rem]`}>{dive.artist.name}</h1>
                <p className="mt-1 flex flex-wrap gap-x-5">
                  {([["plays", dive.plays], ["hours", dive.hours]] as const).map(([label, value]) => (
                    <span key={label}>
                      <span className="text-xl font-extrabold tabular-nums tracking-tight sm:text-3xl">{n(value)}</span>{" "}
                      <span className={`${logo} text-xs uppercase text-muted-foreground sm:text-sm`}>{label}</span>
                    </span>
                  ))}
                </p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
              {factsOf(dive).map((fact) => (
                <FlipCard key={fact.key} fact={fact} up={shown.has(fact.key)} onFlip={() => flip(fact.key)} />
              ))}
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <Years dive={dive} />
              <TopSongs dive={dive} />
            </div>
          </motion.div>
        )}
      </div>
    </MotionConfig>
  );
}
