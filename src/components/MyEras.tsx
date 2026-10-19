"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { logoFont } from "@/lib/fonts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useHistoryStats } from "@/components/History";
import type { HistoryArtist, HistoryStats } from "@/components/History";

// Stat #2, My Eras: my No. 1 artist of every year. Back-to-back years with the same No. 1 merge
// into one reign, sized by how long it lasted. Tapping a reign shows its years: hours and plays,
// the rest of the top five and the most played song, with a way into My Charts for that year.

const logo = logoFont.className;
// Years too thin to stand for anything (the account gaps leave 2015-2017 nearly empty)
const MIN_YEAR_PLAYS = 500;
const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen"];
const ORDINALS = ["", "", "2nd", "3rd", "4th", "5th", "6th"];
const word = (x: number) => WORDS[x] ?? String(x);

type Era = HistoryStats["eras"][number];
type Reign = { artist: HistoryArtist; years: number[]; eras: Era[]; nth: number };
const n = (x: number) => x.toLocaleString("en-US");

// Oldest first
function reignsOf(stats: HistoryStats) {
  const reigns: Reign[] = [];
  for (const era of stats.eras) {
    const top = era.topArtists[0];
    if (era.plays < MIN_YEAR_PLAYS || !top) continue;
    const last = reigns[reigns.length - 1];
    if (last && last.artist.id === top.id) {
      last.years.push(era.year);
      last.eras.push(era);
    } else reigns.push({ artist: top, years: [era.year], eras: [era], nth: reigns.filter((r) => r.artist.id === top.id).length + 1 });
  }
  return reigns;
}

// What the reigns don't show at a glance: how the current No. 1 got there
function hook(reigns: Reign[]) {
  const now = reigns[reigns.length - 1];
  if (!now) return "";
  const name = now.artist.name;
  if (now.nth > 1) {
    const before = reigns.filter((r) => r.artist.id === now.artist.id).slice(-2)[0];
    return `${name} is back on top for the first time since ${before.years[before.years.length - 1]}.`;
  }
  if (now.years.length > 1) return `${name} has held the top spot since ${now.years[0]}.`;
  const previous = reigns[reigns.length - 2];
  return previous ? `${name} took over from ${previous.artist.name}.` : "";
}

const span = (reign: Reign) =>
  reign.years.length > 1 ? `${reign.years[0]}–${String(reign.years[reign.years.length - 1]).slice(2)}` : String(reign.years[0]);

function Badge({ reign }: { reign: Reign }) {
  if (reign.nth < 2) return null;
  return <span className={`${logo} absolute right-2 top-2 rounded bg-blue-500 px-1.5 py-0.5 text-[10px] text-white`}>{ORDINALS[reign.nth] ?? `${reign.nth}th`} REIGN</span>;
}

// One year of a reign: its size, the top five below the No. 1 already shown, and its song
function YearDetail({ era }: { era: Era }) {
  const [top, ...rest] = era.topArtists;
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="text-2xl font-extrabold tabular-nums tracking-tight">{era.year}</p>
        <p className="text-sm tabular-nums text-muted-foreground">
          <span className="font-semibold text-white">{n(era.hours)}</span> <span className={`${logo} text-xs`}>HOURS</span>
          {" · "}
          <span className="font-semibold text-white">{n(era.plays)}</span> <span className={`${logo} text-xs`}>PLAYS</span>
        </p>
      </div>
      <ol className="mt-3 space-y-1">
        {[top, ...rest].map((artist, i) => (
          <li key={artist.id} className="flex items-center gap-2.5 text-sm">
            <span className={`w-4 text-right text-xs font-bold ${i === 0 ? "text-blue-400" : "text-muted-foreground"}`}>{i + 1}</span>
            <div className="relative h-7 w-7 shrink-0">
              <Image src={artist.imageUrl || "/placeholder.jpg"} alt="" fill sizes="28px" className="rounded-full object-cover" />
            </div>
            <span className={`flex-1 truncate ${i === 0 ? "font-semibold" : ""}`}>{artist.name}</span>
            <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">{n(artist.plays)} plays</span>
          </li>
        ))}
      </ol>
      {era.topTrack && (
        <div className="mt-3 flex items-center gap-2.5 rounded-md bg-white/[0.05] p-2">
          <div className="relative h-9 w-9 shrink-0">
            <Image src={era.topTrack.imageUrl || "/placeholder-album.png"} alt="" fill sizes="36px" className="rounded object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`${logo} text-[10px] text-blue-400`}>SONG OF THE YEAR</p>
            <p className="truncate text-sm">
              {era.topTrack.name} <span className="text-muted-foreground">· {era.topTrack.artist}</span>
            </p>
          </div>
          <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">{n(era.topTrack.plays)} plays</span>
        </div>
      )}
      <Link href={`/charts?year=${era.year}`} className={`${logo} mt-3 inline-block text-xs text-blue-400 underline decoration-blue-400/50 underline-offset-4 hover:decoration-blue-400`}>
        SEE IT IN MY CHARTS →
      </Link>
    </div>
  );
}

