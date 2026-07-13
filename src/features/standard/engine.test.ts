import { describe, expect, it } from 'vitest';
import {
  applyAction,
  createGame,
  resolveWinners,
  tokenCount,
} from '@/features/standard/engine';
import type { GameState } from '@/features/standard/types';

describe('standard engine', () => {
  it('applies a legal 3-different take', () => {
    const g = createGame({ playerCount: 2, humanSeat: 0, difficulty: 'normal' });
    const next = applyAction(g, {
      type: 'take',
      colors: ['emerald', 'sapphire', 'ruby'],
    });
    expect(next).not.toBeNull();
    expect(tokenCount(next!.seats[0].hand)).toBe(3);
  });

  it('enters discard when hand exceeds 10', () => {
    let g = createGame({ playerCount: 2, humanSeat: 0, difficulty: 'normal' });
    g = {
      ...g,
      seats: g.seats.map((s, i) =>
        i === 0
          ? {
              ...s,
              hand: {
                emerald: 2,
                sapphire: 2,
                ruby: 2,
                diamond: 2,
                onyx: 2,
                gold: 0,
              },
            }
          : s,
      ),
    };
    const next = applyAction(g, {
      type: 'take',
      colors: ['emerald', 'sapphire', 'ruby'],
    });
    expect(next).not.toBeNull();
    expect(next!.phase).toBe('discardGems');
    expect(next!.discardNeeded).toBe(3);
  });

  it('tiebreak prefers fewer development cards', () => {
    let g = createGame({ playerCount: 2, humanSeat: 0, difficulty: 'normal' });
    g = {
      ...g,
      seats: g.seats.map((s) =>
        s.id === 0
          ? { ...s, prestige: 16, cardCount: 8 }
          : { ...s, prestige: 16, cardCount: 5 },
      ),
    } satisfies GameState;
    expect(resolveWinners(g)).toEqual([1]);
  });
});
