import { describe, expect, it } from 'vitest';
import { canAffordCard, evaluateCard } from '@/lib/gems';

const empty = {
  emerald: 0,
  sapphire: 0,
  ruby: 0,
  diamond: 0,
  onyx: 0,
};

describe('canAffordCard', () => {
  it('pays exact tokens after bonuses', () => {
    const result = canAffordCard(
      { ...empty, ruby: 2, onyx: 2 },
      { ...empty, ruby: 1 },
      { ...empty, ruby: 1, onyx: 2, gold: 0, sapphire: 0, emerald: 0, diamond: 0 },
    );
    expect(result.canBuy).toBe(true);
    expect(result.needed.ruby).toBe(1);
    expect(result.needed.onyx).toBe(2);
    expect(result.needed.gold).toBe(0);
  });

  it('uses gold to cover a color shortfall', () => {
    const result = canAffordCard(
      { ...empty, ruby: 2, onyx: 2 },
      { ...empty, ruby: 1 },
      { ...empty, ruby: 0, onyx: 2, gold: 1, sapphire: 0, emerald: 0, diamond: 0 },
    );
    expect(result.canBuy).toBe(true);
    expect(result.shortfall.ruby).toBe(1);
    expect(result.needed.gold).toBe(1);
  });

  it('cannot buy when shortfall exceeds gold', () => {
    const result = canAffordCard(
      { ...empty, sapphire: 3 },
      empty,
      { ...empty, sapphire: 1, gold: 1, ruby: 0, emerald: 0, diamond: 0, onyx: 0 },
    );
    expect(result.canBuy).toBe(false);
    expect(result.shortfall.sapphire).toBe(2);
  });

  it('buys with bonuses alone and no tokens', () => {
    const result = canAffordCard(
      { ...empty, sapphire: 2 },
      { ...empty, sapphire: 2 },
      { ...empty, gold: 0, sapphire: 0, ruby: 0, emerald: 0, diamond: 0, onyx: 0 },
    );
    expect(result.canBuy).toBe(true);
    expect(result.needed.sapphire).toBe(0);
  });
});

describe('evaluateCard', () => {
  it('scores higher when the bonus fills a noble gap', () => {
    const card = {
      points: 0,
      bonus: 'sapphire' as const,
      cost: { ...empty, ruby: 2 },
    };
    const weights = { points: 1, bonus: 1.5, costEfficiency: 1, nobleFit: 2 };
    const without = evaluateCard(card, weights, {});
    const withNoble = evaluateCard(card, weights, { sapphire: 1 });
    expect(withNoble).toBeGreaterThan(without);
  });
});