function ReignDetail({ reign }: { reign: Reign }) {
  return (
    <div className={`grid gap-6 ${reign.eras.length > 1 ? "sm:grid-cols-2" : ""}`}>
      {[...reign.eras].reverse().map((era) => (
        <YearDetail key={era.year} era={era} />
      ))}
    </div>
  );
}

const enter = (i: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut", delay: i * 0.05 },
});

export default function MyEras() {
  const { stats, error } = useHistoryStats();
  const reigns = stats ? reignsOf(stats) : null;
  const years = reigns?.reduce((sum, reign) => sum + reign.years.length, 0) ?? 0;
  const kings = new Set(reigns?.map((reign) => reign.artist.id)).size;
  // Laptop always shows one reign's years (the latest until another is picked); phones open rows in place
  const [picked, setPicked] = useState<number | null>(null);
  const [opened, setOpened] = useState<number | null>(null);
  const shown = reigns?.find((reign) => reign.years[0] === picked) ?? reigns?.[reigns.length - 1];

  return (
    <MotionConfig reducedMotion="user">
      <div className="container mx-auto max-w-6xl px-4 pb-6 pt-[5.5rem]">
        <h1 className={`${logo} min-h-[2.8em] text-[1.6rem] uppercase leading-[1.4] sm:min-h-0 sm:text-[2.6rem]`}>
          {reigns ? `${word(years)} years, ${word(kings).toLowerCase()} number ${kings === 1 ? "one" : "ones"}` : ""}
        </h1>
        <p className="mt-2 min-h-[1.5em] text-sm font-semibold text-muted-foreground sm:text-base">{reigns ? hook(reigns) : ""}</p>

        {error ? (
          <Alert variant="destructive" className="mt-6">
            <AlertTitle>Couldn&apos;t load my eras</AlertTitle>
            <AlertDescription>{error.message}. Try again in a bit.</AlertDescription>
          </Alert>
        ) : !reigns ? (
          <div className="mt-6 h-[26rem] animate-pulse rounded-md bg-white/[0.04] lg:mt-8" />
        ) : (
          <>
            {/* laptop: one relay, oldest to newest, each reign as wide as the years it lasted */}
            <div className="mt-8 hidden h-[22rem] gap-1.5 lg:flex">
              {reigns.map((reign, i) => (
                <motion.div key={reign.years[0]} {...enter(i)} style={{ flex: reign.years.length }} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setPicked(reign.years[0])}
                    aria-pressed={reign === shown}
                    className={`group relative block h-full w-full overflow-hidden rounded-md text-left transition-opacity duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
                      reign === shown ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-background" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image src={reign.artist.imageUrl || "/placeholder.jpg"} alt="" fill sizes="(min-width: 1024px) 25vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <Badge reign={reign} />
                    <div className="absolute inset-x-3 bottom-3">
                      <p className="text-2xl font-extrabold tabular-nums tracking-tight">{span(reign)}</p>
                      <p className={`${logo} mt-1 text-sm uppercase leading-tight`}>{reign.artist.name}</p>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
            {shown && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={shown.years[0]}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="mt-6 hidden rounded-lg border bg-card p-5 lg:block"
                >
                  <ReignDetail reign={shown} />
                </motion.div>
              </AnimatePresence>
            )}
            {/* phones: newest on top, each reign as tall as the years it lasted */}
            <div className="mt-6 space-y-1.5 lg:hidden">
              {[...reigns].reverse().map((reign, i) => (
                <motion.div key={reign.years[0]} {...enter(i)}>
                  <button
                    type="button"
                    onClick={() => setOpened((current) => (current === reign.years[0] ? null : reign.years[0]))}
                    aria-expanded={opened === reign.years[0]}
                    className="relative flex w-full overflow-hidden rounded-md text-left"
                    style={{ height: `${4.5 * reign.years.length + 0.375 * (reign.years.length - 1)}rem` }}
                  >
                    <Image src={reign.artist.imageUrl || "/placeholder.jpg"} alt="" fill sizes="100vw" className="object-cover object-[50%_30%]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
                    <div className="relative flex flex-col justify-center px-4">
                      <p className="text-2xl font-extrabold tabular-nums tracking-tight">{span(reign)}</p>
                      <p className={`${logo} text-sm uppercase`}>{reign.artist.name}</p>
                    </div>
                    <Badge reign={reign} />
                  </button>
                  <AnimatePresence initial={false}>
                    {opened === reign.years[0] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-1 pb-4 pt-3">
                          <ReignDetail reign={reign} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </MotionConfig>
  );
}
