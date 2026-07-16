import { describe, expect, it } from 'vitest';
import {
  fixedCapitalStart,
  rollPracticeDie,
  starCountForTier,
  type SoloPracticeTier,
} from './practiceTier';

function seqRng(values: number[]): () => number {
  let i = 0;
  return () => {
    const v = values[Math.min(i, values.length - 1)]!;
    i += 1;
    return v;
  };
}

describe('solo practice tiers', () => {
  it('maps Mode 1 starting capital by tier', () => {
    expect(fixedCapitalStart('easy')).toEqual({
      perColor: 4,
      gold: 4,
      resets: 4,
    });
    expect(fixedCapitalStart('normal')).toEqual({
      perColor: 3,
      gold: 3,
      resets: 3,
    });
    expect(fixedCapitalStart('hard')).toEqual({
      perColor: 2,
      gold: 2,
      resets: 2,
    });
  });

  it('maps ★ counts for Mode 3', () => {
    const expected: Record<SoloPracticeTier, number> = {
      easy: 1,
      normal: 2,
      hard: 4,
    };
    for (const tier of Object.keys(expected) as SoloPracticeTier[]) {
      expect(starCountForTier(tier)).toBe(expected[tier]);
    }
  });

  it('easy often softens 5–6 into 1–4', () => {
    // First draw → 6 (rng 5/6), then reroll gate < 0.5, then roll 1–4 → 2
    const dice = rollPracticeDie(
      'easy',
      [true, true, true, true],
      seqRng([5 / 6, 0.1, 1 / 4]),
    );
    expect(dice).toBe(2);
  });

  it('easy keeps 5–6 when reroll gate fails', () => {
    const dice = rollPracticeDie(
      'easy',
      [true, true, true, true],
      seqRng([5 / 6, 0.9]),
    );
    expect(dice).toBe(6);
  });

  it('hard rerolls once when 1–4 hits an empty L1 slot', () => {
    // First → 2 (empty slot), then → 5
    const dice = rollPracticeDie(
      'hard',
      [true, false, true, true],
      seqRng([1 / 6, 4 / 6]),
    );
    expect(dice).toBe(5);
  });

  it('normal is a fair single roll', () => {
    const dice = rollPracticeDie(
      'normal',
      [false, false, false, false],
      seqRng([3 / 6]),
    );
    expect(dice).toBe(4);
  });
});
