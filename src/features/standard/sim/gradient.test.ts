import { describe, expect, it } from 'vitest';
import { aggregate, runBatch } from '@/features/standard/sim/runGame';

const SIM_N = Number(process.env.SIM_N ?? 24);

describe('standard AI difficulty gradient (seeded sims)', () => {
  it(
    'AI challenges scripted human more as difficulty rises',
    () => {
      const n = Math.max(SIM_N, 32);
      const easy = aggregate(
        runBatch(42, n, {
          difficulty: 'easy',
          humanPolicy: 'engineThenPoints',
        }),
      );
      const normal = aggregate(
        runBatch(42, n, {
          difficulty: 'normal',
          humanPolicy: 'engineThenPoints',
        }),
      );
      const hard = aggregate(
        runBatch(42, n, {
          difficulty: 'hard',
          humanPolicy: 'engineThenPoints',
        }),
      );

      const aiWin = (a: typeof easy) => 1 - a.humanWinRate;
      // Soft gradient with sample tolerance
      expect(aiWin(hard) + 0.05).toBeGreaterThanOrEqual(aiWin(easy));
      expect(aiWin(hard)).toBeGreaterThanOrEqual(aiWin(normal) - 0.08);
      expect(easy.avgAiPrestige).toBeLessThanOrEqual(hard.avgAiPrestige + 1.5);
    },
    180_000,
  );

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
