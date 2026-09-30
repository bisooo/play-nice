import { useCallback, useEffect, useState } from 'react';
import { TimeRange } from '@prisma/client';

// "new" = entered the top 10 since the deck started; a number = places moved up (negative = down)
export type Move = 'new' | number | null;
type Card = { rank: number; revealed: boolean; move: Move };
type Deck = Record<string, Card>;

// One saved deck per visitor (in their browser), list and time range. A card is face-down until revealed at its
// current rank, so after a sync a new entry or a rank change turns it face-down again.
export function useReveals(kind: 'artists' | 'tracks', timeRange: TimeRange, ids?: string[]) {
  const storageKey = `onRepeatReveals:${kind}:${timeRange}`;
  const [deck, setDeck] = useState<Deck | null>(null);
  const idsKey = ids?.join(',');

  const save = useCallback(
    (next: Deck) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Storage full or blocked: reveals still show for this visit
      }
    },
    [storageKey]
  );

  // Loaded after mount (not as initial state) so saved reveals animate their flip
  useEffect(() => {
    setDeck(null);
    if (!idsKey) return;
    let stored: Deck | null = null;
    try {
      stored = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    } catch {}
    if (!stored) {
      // First visit to this deck: today's cards are the baseline, so none of them count as new
      stored = Object.fromEntries(
        idsKey.split(',').map((id, i) => [id, { rank: i + 1, revealed: false, move: null }])
      );
      save(stored);
    }
    setDeck(stored);
  }, [storageKey, idsKey, save]);

  const isRevealed = (id: string, rank: number) =>
    !!deck?.[id]?.revealed && deck[id].rank === rank;
  const moveOf = (id: string): Move => deck?.[id]?.move ?? null;

  const reveal = useCallback(
    (id: string, rank: number) => {
      setDeck((prev) => {
        if (!prev) return prev;
        const seen = prev[id];
        if (seen?.revealed && seen.rank === rank) return prev;
        const move: Move = seen ? seen.rank - rank || null : 'new';
        const next = { ...prev, [id]: { rank, revealed: true, move } };
        save(next);
        return next;
      });
    },
    [save]
  );

  return { isRevealed, moveOf, reveal };
}
