import { describe, expect, it } from 'vitest';
import { createGame, listLegalActions } from '@/features/standard/engine';
import { chooseAiAction } from '@/features/standard/ai';

describe('standard AI', () => {
  it('prefers buying when a development card is affordable', () => {
    let g = createGame({
      playerCount: 2,
      humanSeat: 0,
      difficulty: 'normal',
    });
    g = {
      ...g,
      currentSeat: 1,
      phase: 'aiBusy',
      seats: g.seats.map((s) =>
        s.id === 1
          ? {
              ...s,
              hand: {
                emerald: 4,
                sapphire: 4,
                ruby: 4,
                diamond: 4,
                onyx: 4,
                gold: 2,
              },
            }
          : s,
      ),
    };

    const legal = listLegalActions(g);
    expect(legal.some((a) => a.type === 'buy')).toBe(true);

    const action = chooseAiAction(g, () => 0.5);
    expect(action?.type).toBe('buy');
  });

  it('takes gems when nothing is affordable yet', () => {
    let g = createGame({
      playerCount: 2,
      humanSeat: 0,
      difficulty: 'normal',
    });
    g = {
      ...g,
      currentSeat: 1,
      phase: 'aiBusy',
      seats: g.seats.map((s) =>
        s.id === 1
          ? {
              ...s,
              hand: {
                emerald: 0,
                sapphire: 0,
                ruby: 0,
                diamond: 0,
                onyx: 0,
                gold: 0,
              },
            }
          : s,
      ),
    };

    const action = chooseAiAction(g, () => 0.5);
    expect(action).not.toBeNull();
    expect(['take', 'reserve']).toContain(action!.type);
  });
});
