"use client";

import { useState } from "react";
import Image from "next/image";
import { MotionConfig, motion } from "framer-motion";
import { logoFont } from "@/lib/fonts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useHistoryStats } from "@/components/History";
import type { GenreYear, HistoryStats } from "@/components/History";

// Stat #4, The Egyptian turn: my genre mix as a stream of nine bands, Arabic rising from the floor.
// Tapping a band, its chip or a year shows that group in that year: its share, how it moved year
// by year, its top artists and the Spotify genres inside it. Groups come from src/lib/genreGroups.mjs.

const logo = logoFont.className;
// Years too thin to stand for anything (the account gaps leave 2015-2017 nearly empty)
const MIN_YEAR_PLAYS = 500;

// Bottom of the stack first, so the Arabic bands rise from the floor. Keys match GENRE_GROUPS.
export const GROUPS = [
  { key: "egypt-rap", label: "Egyptian rap", color: "#fdba74" },
  { key: "arabic-pop", label: "Arabic pop", color: "#fde68a" },
  { key: "afro", label: "Afrobeats", color: "#bef264" },
  { key: "uk-rap", label: "UK rap", color: "#6ee7b7" },
  { key: "underground", label: "Underground", color: "#67e8f9" },
  { key: "west-east", label: "West & East", color: "#93c5fd" },
  { key: "us-rap", label: "US rap", color: "#c4b5fd" },
  { key: "rnb", label: "R&B & soul", color: "#f9a8d4" },
  { key: "other", label: "Other", color: "#cbd5e1" },
] as const;
type Group = (typeof GROUPS)[number];
const ARABIC = ["egypt-rap", "arabic-pop"];
const RAP = ["egypt-rap", "uk-rap", "underground", "west-east", "us-rap"];

const n = (x: number) => x.toLocaleString("en-US");
export const pct = (share: number) => {
  const x = share * 100;
  if (x > 0 && x < 0.05) return "<0.1%";
  return x >= 10 ? `${Math.round(x)}%` : `${x.toFixed(1).replace(".0", "")}%`;
};
const shareOf = (year: GenreYear, key: string) => year.groups?.find((g) => g.key === key)?.share ?? 0;
export const arabicShare = (year: GenreYear) => ARABIC.reduce((sum, key) => sum + shareOf(year, key), 0);

// The years worth showing, oldest first; null while stored stats still have the old shape
export function genreYears(stats: HistoryStats) {
  const years = stats.genres.filter((y) => y.plays >= MIN_YEAR_PLAYS);
  return years.length > 1 && years.every((y) => y.groups) ? years : null;
}

// Rough fractions read better than numbers in a headline
const FRACTIONS: [number, string][] = [[0, "zero"], [0.1, "a tenth"], [0.2, "a fifth"], [0.25, "a quarter"], [1 / 3, "a third"], [0.5, "half"], [2 / 3, "two thirds"]];
const fraction = (share: number) => FRACTIONS.reduce((best, f) => (Math.abs(f[0] - share) < Math.abs(best[0] - share) ? f : best))[1];

function headline(years: GenreYear[]) {
  return `From ${fraction(arabicShare(years[0]))} to ${fraction(arabicShare(years[years.length - 1]))} Arabic`;
}

// Who carried the Arabic share this year, and what still leads
function hook(years: GenreYear[]) {
  const last = years[years.length - 1];
  const plays = new Map<string, { name: string | null; plays: number }>();
  for (const group of last.groups ?? []) {
    if (!ARABIC.includes(group.key)) continue;
    for (const a of group.topArtists) plays.set(a.id, { name: a.name, plays: (plays.get(a.id)?.plays ?? 0) + a.plays });
  }
  const leaders = Array.from(plays.values()).sort((a, b) => b.plays - a.plays).slice(0, 2).map((a) => a.name);
  const rap = RAP.reduce((sum, key) => sum + shareOf(last, key), 0);
  const biggest = GROUPS.filter((g) => !RAP.includes(g.key)).reduce((best, g) => (shareOf(last, g.key) > shareOf(last, best.key) ? g : best));
  const lead = rap >= shareOf(last, biggest.key) ? "rap still has the biggest slice" : `${biggest.label} has the biggest slice`;
  return leaders.length ? `${leaders.join(" and ")} led the turn, and ${lead}.` : "";
}

// Smooth bands through each year's cumulative shares
const curve = (pts: [number, number][]) =>
  pts
    .map((p, i) => {
      if (!i) return `M${p[0]} ${p[1]}`;
      const q = pts[i - 1];
      const mx = (q[0] + p[0]) / 2;
      return `C${mx} ${q[1]} ${mx} ${p[1]} ${p[0]} ${p[1]}`;
    })
    .join(" ");

