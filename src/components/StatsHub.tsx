"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { logoFont } from "@/lib/fonts";
import { useHistoryStats, useSlice } from "@/components/History";
import type { HistoryStats } from "@/components/History";
import { NowPlaying } from "@/types/spotify";

const logo = logoFont.className;
const n = (x: number) => x.toLocaleString("en-US");
const NUMBER_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"];
// Years too thin to stand for anything (the account gaps leave 2016-2017 nearly empty)
const MIN_YEAR_PLAYS = 500;
const month = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleString("en-US", { month: "long", timeZone: "UTC" });

// Every tile has the same rhythm: a visual, the name (one line), a hook (three lines on phones, two
// wider) and what's inside (two lines), so tiles side by side line up whatever their copy
function Tile({ name, href, visual, hook, inside, soon }: { name: string; href?: string; visual: ReactNode; hook: ReactNode; inside: string; soon?: boolean }) {
  const body = (
    <>
      <div className="relative aspect-square overflow-hidden">
        {visual}
        {soon && <span className={`${logo} absolute right-2 top-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white/80 sm:text-xs`}>SOON</span>}
      </div>
      <div className="p-3 sm:p-4">
        <p className={`${logo} truncate text-sm text-blue-400 sm:text-lg`}>{name}</p>
        <p className="mt-1 line-clamp-3 min-h-[3lh] text-sm font-semibold leading-snug sm:line-clamp-2 sm:min-h-[2lh] sm:text-base">{hook}</p>
        <p className="mt-1.5 line-clamp-2 min-h-[2lh] text-xs leading-snug text-muted-foreground sm:text-sm">{inside}</p>
      </div>
    </>
  );
  const className = "flex flex-col overflow-hidden rounded-lg border bg-card";
  return href ? (
    <Link href={href} className={`${className} transition-colors hover:border-blue-500/60 focus-visible:border-blue-500 focus-visible:outline-none`}>{body}</Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

// A word in a sample query, styled like My Charts' tappable filters
const Ex = ({ children }: { children: ReactNode }) => (
  <span className="whitespace-nowrap text-blue-400 underline decoration-blue-400/50 decoration-2 underline-offset-4">{children}</span>
);

const Placeholder = () => <div className="h-full w-full animate-pulse bg-white/[0.04]" />;

function ChartsTile({ stats }: { stats: HistoryStats | null }) {
  // The sample: this month across every year, set against the all-time No. 1
  const thisMonth = new Date().getMonth() + 1;
  const monthName = new Date(2000, thisMonth - 1).toLocaleString("en-US", { month: "long" });
  const { slice } = useSlice(stats ? { month: thisMonth } : null);
  const { slice: allTime } = useSlice(stats ? {} : null);
  const top = slice?.topArtists.slice(0, 3);
  const leader = allTime?.topArtists[0]?.name;
  const monthLeader = top?.[0]?.name;
  return (
    <Tile
      name="MY CHARTS"
      href="/charts"
      visual={
        top ? (
          <div className="flex h-full flex-col justify-center gap-2 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent p-3 sm:p-5">
            <p className={`${logo} text-[11px] uppercase leading-[1.7] sm:text-base sm:leading-[1.6]`}>
              My top <Ex>artists</Ex> every <Ex>{monthName}</Ex>
            </p>
            <div className="space-y-1 sm:space-y-1.5">
              {top.map((artist, i) => (
                <div key={artist.id} className="flex items-center gap-1.5 rounded bg-white/[0.06] px-1.5 py-1 sm:gap-2">
                  <span className={`w-3 text-right text-[10px] font-bold sm:text-xs ${i === 0 ? "text-blue-400" : "text-muted-foreground"}`}>{i + 1}</span>
                  <div className="relative h-5 w-5 shrink-0 sm:h-7 sm:w-7">
                    <Image src={artist.imageUrl || "/placeholder.jpg"} alt="" fill sizes="28px" className="rounded-full object-cover" />
                  </div>
                  <span className="flex-1 truncate text-[10px] sm:text-sm">{artist.name}</span>
                  <span className="text-[10px] text-muted-foreground sm:text-xs">{artist.plays}</span>
                </div>
              ))}
            </div>
          </div>
        ) : <Placeholder />
      }
      hook={
        leader && monthLeader
          ? leader === monthLeader
            ? `${leader} leads all time, and every ${monthName} too.`
            : `${leader} leads all time, but my ${monthName}s belong to ${monthLeader}.`
          : ""
      }
      inside="My top 10 for any year, month, hour or place."
    />
  );
}

// "A ruled 2022 and 2023, then B took over": the latest run of two or more years and who followed
function erasHook(eras: { year: number; name: string }[]) {
  for (let end = eras.length - 2; end > 0; end--) {
    let start = end;
    while (start > 0 && eras[start - 1].name === eras[end].name) start--;
    if (end > start && eras[end + 1].name !== eras[end].name) {
      const years = end - start === 1 ? `${eras[start].year} and ${eras[end].year}` : `${eras[start].year} to ${eras[end].year}`;
      return `${eras[end].name} ruled ${years}, then ${eras[end + 1].name} took over.`;
    }
  }
  const last = eras[eras.length - 1];
  return last ? `${last.name} leads ${last.year} so far.` : "";
}

function ErasTile({ stats }: { stats: HistoryStats | null }) {
  const eras = (stats?.eras ?? [])
    .filter((era) => era.plays >= MIN_YEAR_PLAYS && era.topArtists[0])
    .map((era) => ({ year: era.year, ...era.topArtists[0] }));
  return (
    <Tile
      name="MY ERAS"
      soon
      visual={
        stats ? (
          <div className="flex h-full flex-col justify-center gap-1 px-3 pb-2 pt-8 sm:gap-1.5 sm:p-5 sm:pt-9">
            {eras.slice(-5).map((era) => (
              <div key={era.year} className="flex items-center gap-2">
                <span className={`${logo} w-6 text-[11px] text-muted-foreground sm:w-8 sm:text-sm`}>{"’"}{String(era.year).slice(2)}</span>
                <div className="relative h-6 w-6 shrink-0 sm:h-9 sm:w-9">
                  <Image src={era.imageUrl || "/placeholder.jpg"} alt="" fill sizes="36px" className="rounded-full object-cover" />
                </div>
                <span className="truncate text-[11px] font-medium sm:text-sm">{era.name}</span>
              </div>
            ))}
          </div>
        ) : <Placeholder />
      }
      hook={erasHook(eras.slice(-5).map((era) => ({ year: era.year, name: era.name ?? "" })))}
      inside="My No. 1 artist of every year."
    />
  );
}

function StreaksTile({ stats }: { stats: HistoryStats | null }) {
  const streak = stats?.streaks.overall;
  // The run on a calendar, from the Monday four weeks before it to three weeks after
  const days: { date: string; plays: number }[] = [];
  if (stats && streak) {
    const day = new Date(`${streak.from}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() - 28 - ((day.getUTCDay() + 6) % 7));
    const end = new Date(`${streak.to}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 21);
    for (; day <= end; day.setUTCDate(day.getUTCDate() + 1)) {
      const date = day.toISOString().slice(0, 10);
      days.push({ date, plays: stats.daily[date] ?? 0 });
    }
  }
  const months = days.filter((d) => d.date.endsWith("-15")).map((d) => month(d.date).slice(0, 3).toUpperCase());
  return (
    <Tile
      name="STREAKS"
      soon
      visual={
        streak ? (
          <div className="flex h-full flex-col justify-center p-3 sm:p-5">
            <p className={`${logo} mb-2 text-[11px] sm:text-base`}><span className="text-blue-400">{streak.days} DAYS</span> IN A ROW</p>
            <div className="grid grid-flow-col grid-rows-7 gap-[2px] sm:gap-[3px]">
              {days.map((d) => {
                const inRun = d.date >= streak.from && d.date <= streak.to;
                return (
                  <span
                    key={d.date}
                    className={`aspect-square rounded-[1px] ${!d.plays ? "bg-white/[0.04] outline outline-1 outline-red-400/60" : inRun ? "bg-blue-500" : "bg-white/15"}`}
                    style={inRun ? { opacity: 0.45 + Math.min(d.plays, 80) / 145 } : undefined}
                  />
                );
              })}
            </div>
            <div className={`${logo} mt-1.5 flex justify-between text-[9px] text-muted-foreground sm:text-xs`}>
              {months.map((m) => <span key={m}>{m}</span>)}
            </div>
          </div>
        ) : <Placeholder />
      }
      hook={streak ? `Not one day off, ${month(streak.from)} to ${month(streak.to)} ${streak.to.slice(0, 4)}.` : ""}
      inside="My longest daily listening runs."
    />
  );
}

function NowPlayingTile() {
  // undefined while loading; null when nothing is playing or Spotify can't be reached
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/spotify/current-track")
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => !cancelled && setNowPlaying(body))
      .catch(() => !cancelled && setNowPlaying(null));
    return () => {
      cancelled = true;
    };
  }, []);
  const track = nowPlaying?.isPlaying ? nowPlaying.track : null;
  return (
    <Tile
      name="NOW PLAYING"
      href="/now-playing"
      visual={
        <div className="relative h-full bg-gradient-to-br from-orange-500/40 via-fuchsia-500/20 to-black">
          <div className="absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2">
            <Image src={track?.imageUrl || "/play-nice-color.png"} alt="" fill sizes="200px" className={track ? "rounded-md object-cover shadow-2xl" : "object-contain opacity-80"} unoptimized={!track} />
          </div>
          {track && (
            <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold sm:text-xs">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" /> LIVE
            </span>
          )}
        </div>
      }
      hook={track ? `${track.name} by ${track.artists[0]}, right now.` : nowPlaying !== undefined ? "Nothing on right now." : ""}
      inside="Live, in the colours of the cover."
    />
  );
}

