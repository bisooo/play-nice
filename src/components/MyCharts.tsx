"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { logoFont } from "@/lib/fonts";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useHistoryStats, useSlice } from "@/components/History";
import type { HistoryArtist, HistoryTrack, SliceQuery } from "@/components/History";

// Stat #1, My Charts: top artists and tracks for any year, month, time of day and place, combined.
// The headline sentence is the filter; its state lives in the URL so slices can be linked and the
// back button works.

const logo = logoFont.className;
const n = (x: number) => x.toLocaleString("en-US");
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const TIMES = {
  morning: { label: "Morning", phrase: "in the mornings", hours: [6, 11] },
  afternoon: { label: "Afternoon", phrase: "in the afternoons", hours: [12, 17] },
  evening: { label: "Evening", phrase: "in the evenings", hours: [18, 23] },
  night: { label: "Night", phrase: "at night", hours: [0, 5] },
} as const;
type Time = keyof typeof TIMES;
type Filter = "year" | "month" | "time" | "place";
// Years and places too thin to chart (the account gaps leave 2016-2017 nearly empty)
const MIN_YEAR_PLAYS = 100;
const MIN_PLACE_PLAYS = 25;

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const COUNTRY_ARTICLE = new Set(["GB", "US", "AE", "NL"]);
const placeName = (code: string) => {
  const name = code === "GB" ? "UK" : code === "US" ? "US" : code === "AE" ? "UAE" : regionNames.of(code) ?? code;
  return { short: name, phrase: COUNTRY_ARTICLE.has(code) ? `the ${name}` : name };
};

function readFilters(params: URLSearchParams) {
  const int = (name: string, min: number, max: number) => {
    const value = Number(params.get(name));
    return Number.isInteger(value) && value >= min && value <= max ? value : undefined;
  };
  const time = params.get("time");
  const place = params.get("place");
  return {
    tracks: params.get("kind") === "tracks",
    year: int("year", 2000, 2100),
    month: int("month", 1, 12),
    time: time && time in TIMES ? (time as Time) : undefined,
    place: place && /^[A-Z]{2}$/.test(place) ? place : undefined,
  };
}
type Filters = ReturnType<typeof readFilters>;

// A tappable word in the sentence. Set filters are underlined in blue; unset ones are a faint
// "+ add" chip under it
function Word({ onClick, children, expanded }: { onClick?: () => void; children: ReactNode; expanded?: boolean }) {
  const look = "whitespace-nowrap text-blue-400 underline decoration-blue-400/50 decoration-[3px] underline-offset-[7px]";
  if (!onClick) return <span className={look}>{children}</span>;
  return (
    <button type="button" onClick={onClick} aria-expanded={expanded} aria-haspopup="dialog" className={`${look} uppercase hover:decoration-blue-400 focus-visible:outline-none focus-visible:decoration-white`}>
      {children}
    </button>
  );
}

