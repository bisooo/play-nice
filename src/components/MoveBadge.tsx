import type { Move } from "@/hooks/useReveals";

// Shown on a revealed card: how it changed since the deck last saw it
export default function MoveBadge({ move }: { move: Move }) {
  if (move === null) return null;
  const label = move === "new" ? "NEW" : move > 0 ? `↑${move}` : `↓${-move}`;
  const color = move === "new" || move > 0 ? "text-green-400" : "text-red-400";
  return (
    <span
      className={`absolute top-2 right-2 rounded-full bg-black/80 px-2 py-0.5 text-xs font-bold ${color}`}
    >
      {label}
    </span>
  );
}
