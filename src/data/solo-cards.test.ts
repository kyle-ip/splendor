import { describe, expect, it } from 'vitest';
import {
  LEVEL1_CARDS,
  LEVEL2_CARDS,
  LEVEL3_CARDS,
  NOBLES,
} from '@/data/solo-cards';

describe('card-pool.json → practice decks', () => {
  it('builds expected pool sizes', () => {
    expect(LEVEL1_CARDS).toHaveLength(40);
    expect(LEVEL2_CARDS).toHaveLength(30);
    expect(LEVEL3_CARDS).toHaveLength(20);
    expect(NOBLES).toHaveLength(10);
  });

  it('maps pool colors to mineral bonuses', () => {
    expect(LEVEL1_CARDS.filter((c) => c.bonus === 'emerald')).toHaveLength(8);
    expect(LEVEL1_CARDS.filter((c) => c.bonus === 'diamond')).toHaveLength(8);
    expect(LEVEL1_CARDS.filter((c) => c.bonus === 'sapphire')).toHaveLength(8);
    expect(LEVEL1_CARDS.filter((c) => c.bonus === 'onyx')).toHaveLength(8);
    expect(LEVEL1_CARDS.filter((c) => c.bonus === 'ruby')).toHaveLength(8);
  });

  it('keeps level-1 prestige distribution (5 × 1 VP)', () => {
    expect(LEVEL1_CARDS.filter((c) => c.points === 1)).toHaveLength(5);
    expect(LEVEL1_CARDS.filter((c) => c.points === 0)).toHaveLength(35);
  });

  it('keeps noble requirements for first tile', () => {
    expect(NOBLES[0]).toEqual({
      id: 1,
      requirements: {
        emerald: 4,
        diamond: 0,
        sapphire: 0,
        onyx: 0,
        ruby: 4,
      },
    });
  });
});