export function bandPaths(years: GenreYear[], W: number, H: number, pad: number, base: number, top = 10) {
  const x = (i: number) => pad + (i * (W - 2 * pad)) / (years.length - 1);
  const y = (share: number) => base - share * (base - top);
  const cum = years.map((year) => {
    let acc = 0;
    return GROUPS.map((g) => [acc, (acc += shareOf(year, g.key))]);
  });
  const paths = GROUPS.map((_, k) => {
    const upper = years.map((_, i) => [x(i), y(cum[i][k][1])] as [number, number]);
    const lower = years.map((_, i) => [x(i), y(cum[i][k][0])] as [number, number]).reverse();
    return `${curve(upper)} L${lower[0][0]} ${lower[0][1]} ${curve(lower).replace(/^M[^C]*/, "")} Z`;
  });
  return { x, paths };
}

function Stream({ years, year, group, onYear, onGroup, W, H, font, className }: {
  years: GenreYear[]; year: number; group: Group; onYear: (y: number) => void; onGroup: (g: Group) => void; W: number; H: number; font: number; className: string;
}) {
  const base = H - font * 2.2;
  const { x, paths } = bandPaths(years, W, H, font * 1.4, base);
  const picked = years.findIndex((y) => y.year === year);
  const k = GROUPS.indexOf(group);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label="My genre mix by year">
      {paths.map((d, i) => (
        <path
          key={GROUPS[i].key}
          d={d}
          fill={GROUPS[i].color}
          opacity={i === k ? 1 : 0.8}
          stroke="#000"
          strokeWidth={1.5}
          className="cursor-pointer transition-opacity duration-200"
          onClick={() => onGroup(GROUPS[i])}
        />
      ))}
      <path d={paths[k]} fill="none" stroke="#fff" strokeWidth={2.5} pointerEvents="none" />
      <line x1={x(picked)} x2={x(picked)} y1={10} y2={base} stroke="#fff" strokeWidth={2} strokeDasharray="4 4" pointerEvents="none" />
      {years.map((y, i) => (
        <text
          key={y.year}
          x={x(i)}
          y={H - font * 0.6}
          textAnchor="middle"
          fontSize={font}
          fill={y.year === year ? "#fff" : "#94a3b8"}
          fontWeight={y.year === year ? 700 : 400}
          className="cursor-pointer outline-none focus-visible:underline"
          role="button"
          tabIndex={0}
          aria-label={String(y.year)}
          aria-pressed={y.year === year}
          onClick={() => onYear(y.year)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onYear(y.year))}
        >
          {y.year === year ? y.year : `’${String(y.year).slice(2)}`}
        </text>
      ))}
    </svg>
  );
}

function Spark({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values) || 1;
  return (
    <svg viewBox="0 0 90 22" className="h-[22px] w-[90px]" aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth={2} points={values.map((v, i) => `${(i * 90) / (values.length - 1)},${20 - (v / max) * 18}`).join(" ")} />
    </svg>
  );
}

