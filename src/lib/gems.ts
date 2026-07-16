import type { GemCounts } from '@/types';

/** Fallback English labels; prefer useGemLabels() in UI. */
export const GEM_LABELS: Record<keyof GemCounts, string> = {
  emerald: 'Green',
  sapphire: 'Blue',
  ruby: 'Red',
  diamond: 'White',
  onyx: 'Black',
  gold: 'Gold',
};

export const GEM_LABEL_KEYS = {
  emerald: 'gemEmerald',
  sapphire: 'gemSapphire',
  ruby: 'gemRuby',
  diamond: 'gemDiamond',
  onyx: 'gemOnyx',
  gold: 'gemGold',
} as const;

export const GEM_COLORS: Record<keyof GemCounts, string> = {
  emerald: 'bg-gem-emerald',
  sapphire: 'bg-gem-sapphire',
  ruby: 'bg-gem-ruby',
  diamond: 'bg-gem-diamond',
  onyx: 'bg-gem-onyx',
  gold: 'bg-gem-gold',
};

export const EMPTY_GEMS: GemCounts = {
  emerald: 0,
  sapphire: 0,
  ruby: 0,
  diamond: 0,
  onyx: 0,
  gold: 0,
};

export function canAffordCard(
  cost: Omit<GemCounts, 'gold'>,
  discounts: Omit<GemCounts, 'gold'>,
  hand: GemCounts,
): { canBuy: boolean; needed: GemCounts; shortfall: GemCounts } {
  const needed = { ...EMPTY_GEMS };
  const shortfall = { ...EMPTY_GEMS };

  const colors = ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'] as const;

  for (const color of colors) {
    const rawCost = cost[color];
    const discount = discounts[color];
    const payable = Math.max(0, rawCost - discount);
    needed[color] = payable;
    const have = hand[color];
    if (have < payable) {
      shortfall[color] = payable - have;
    }
  }

  const totalShortfall =
    shortfall.emerald +
    shortfall.sapphire +
    shortfall.ruby +
    shortfall.diamond +
    shortfall.onyx;

  const goldAvailable = hand.gold;
  const canCoverWithGold = totalShortfall <= goldAvailable;

  const canBuy = totalShortfall === 0 || canCoverWithGold;

  if (canCoverWithGold && totalShortfall > 0) {
    needed.gold = totalShortfall;
  }

  return { canBuy, needed, shortfall };
}

export function evaluateCard(
  card: {
    points: number;
    bonus: keyof Omit<GemCounts, 'gold'>;
    cost: Omit<GemCounts, 'gold'>;
  },
  weights: {
    points: number;
    bonus: number;
    costEfficiency: number;
    nobleFit: number;
  },
  nobleNeeds: Partial<Omit<GemCounts, 'gold'>> = {},
): number {
  const totalCost = Object.values(card.cost).reduce((a, b) => a + b, 0);
  const costScore = Math.max(0, 6 - totalCost) * weights.costEfficiency;
  const bonusScore = weights.bonus;
  const pointsScore = card.points * weights.points;
  const nobleScore = (nobleNeeds[card.bonus] ?? 0) * weights.nobleFit;

  return Math.round((pointsScore + bonusScore + costScore + nobleScore) * 10) / 10;
}
