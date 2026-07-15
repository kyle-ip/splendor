import { describe, expect, it } from 'vitest';
import {
  canAddTakeGem,
  eligibleNobles,
  getTakeRejectionReason,
  isTakeComplete,
  tokenCount,
} from '@/features/solo/engine';
import type { GemCounts } from '@/types';

const bank: GemCounts = {
  emerald: 4,
  sapphire: 4,
  ruby: 4,
  diamond: 4,
  onyx: 4,
  gold: 5,
};

describe('solo engine', () => {
  it('allows 3-different take picks', () => {
    expect(canAddTakeGem([], 'emerald', bank)).toBe(true);
    expect(canAddTakeGem(['emerald'], 'sapphire', bank)).toBe(true);
    expect(isTakeComplete(['emerald', 'sapphire', 'ruby'])).toBe(true);
  });

  it('rejects pair take when bank too low', () => {
    const thin = { ...bank, emerald: 3 };
    expect(getTakeRejectionReason(['emerald'], 'emerald', thin)).toBe(
      'soloTakeRejectPair',
    );
  });

  it('detects noble eligibility from bonuses only', () => {
    const bonuses = {
      emerald: 3,
      sapphire: 3,
      ruby: 3,
      diamond: 0,
      onyx: 0,
    };
    const nobles = [
      {
        id: 7,
        requirements: {
          emerald: 3,
          sapphire: 3,
          ruby: 3,
          diamond: 0,
          onyx: 0,
        },
      },
    ];
    expect(eligibleNobles(bonuses, nobles)).toHaveLength(1);
  });

  it('counts tokens including gold', () => {
    expect(
      tokenCount({
        emerald: 2,
        sapphire: 0,
        ruby: 0,
        diamond: 0,
        onyx: 0,
        gold: 1,
      }),
    ).toBe(3);
  });
});