export default function StatsHub() {
  const { stats, error } = useHistoryStats();
  const years = stats ? new Date().getFullYear() - new Date(stats.totals.firstPlay).getFullYear() : null;
  const totals: [number | undefined, string][] = [
    [stats?.totals.plays, "plays"],
    [stats?.totals.hours, "hours"],
    [stats?.totals.artists, "artists"],
    [stats?.totals.tracks, "tracks"],
  ];
  return (
    <div className="container mx-auto max-w-6xl px-4 pb-6 pt-[5.5rem]">
      <h1 className={`${logo} min-h-[2.8em] text-[1.6rem] uppercase leading-[1.4] sm:min-h-0 sm:text-[2.6rem]`}>
        {years !== null ? `${NUMBER_WORDS[years] ?? years} years of my listening` : ""}
      </h1>
      {error && <p className="mt-2 text-sm text-red-400">{error.message}. Try again in a bit.</p>}
      <div className="mb-7 mt-4 grid grid-cols-2 gap-x-6 gap-y-2 lg:grid-cols-4">
        {totals.map(([value, label]) => (
          <p key={label}>
            <span className="text-2xl font-extrabold tabular-nums tracking-tight sm:text-4xl">{value !== undefined ? n(value) : "–"}</span>{" "}
            <span className={`${logo} text-xs uppercase text-muted-foreground sm:text-sm`}>{label}</span>
          </p>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <ChartsTile stats={stats} />
        <ErasTile stats={stats} />
        <StreaksTile stats={stats} />
        <NowPlayingTile />
      </div>
    </div>
  );
}