function AddChip({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${logo} inline-flex items-center rounded-full border border-dashed border-white/25 px-3 py-1 text-xs uppercase text-white/60 transition-colors hover:border-blue-400 hover:text-white sm:text-sm`}
    >
      + {children}
    </button>
  );
}

// Phones: a sheet from the bottom over a dimmed page. Wider: a popover under the sentence.
function Picker({ title, options, value, onPick, onClose }: {
  title: string;
  options: { value: string | undefined; label: string }[];
  value: string | undefined;
  onPick: (value: string | undefined) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    const onDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    ref.current?.querySelector<HTMLButtonElement>("[aria-pressed=true]")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [onClose]);
  const [any, ...rest] = options;
  const button = (option: { value: string | undefined; label: string }, wide?: boolean) => (
    <button
      key={option.label}
      type="button"
      aria-pressed={option.value === value}
      onClick={() => onPick(option.value)}
      className={`rounded-md px-2 py-2.5 text-center text-sm transition-colors ${wide ? "col-span-full" : ""} ${
        option.value === value ? "bg-white font-medium text-black" : "bg-muted text-muted-foreground hover:text-white"
      }`}
    >
      {option.label}
    </button>
  );
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 sm:hidden" />
      <div
        ref={ref}
        role="dialog"
        aria-label={title}
        className="fixed inset-x-0 bottom-0 z-[61] max-h-[70dvh] overflow-y-auto rounded-t-2xl border-t bg-background p-4 pb-8 shadow-xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mt-2 sm:w-[24rem] sm:rounded-lg sm:border sm:pb-4"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted sm:hidden" />
        <p className={`${logo} mb-2 text-xs text-muted-foreground`}>{title}</p>
        <div className="grid grid-cols-4 gap-1.5">
          {button(any, true)}
          {rest.map((option) => button(option))}
        </div>
      </div>
    </>
  );
}

function Row({ rank, item, max, track }: { rank: number; item: HistoryArtist | HistoryTrack; max: number; track?: boolean }) {
  return (
    <li className="relative flex items-center gap-3 overflow-hidden rounded-md px-2 py-1 lg:py-0.5">
      <div className="absolute inset-y-0 left-0 border-r-2 border-blue-500 bg-white/[0.07]" style={{ width: `${(item.plays / max) * 100}%` }} />
      <span className={`relative w-7 text-right font-bold tabular-nums ${rank === 1 ? "text-lg text-blue-400" : "text-sm text-muted-foreground"}`}>{rank}</span>
      <div className="relative h-10 w-10 shrink-0">
        <Image
          src={item.imageUrl || (track ? "/placeholder-album.png" : "/placeholder.jpg")}
          alt=""
          fill
          sizes="40px"
          className={`object-cover ${track ? "rounded" : "rounded-full"}`}
        />
      </div>
      <div className="relative min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        {track && <p className="truncate text-xs text-muted-foreground">{(item as HistoryTrack).artist}</p>}
      </div>
      <span className="relative whitespace-nowrap text-sm tabular-nums">
        {n(item.plays)}
        <span className="ml-1 text-xs text-muted-foreground">{item.plays === 1 ? "play" : "plays"}</span>
      </span>
    </li>
  );
}

function Board({ title, items, track, dim }: { title: string; items: (HistoryArtist | HistoryTrack)[] | undefined; track?: boolean; dim?: boolean }) {
  return (
    <Card className="w-full">
      <CardContent className="p-4 sm:p-5">
        <h2 className={`${logo} mb-3 px-2 text-base text-muted-foreground`}>{title}</h2>
        <ol className={`space-y-1 transition-opacity ${dim ? "opacity-50" : ""}`}>
          {items
            ? items.map((item, i) => <Row key={item.id} rank={i + 1} item={item} max={items[0].plays} track={track} />)
            : Array.from({ length: 10 }, (_, i) => (
                <li key={i} className="flex h-12 items-center gap-3 px-2 lg:h-11">
                  <span className="w-7 text-right text-sm font-bold text-muted-foreground">{i + 1}</span>
                  <span className={`h-10 w-10 animate-pulse bg-muted ${track ? "rounded" : "rounded-full"}`} />
                  <span className="h-3 w-32 animate-pulse rounded bg-muted" />
                </li>
              ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export default function MyCharts() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = readFilters(searchParams);
  const [open, setOpen] = useState<Filter | null>(null);
  const { stats, error: statsError } = useHistoryStats();

  const query: SliceQuery = {
    year: filters.year,
    month: filters.month,
    hours: filters.time ? [...TIMES[filters.time].hours] : undefined,
    country: filters.place,
  };
  const { slice, loading, error } = useSlice(query);

  const update = (changes: Partial<Filters>) => {
    const next = { ...filters, ...changes };
    const params = new URLSearchParams();
    if (next.tracks) params.set("kind", "tracks");
    if (next.year) params.set("year", String(next.year));
    if (next.month) params.set("month", String(next.month));
    if (next.time) params.set("time", next.time);
    if (next.place) params.set("place", next.place);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const toggle = (filter: Filter) => setOpen((current) => (current === filter ? null : filter));
  const close = () => setOpen(null);

  const years = (stats?.eras ?? []).filter((era) => era.plays >= MIN_YEAR_PLAYS).map((era) => era.year);
  const places = (stats?.travel ?? []).filter((place) => place.plays >= MIN_PLACE_PLAYS).map((place) => place.country);
  const pickers: Record<Filter, { title: string; value: string | undefined; options: { value: string | undefined; label: string }[]; pick: (value: string | undefined) => void }> = {
    year: {
      title: "YEAR",
      value: filters.year?.toString(),
      options: [{ value: undefined, label: "Any year" }, ...years.map((year) => ({ value: String(year), label: String(year) }))],
      pick: (value) => update({ year: value ? Number(value) : undefined }),
    },
    month: {
      title: "MONTH",
      value: filters.month?.toString(),
      options: [{ value: undefined, label: "Any month" }, ...MONTHS.map((name, i) => ({ value: String(i + 1), label: name.slice(0, 3) }))],
      pick: (value) => update({ month: value ? Number(value) : undefined }),
    },
    time: {
      title: "TIME OF DAY",
      value: filters.time,
      options: [{ value: undefined, label: "Any time" }, ...Object.entries(TIMES).map(([value, time]) => ({ value, label: time.label }))],
      pick: (value) => update({ time: value as Time | undefined }),
    },
    place: {
      title: "PLACE",
      value: filters.place,
      options: [{ value: undefined, label: "Anywhere" }, ...places.map((code) => ({ value: code, label: placeName(code).short }))],
      pick: (value) => update({ place: value }),
    },
  };

  // "My top artists every November at night in Egypt are…"
  const { year, month, time, place } = filters;
  const when = year && month ? `${MONTHS[month - 1]} ${year}` : year ? String(year) : month ? `every ${MONTHS[month - 1]}` : null;
  const narrowed = Boolean(year || month || time || place);
  const past = year !== undefined && year < new Date().getFullYear();
  const sentence = (kind: ReactNode) => (
    <>
      My top {kind}
      {when ? (
        <>
          {" "}{year ? "in " : ""}
          <Word onClick={() => toggle(year ? "year" : "month")} expanded={open === "year" || open === "month"}>{when}</Word>
        </>
      ) : !narrowed ? (
        <> of <Word onClick={() => toggle("year")} expanded={open === "year"}>all time</Word></>
      ) : null}
      {time && <> <Word onClick={() => toggle("time")} expanded={open === "time"}>{TIMES[time].phrase}</Word></>}
      {place && <> in <Word onClick={() => toggle("place")} expanded={open === "place"}>{placeName(place).phrase}</Word></>}
      {" "}{past ? "were" : "are"}…
    </>
  );

  const failure = statsError ?? error;
  const empty = slice && slice.plays === 0;
  const picker = open && pickers[open];

  return (
    <div className="container mx-auto max-w-6xl px-4 pb-6 pt-[5.5rem]">
      <div className="relative">
        <h1 className={`${logo} text-[1.6rem] uppercase leading-[1.45] sm:text-[2.6rem] sm:leading-[1.35]`}>
          {/* phones show one list, so the first word switches it; laptops show both */}
          <span className="lg:hidden">{sentence(<Word onClick={() => update({ tracks: !filters.tracks })}>{filters.tracks ? "tracks" : "artists"}</Word>)}</span>
          <span className="hidden lg:inline">{sentence(<Word>artists and tracks</Word>)}</span>
        </h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {!year && <AddChip onClick={() => toggle("year")}>year</AddChip>}
          {!month && <AddChip onClick={() => toggle("month")}>month</AddChip>}
          {!time && <AddChip onClick={() => toggle("time")}>time of day</AddChip>}
          {!place && <AddChip onClick={() => toggle("place")}>place</AddChip>}
        </div>
        {picker && (
          <Picker
            title={picker.title}
            options={picker.options}
            value={picker.value}
            onPick={(value) => {
              picker.pick(value);
              close();
            }}
            onClose={close}
          />
        )}
      </div>

      <div className="mb-6 mt-5 flex items-baseline gap-6">
        {(["plays", "hours"] as const).map((key) => (
          <p key={key}>
            <span className="text-2xl font-extrabold tabular-nums tracking-tight sm:text-4xl">{slice ? n(slice[key]) : "–"}</span>{" "}
            <span className={`${logo} text-xs uppercase text-muted-foreground sm:text-sm`}>{key}</span>
          </p>
        ))}
      </div>

      {failure ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t load my charts</AlertTitle>
          <AlertDescription>{failure.message}. Try again in a bit.</AlertDescription>
        </Alert>
      ) : empty ? (
        <p className="py-10 text-center text-muted-foreground">Nothing played here. Try taking a filter off.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={`min-w-0 ${filters.tracks ? "hidden lg:block" : ""}`}>
            <Board title="ARTISTS" items={slice?.topArtists} dim={loading && !!slice} />
          </div>
          <div className={`min-w-0 ${filters.tracks ? "" : "hidden lg:block"}`}>
            <Board title="TRACKS" items={slice?.topTracks} track dim={loading && !!slice} />
          </div>
        </div>
      )}
    </div>
  );
}
