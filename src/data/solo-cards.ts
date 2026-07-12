import type { CardExample, GemCounts } from '@/types';

export type SoloCard = CardExample & { level: 1 | 2 | 3 };

const COLORS = ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'] as const;
type Color = (typeof COLORS)[number];

function card(
  id: string,
  level: 1 | 2 | 3,
  points: number,
  bonus: Color,
  cost: Partial<Record<Color, number>>,
): SoloCard {
  return {
    id,
    name: id,
    level,
    points,
    bonus,
    cost: {
      emerald: cost.emerald ?? 0,
      sapphire: cost.sapphire ?? 0,
      ruby: cost.ruby ?? 0,
      diamond: cost.diamond ?? 0,
      onyx: cost.onyx ?? 0,
    },
  };
}

/** Representative Level 1 pool (playable practice deck). */
export const LEVEL1_CARDS: SoloCard[] = [
  card('l1-e1', 1, 0, 'emerald', { ruby: 2, diamond: 1 }),
  card('l1-e2', 1, 0, 'emerald', { sapphire: 1, onyx: 2 }),
  card('l1-e3', 1, 0, 'emerald', { diamond: 3 }),
  card('l1-e4', 1, 0, 'emerald', { ruby: 1, diamond: 1, onyx: 1 }),
  card('l1-e5', 1, 0, 'emerald', { sapphire: 2, ruby: 2 }),
  card('l1-e6', 1, 0, 'emerald', { onyx: 4 }),
  card('l1-e7', 1, 1, 'emerald', { sapphire: 2, diamond: 2, onyx: 1 }),
  card('l1-e8', 1, 0, 'emerald', { sapphire: 1, ruby: 1, diamond: 1, onyx: 1 }),
  card('l1-s1', 1, 0, 'sapphire', { emerald: 1, onyx: 2 }),
  card('l1-s2', 1, 0, 'sapphire', { ruby: 1, diamond: 2 }),
  card('l1-s3', 1, 0, 'sapphire', { emerald: 3 }),
  card('l1-s4', 1, 0, 'sapphire', { emerald: 1, ruby: 1, diamond: 1 }),
  card('l1-s5', 1, 0, 'sapphire', { emerald: 2, onyx: 2 }),
  card('l1-s6', 1, 0, 'sapphire', { diamond: 4 }),
  card('l1-s7', 1, 1, 'sapphire', { emerald: 2, ruby: 1, onyx: 2 }),
  card('l1-s8', 1, 0, 'sapphire', { emerald: 1, ruby: 1, diamond: 1, onyx: 1 }),
  card('l1-r1', 1, 0, 'ruby', { emerald: 2, sapphire: 1 }),
  card('l1-r2', 1, 0, 'ruby', { diamond: 1, onyx: 2 }),
  card('l1-r3', 1, 0, 'ruby', { onyx: 3 }),
  card('l1-r4', 1, 0, 'ruby', { emerald: 1, sapphire: 1, diamond: 1 }),
  card('l1-r5', 1, 0, 'ruby', { sapphire: 2, diamond: 2 }),
  card('l1-r6', 1, 0, 'ruby', { emerald: 4 }),
  card('l1-r7', 1, 1, 'ruby', { emerald: 1, sapphire: 2, diamond: 2 }),
  card('l1-r8', 1, 0, 'ruby', { emerald: 1, sapphire: 1, diamond: 1, onyx: 1 }),
  card('l1-d1', 1, 0, 'diamond', { sapphire: 2, ruby: 1 }),
  card('l1-d2', 1, 0, 'diamond', { emerald: 2, onyx: 1 }),
  card('l1-d3', 1, 0, 'diamond', { ruby: 3 }),
  card('l1-d4', 1, 0, 'diamond', { emerald: 1, sapphire: 1, onyx: 1 }),
  card('l1-d5', 1, 0, 'diamond', { emerald: 2, ruby: 2 }),
  card('l1-d6', 1, 0, 'diamond', { sapphire: 4 }),
  card('l1-d7', 1, 1, 'diamond', { emerald: 2, sapphire: 1, ruby: 2 }),
  card('l1-d8', 1, 0, 'diamond', { emerald: 1, sapphire: 1, ruby: 1, onyx: 1 }),
  card('l1-o1', 1, 0, 'onyx', { emerald: 1, diamond: 2 }),
  card('l1-o2', 1, 0, 'onyx', { sapphire: 1, ruby: 2 }),
  card('l1-o3', 1, 0, 'onyx', { sapphire: 3 }),
  card('l1-o4', 1, 0, 'onyx', { emerald: 1, sapphire: 1, ruby: 1 }),
  card('l1-o5', 1, 0, 'onyx', { sapphire: 2, diamond: 2 }),
  card('l1-o6', 1, 0, 'onyx', { ruby: 4 }),
  card('l1-o7', 1, 1, 'onyx', { emerald: 2, ruby: 2, diamond: 1 }),
  card('l1-o8', 1, 0, 'onyx', { emerald: 1, sapphire: 1, ruby: 1, diamond: 1 }),
];

