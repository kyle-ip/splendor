import { describe, expect, it } from 'vitest';
import {
  DUEL_LEVEL1,
  DUEL_LEVEL2,
  DUEL_LEVEL3,
  DUEL_ROYALS,
  canAffordDuelCard,
  emptyDuelBonuses,
  emptyDuelHand,
  remainingCost,
} from '@/data/duel-cards';

describe('duel-card-pool.json → duel decks', () => {
  it('builds expected pool sizes (30 / 24 / 13 / 4)', () => {
    expect(DUEL_LEVEL1).toHaveLength(30);
    expect(DUEL_LEVEL2).toHaveLength(24);
    expect(DUEL_LEVEL3).toHaveLength(13);
    expect(DUEL_ROYALS).toHaveLength(4);
  });

  it('maps associate and prestige-only cards', () => {
    expect(DUEL_LEVEL1.filter((c) => c.bonus === 'associate')).toHaveLength(4);
    expect(DUEL_LEVEL1.filter((c) => c.bonus === null)).toHaveLength(1);
    expect(DUEL_LEVEL2.filter((c) => c.bonus === 'associate')).toHaveLength(3);
    expect(DUEL_LEVEL2.filter((c) => c.bonus === null)).toHaveLength(1);
    expect(DUEL_LEVEL3.filter((c) => c.bonus === 'associate')).toHaveLength(2);
    expect(DUEL_LEVEL3.filter((c) => c.bonus === null)).toHaveLength(1);
  });

  it('includes pearl costs and crowns on some cards', () => {
    expect(DUEL_LEVEL1.some((c) => c.cost.pearl > 0)).toBe(true);
    expect(DUEL_LEVEL1.some((c) => c.crowns > 0)).toBe(true);
  });

  it('pays with bonuses and gold as wild', () => {
    const card = DUEL_LEVEL1.find((c) => c.cost.pearl >= 1)!;
    const hand = emptyDuelHand();
    hand.gold = 20;
    expect(canAffordDuelCard(card, hand, emptyDuelBonuses())).toBe(true);
    const need = remainingCost(card, emptyDuelBonuses());
    expect(need.pearl).toBe(card.cost.pearl);
  });
});
