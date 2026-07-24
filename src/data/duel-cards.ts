import type { GemCounts } from '@/types';
import cardPool from './duel-card-pool.json';
import { shuffle } from './solo-cards';

export type DuelGem = keyof Omit<GemCounts, 'gold'>;
export type DuelToken = DuelGem | 'gold' | 'pearl';

export type DuelAbility =
  | 'extraTurn'
  | 'takeMatching'
  | 'privilege'
  | 'steal'
  | null;

export type DuelBonus = DuelGem | 'associate' | null;

export type DuelJewelCard = {
  id: string;
  name: string;
  level: 1 | 2 | 3;
  bonus: DuelBonus;
  bonusCount: number;
  prestige: number;
  crowns: number;
  ability: DuelAbility;
  cost: Record<DuelGem | 'pearl', number>;
};

export type DuelRoyalCard = {
  id: string;
  prestige: number;
  ability: DuelAbility;
};

/** Purchased jewel with resolved associate color (when bonus was associate). */
export type OwnedDuelCard = DuelJewelCard & {
  /** Effective bonus color after associate placement; null if prestige-only. */
  effectiveBonus: DuelGem | null;
};

const POOL_TO_GEM = {
  green: 'emerald',
  white: 'diamond',
  blue: 'sapphire',
  black: 'onyx',
  red: 'ruby',
} as const;

type PoolColor = keyof typeof POOL_TO_GEM;

type PoolJewel = {
  id: string;
  level: 1 | 2 | 3;
  bonus: PoolColor | 'associate' | null;
  bonusCount: number;
  prestige: number;
  crowns: number;
  ability: DuelAbility;
  cost: {
    green: number;
    white: number;
    blue: number;
    black: number;
    red: number;
    pearl: number;
  };
};

type PoolRoyal = {
  id: string;
  prestige: number;
  ability: DuelAbility;
};

function mapBonus(bonus: PoolJewel['bonus']): DuelBonus {
  if (bonus === null || bonus === 'associate') return bonus;
  return POOL_TO_GEM[bonus];
}

function mapCost(cost: PoolJewel['cost']): DuelJewelCard['cost'] {
  return {
    emerald: cost.green,
    diamond: cost.white,
    sapphire: cost.blue,
    onyx: cost.black,
    ruby: cost.red,
    pearl: cost.pearl,
  };
}

function mapJewel(entry: PoolJewel): DuelJewelCard {
  return {
    id: entry.id,
    name: entry.id,
    level: entry.level,
    bonus: mapBonus(entry.bonus),
    bonusCount: entry.bonusCount,
    prestige: entry.prestige,
    crowns: entry.crowns,
    ability: entry.ability,
    cost: mapCost(entry.cost),
  };
}

function buildLevel(entries: PoolJewel[]): DuelJewelCard[] {
  return entries.map(mapJewel);
}

export const DUEL_LEVEL1: DuelJewelCard[] = buildLevel(
  cardPool.level1 as PoolJewel[],
);
export const DUEL_LEVEL2: DuelJewelCard[] = buildLevel(
  cardPool.level2 as PoolJewel[],
);
export const DUEL_LEVEL3: DuelJewelCard[] = buildLevel(
  cardPool.level3 as PoolJewel[],
);
export const DUEL_ROYALS: DuelRoyalCard[] = (
  cardPool.royals as PoolRoyal[]
).map((r) => ({
  id: r.id,
  prestige: r.prestige,
  ability: r.ability,
}));

export { shuffle };

export function emptyDuelHand(): Record<DuelToken, number> {
  return {
    emerald: 0,
    sapphire: 0,
    ruby: 0,
    diamond: 0,
    onyx: 0,
    gold: 0,
    pearl: 0,
  };
}

export function emptyDuelBonuses(): Record<DuelGem, number> {
  return {
    emerald: 0,
    sapphire: 0,
    ruby: 0,
    diamond: 0,
    onyx: 0,
  };
}

export function tokenTotal(hand: Record<DuelToken, number>): number {
  return (
    hand.emerald +
    hand.sapphire +
    hand.ruby +
    hand.diamond +
    hand.onyx +
    hand.gold +
    hand.pearl
  );
}

/** Remaining cost after bonuses (pearl never discounted). */
export function remainingCost(
  card: DuelJewelCard,
  bonuses: Record<DuelGem, number>,
): Record<DuelGem | 'pearl', number> {
  const gems: DuelGem[] = [
    'emerald',
    'sapphire',
    'ruby',
    'diamond',
    'onyx',
  ];
  const out: Record<DuelGem | 'pearl', number> = {
    emerald: 0,
    sapphire: 0,
    ruby: 0,
    diamond: 0,
    onyx: 0,
    pearl: card.cost.pearl,
  };
  for (const g of gems) {
    out[g] = Math.max(0, card.cost[g] - (bonuses[g] ?? 0));
  }
  return out;
}

export function canAffordDuelCard(
  card: DuelJewelCard,
  hand: Record<DuelToken, number>,
  bonuses: Record<DuelGem, number>,
): boolean {
  const need = remainingCost(card, bonuses);
  let gold = hand.gold;
  const keys: (DuelGem | 'pearl')[] = [
    'emerald',
    'sapphire',
    'ruby',
    'diamond',
    'onyx',
    'pearl',
  ];
  for (const k of keys) {
    const have = hand[k] ?? 0;
    if (have < need[k]) {
      gold -= need[k] - have;
      if (gold < 0) return false;
    }
  }
  return true;
}

/** Pay for a card; returns updated hand and list of spent tokens for the bag. */
export function payForDuelCard(
  card: DuelJewelCard,
  hand: Record<DuelToken, number>,
  bonuses: Record<DuelGem, number>,
): { hand: Record<DuelToken, number>; spent: DuelToken[] } {
  const need = remainingCost(card, bonuses);
  const next = { ...hand };
  const spent: DuelToken[] = [];
  const keys: (DuelGem | 'pearl')[] = [
    'emerald',
    'sapphire',
    'ruby',
    'diamond',
    'onyx',
    'pearl',
  ];
  for (const k of keys) {
    const fromColor = Math.min(next[k], need[k]);
    next[k] -= fromColor;
    for (let i = 0; i < fromColor; i++) spent.push(k);
    const rest = need[k] - fromColor;
    if (rest > 0) {
      next.gold -= rest;
      for (let i = 0; i < rest; i++) spent.push('gold');
    }
  }
  return { hand: next, spent };
}

export function drawDisplay<T>(
  deck: T[],
  count: number,
): { display: T[]; rest: T[] } {
  return { display: deck.slice(0, count), rest: deck.slice(count) };
}