export const LEVEL2_CARDS: SoloCard[] = [
  card('l2-e1', 2, 1, 'emerald', { emerald: 2, sapphire: 2, onyx: 3 }),
  card('l2-e2', 2, 2, 'emerald', { sapphire: 3, diamond: 3 }),
  card('l2-e3', 2, 2, 'emerald', { ruby: 5 }),
  card('l2-e4', 2, 3, 'emerald', { emerald: 6 }),
  card('l2-s1', 2, 1, 'sapphire', { emerald: 3, sapphire: 2, diamond: 2 }),
  card('l2-s2', 2, 2, 'sapphire', { emerald: 3, onyx: 3 }),
  card('l2-s3', 2, 2, 'sapphire', { diamond: 5 }),
  card('l2-s4', 2, 3, 'sapphire', { sapphire: 6 }),
  card('l2-r1', 2, 1, 'ruby', { sapphire: 2, ruby: 2, diamond: 3 }),
  card('l2-r2', 2, 2, 'ruby', { emerald: 3, ruby: 3 }),
  card('l2-r3', 2, 2, 'ruby', { onyx: 5 }),
  card('l2-r4', 2, 3, 'ruby', { ruby: 6 }),
  card('l2-d1', 2, 1, 'diamond', { emerald: 2, diamond: 2, onyx: 3 }),
  card('l2-d2', 2, 2, 'diamond', { sapphire: 3, diamond: 3 }),
  card('l2-d3', 2, 2, 'diamond', { emerald: 5 }),
  card('l2-d4', 2, 3, 'diamond', { diamond: 6 }),
  card('l2-o1', 2, 1, 'onyx', { ruby: 2, diamond: 2, onyx: 3 }),
  card('l2-o2', 2, 2, 'onyx', { ruby: 3, onyx: 3 }),
  card('l2-o3', 2, 2, 'onyx', { sapphire: 5 }),
  card('l2-o4', 2, 3, 'onyx', { onyx: 6 }),
];

export const LEVEL3_CARDS: SoloCard[] = [
  card('l3-e1', 3, 3, 'emerald', { sapphire: 3, ruby: 3, diamond: 3, onyx: 5 }),
  card('l3-e2', 3, 4, 'emerald', { emerald: 3, sapphire: 3, diamond: 3, onyx: 6 }),
  card('l3-e3', 3, 5, 'emerald', { emerald: 3, onyx: 7 }),
  card('l3-s1', 3, 3, 'sapphire', { emerald: 3, ruby: 3, diamond: 5, onyx: 3 }),
  card('l3-s2', 3, 4, 'sapphire', { emerald: 6, sapphire: 3, ruby: 3, diamond: 3 }),
  card('l3-s3', 3, 5, 'sapphire', { sapphire: 3, diamond: 7 }),
  card('l3-r1', 3, 3, 'ruby', { emerald: 5, sapphire: 3, diamond: 3, onyx: 3 }),
  card('l3-r2', 3, 4, 'ruby', { emerald: 3, sapphire: 6, ruby: 3, onyx: 3 }),
  card('l3-r3', 3, 5, 'ruby', { emerald: 7, ruby: 3 }),
  card('l3-d1', 3, 3, 'diamond', { emerald: 3, sapphire: 5, ruby: 3, onyx: 3 }),
  card('l3-d2', 3, 4, 'diamond', { sapphire: 3, ruby: 6, diamond: 3, onyx: 3 }),
  card('l3-d3', 3, 5, 'diamond', { ruby: 7, diamond: 3 }),
  card('l3-o1', 3, 3, 'onyx', { emerald: 3, sapphire: 3, ruby: 5, diamond: 3 }),
  card('l3-o2', 3, 4, 'onyx', { emerald: 3, ruby: 3, diamond: 6, onyx: 3 }),
  card('l3-o3', 3, 5, 'onyx', { sapphire: 7, onyx: 3 }),
];

export function shuffle<T>(items: T[], rng = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function payForCard(
  hand: GemCounts,
  cost: Omit<GemCounts, 'gold'>,
  bonuses: Omit<GemCounts, 'gold'>,
): GemCounts | null {
  const next = { ...hand };
  let goldNeeded = 0;
  for (const c of COLORS) {
    const need = Math.max(0, cost[c] - bonuses[c]);
    const use = Math.min(next[c], need);
    next[c] -= use;
    goldNeeded += need - use;
  }
  if (next.gold < goldNeeded) return null;
  next.gold -= goldNeeded;
  return next;
}

export function sumBonuses(bonuses: Omit<GemCounts, 'gold'>): number {
  return COLORS.reduce((n, c) => n + bonuses[c], 0);
}

export function emptyBonuses(): Omit<GemCounts, 'gold'> {
  return { emerald: 0, sapphire: 0, ruby: 0, diamond: 0, onyx: 0 };
}

export function drawDisplay(
  deck: SoloCard[],
  count: number,
): { display: SoloCard[]; deck: SoloCard[] } {
  const display = deck.slice(0, count);
  return { display, deck: deck.slice(count) };
}
