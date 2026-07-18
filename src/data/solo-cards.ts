import type { GemCounts, NobleRequirement } from '@/types';
import cardPool from './card-pool.json';

export type SoloCard = {
  id: string;
  name: string;
  level: 1 | 2 | 3;
  points: number;
  bonus: keyof Omit<GemCounts, 'gold'>;
  cost: Omit<GemCounts, 'gold'>;
};

const COLORS = ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'] as const;

/** Pool JSON color keys → mineral keys used by the engine. */
const POOL_TO_GEM = {
  green: 'emerald',
  white: 'diamond',
  blue: 'sapphire',
  black: 'onyx',
  red: 'ruby',
} as const;

type PoolColor = keyof typeof POOL_TO_GEM;

const POOL_COLORS: PoolColor[] = [
  'green',
  'white',
  'blue',
  'black',
  'red',
];

const ID_LETTER: Record<PoolColor, string> = {
  green: 'e',
  white: 'd',
  blue: 's',
  black: 'o',
  red: 'r',
};

type PoolEntry = {
  green: number;
  white: number;
  blue: number;
  black: number;
  red: number;
  prestige: number;
};

type PoolByColor = Record<PoolColor, PoolEntry[]>;

function costFromPool(entry: PoolEntry): Omit<GemCounts, 'gold'> {
  return {
    emerald: entry.green,
    diamond: entry.white,
    sapphire: entry.blue,
    onyx: entry.black,
    ruby: entry.red,
  };
}

function buildLevel(
  level: 1 | 2 | 3,
  byColor: PoolByColor,
): SoloCard[] {
  const cards: SoloCard[] = [];
  for (const poolColor of POOL_COLORS) {
    const bonus = POOL_TO_GEM[poolColor];
    const letter = ID_LETTER[poolColor];
    byColor[poolColor].forEach((entry, i) => {
      const id = `l${level}-${letter}${i + 1}`;
      cards.push({
        id,
        name: id,
        level,
        points: entry.prestige,
        bonus,
        cost: costFromPool(entry),
      });
    });
  }
  return cards;
}

function buildNobles(entries: PoolEntry[]): NobleRequirement[] {
  return entries.map((entry, i) => ({
    id: i + 1,
    requirements: costFromPool(entry),
  }));
}

/** Full Level 1–3 pools from `card-pool.json`. */
export const LEVEL1_CARDS: SoloCard[] = buildLevel(
  1,
  cardPool.level1 as PoolByColor,
);
export const LEVEL2_CARDS: SoloCard[] = buildLevel(
  2,
  cardPool.level2 as PoolByColor,
);
export const LEVEL3_CARDS: SoloCard[] = buildLevel(
  3,
  cardPool.level3 as PoolByColor,
);

/** Full noble pool from `card-pool.json`. */
export const NOBLES: NobleRequirement[] = buildNobles(
  cardPool.nobles as PoolEntry[],
);

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
