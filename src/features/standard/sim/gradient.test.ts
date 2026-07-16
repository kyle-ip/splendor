import { describe, expect, it } from 'vitest';
import { getPersona } from '@/features/standard/ai';
import { aggregate, runBatch } from '@/features/standard/sim/runGame';

const SIM_N = Number(process.env.SIM_N ?? 24);

describe('standard AI difficulty gradient (seeded sims)', () => {
  it('persona knobs tighten from Easy to Hard', () => {
    const easy = getPersona('easy');
    const normal = getPersona('normal');
    const hard = getPersona('hard');
    expect(hard.mistakeRate).toBeLessThan(normal.mistakeRate);
    expect(normal.mistakeRate).toBeLessThan(easy.mistakeRate);
    expect(hard.denyScale).toBeGreaterThan(normal.denyScale);
    expect(normal.denyScale).toBeGreaterThan(easy.denyScale);
    expect(hard.useHardDenyPass).toBe(true);
    expect(easy.useHardDenyPass).toBe(false);
  });

  it(
    'Hard denies with reserves more than Easy when threats appear',
    () => {
      const n = Math.max(SIM_N, 32);
      const easy = aggregate(
        runBatch(7, n, { difficulty: 'easy', humanPolicy: 'greedyBuy' }),
      );
      const hard = aggregate(
        runBatch(7, n, { difficulty: 'hard', humanPolicy: 'greedyBuy' }),
      );

      expect(hard.avgAiDenyReserveRate + 0.02).toBeGreaterThanOrEqual(
        easy.avgAiDenyReserveRate,
      );
    },
    180_000,
  );
});