function Panel({ years, year, group, onYear }: { years: GenreYear[]; year: number; group: Group; onYear: (y: number) => void }) {
  const row = years.find((y) => y.year === year)!;
  const data = row.groups!.find((g) => g.key === group.key);
  const shares = years.map((y) => shareOf(y, group.key));
  const max = Math.max(...shares) || 1;
  const subs = Object.entries(data?.genres ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return (
    <div className="rounded-lg border bg-card p-5">
      <p className={`${logo} text-xs uppercase`} style={{ color: group.color }}>{year} · {group.label}</p>
      <p className="mt-1.5 text-[1.75rem] font-extrabold tabular-nums tracking-tight">
        {pct(data?.share ?? 0)} <span className="text-sm font-medium tracking-normal text-muted-foreground">of my plays</span>
      </p>
      <div className="mt-3.5 flex h-[86px] gap-1">
        {years.map((y, i) => (
          <button
            key={y.year}
            type="button"
            onClick={() => onYear(y.year)}
            aria-pressed={y.year === year}
            aria-label={`${y.year}: ${pct(shares[i])}`}
            className="flex min-w-0 flex-1 flex-col items-center gap-[3px] rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            <span className={`whitespace-nowrap text-[10px] tabular-nums ${y.year === year ? "font-bold text-white" : "text-muted-foreground"}`}>{shares[i] ? pct(shares[i]) : "–"}</span>
            <span className="flex w-full flex-1 items-end">
              <span className="block w-full rounded-t-[3px]" style={{ height: `${Math.max(2, (shares[i] / max) * 100)}%`, background: group.color, opacity: y.year === year ? 1 : 0.55 }} />
            </span>
            <span className={`text-[10px] ${y.year === year ? "font-bold text-white" : "text-muted-foreground"}`}>’{String(y.year).slice(2)}</span>
          </button>
        ))}
      </div>
      {!!data?.topArtists.length && (
        <ol className="mt-4 space-y-1.5">
          {data.topArtists.map((artist, i) => (
            <li key={artist.id} className="flex items-center gap-2.5 text-sm">
              <span className="w-3.5 text-right text-xs font-bold text-muted-foreground">{i + 1}</span>
              <div className="relative h-7 w-7 shrink-0">
                <Image src={artist.imageUrl || "/placeholder.jpg"} alt="" fill sizes="28px" className="rounded-full object-cover" />
              </div>
              <span className="flex-1 truncate">{artist.name}</span>
              <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">{n(artist.plays)} {artist.plays === 1 ? "play" : "plays"}</span>
            </li>
          ))}
        </ol>
      )}
      {!!subs.length && (
        <>
          <p className={`${logo} mt-5 text-xs uppercase text-muted-foreground`}>Inside {group.label} in {year}</p>
          <div className="mt-2.5 grid gap-2">
            {subs.map(([genre, share]) => (
              <div key={genre} className="grid grid-cols-[minmax(0,1fr)_90px_44px] items-center gap-2.5 text-[13px]">
                <span className="truncate">{genre}</span>
                <Spark values={years.map((y) => y.groups?.find((g) => g.key === group.key)?.genres[genre] ?? 0)} color={group.color} />
                <span className="text-right tabular-nums text-muted-foreground">{pct(share)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function GenreTurn() {
  const { stats, error } = useHistoryStats();
  const years = stats ? genreYears(stats) : null;
  const [picked, setPicked] = useState<number | null>(null);
  const [group, setGroup] = useState<Group>(GROUPS[0]);
  const year = years?.some((y) => y.year === picked) ? picked! : years?.[years.length - 1].year ?? 0;
  const row = years?.find((y) => y.year === year);

  return (
    <MotionConfig reducedMotion="user">
      <div className="container mx-auto max-w-6xl px-4 pb-6 pt-[5.5rem]">
        <h1 className={`${logo} min-h-[2.8em] text-[1.6rem] uppercase leading-[1.4] sm:min-h-0 sm:text-[2.6rem]`}>{years ? headline(years) : ""}</h1>
        <p className="mt-2 min-h-[3em] text-sm font-semibold text-muted-foreground sm:min-h-[1.5em] sm:text-base">{years ? hook(years) : ""}</p>

        {error ? (
          <Alert variant="destructive" className="mt-6">
            <AlertTitle>Couldn&apos;t load my genres</AlertTitle>
            <AlertDescription>{error.message}. Try again in a bit.</AlertDescription>
          </Alert>
        ) : stats && !years ? (
          <Alert className="mt-6">
            <AlertTitle>Still sorting the genres</AlertTitle>
            <AlertDescription>The genre mix shows up after tonight&apos;s update.</AlertDescription>
          </Alert>
        ) : !years || !row ? (
          <div className="mt-6 h-[26rem] animate-pulse rounded-md bg-white/[0.04]" />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: "easeOut" }}>
            <p className={`${logo} mt-6 text-[11px] uppercase text-muted-foreground`}>Tap a genre or a year</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {GROUPS.map((g) => {
                const on = g.key === group.key;
                return (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setGroup(g)}
                    aria-pressed={on}
                    className="inline-flex items-center gap-1.5 rounded-full border px-[11px] py-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:gap-2 sm:px-3.5 sm:py-[7px]"
                    style={{ color: g.color, borderColor: on ? g.color : undefined, background: on ? `${g.color}22` : undefined }}
                  >
                    <span className={`${logo} text-[10px] uppercase sm:text-xs`}>{g.label}</span>
                    <span className={`text-xs tabular-nums sm:text-[13px] ${on ? "text-white" : "text-muted-foreground"}`}>{pct(shareOf(row, g.key))}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
              <div>
                <Stream years={years} year={year} group={group} onYear={setPicked} onGroup={setGroup} W={1000} H={380} font={18} className="hidden h-auto w-full sm:block" />
                <Stream years={years} year={year} group={group} onYear={setPicked} onGroup={setGroup} W={600} H={440} font={24} className="h-auto w-full sm:hidden" />
              </div>
              <Panel years={years} year={year} group={group} onYear={setPicked} />
            </div>
          </motion.div>
        )}
      </div>
    </MotionConfig>
  );
}
