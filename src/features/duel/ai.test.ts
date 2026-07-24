import { describe, expect, it } from 'vitest';
import {
  chooseDuelAiAction,
  getDuelPersona,
  scoreAction,
} from './ai';
import { createDuelGame, listLegalActions } from './engine';
import type { DuelGameState } from './types';
import {
  emptyDuelBonuses,
  emptyDuelHand,
  type DuelJewelCard,
} from '@/data/duel-cards';

function seededRng(seed = 1): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe('duel AI difficulty personas', () => {
  it('orders mistakeRate Easy > Normal > Hard(=0) and denyScale ascending', () => {
    const easy = getDuelPersona('easy');
    const normal = getDuelPersona('normal');
    const hard = getDuelPersona('hard');
    expect(easy.mistakeRate).toBeGreaterThan(normal.mistakeRate);
    expect(normal.mistakeRate).toBeGreaterThan(hard.mistakeRate);
    expect(hard.mistakeRate).toBe(0);
    expect(easy.denyScale).toBeLessThan(normal.denyScale);
    expect(normal.denyScale).toBeLessThan(hard.denyScale);
    expect(easy.privilegeTaxPenalty).toBeLessThan(hard.privilegeTaxPenalty);
    expect(easy.eagerBuyBias).toBeGreaterThan(hard.eagerBuyBias);
  });

  it('prefers an immediate-win buy on all difficulties', () => {
    for (const difficulty of ['easy', 'normal', 'hard'] as const) {
      const state = createDuelGame({
        mode: 'ai',
        humanSeat: 0,
        difficulty,
        rng: seededRng(11),
      });
      // Force AI seat to act with a winning buy available
      state.currentSeat = 1;
      state.phase = 'optional';
      const ai = state.seats[1];
      ai.prestige = 18;
      ai.hand = { ...emptyDuelHand(), gold: 10 };
      ai.bonuses = emptyDuelBonuses();

      const winCard: DuelJewelCard = {
        id: 'win-card',
        name: 'win-card',
        level: 1,
        bonus: 'ruby',
        bonusCount: 1,
        prestige: 2,
        crowns: 0,
        ability: null,
        cost: {
          emerald: 0,
          sapphire: 0,
          ruby: 0,
          diamond: 0,
          onyx: 0,
          pearl: 0,
        },
      };
      state.l1 = [winCard, ...state.l1.slice(1)];

      const action = chooseDuelAiAction(state, () => 0);
      expect(action).toEqual({
        type: 'buy',
        cardId: 'win-card',
        from: 'pyramid',
        level: 1,
      });
    }
  });

  it('Hard scores deny-reserve higher than Easy when opponent threatens crowns', () => {
    const base = createDuelGame({
      mode: 'ai',
      humanSeat: 0,
      difficulty: 'normal',
      rng: seededRng(5),
    });
    base.currentSeat = 1;
    base.phase = 'optional';
    base.seats[0].crowns = 8;
    base.seats[0].prestige = 10;
    // Ensure gold on board for reserve
    const goldIdx = base.board.findIndex((t) => t === 'gold');
    expect(goldIdx).toBeGreaterThanOrEqual(0);
    const threatCard = base.l2.find((c) => c && c.crowns + c.prestige >= 3);
    expect(threatCard).toBeTruthy();

    const reserveAction = {
      type: 'reserve' as const,
      goldIndex: goldIdx,
      source: {
        kind: 'pyramid' as const,
        cardId: threatCard!.id,
        level: 2 as const,
      },
    };
    const buyJunk = listLegalActions(base).find((a) => a.type === 'buy');

    const easy = getDuelPersona('easy');
    const hard = getDuelPersona('hard');
    const rng = () => 0.5;
    const easyReserve = scoreAction(base, reserveAction, easy, rng);
    const hardReserve = scoreAction(base, reserveAction, hard, rng);
    expect(hardReserve).toBeGreaterThan(easyReserve);

    if (buyJunk && buyJunk.type === 'buy') {
      const easyBuy = scoreAction(base, buyJunk, easy, rng);
      const hardBuy = scoreAction(base, buyJunk, hard, rng);
      // Easy's eager bias should make buys relatively more attractive vs Hard
      const easyGap = easyBuy - easyReserve;
      const hardGap = hardBuy - hardReserve;
      expect(easyGap).toBeGreaterThan(hardGap);
    }
  });

  it('stores difficulty on created game state', () => {
    const g: DuelGameState = createDuelGame({
      mode: 'ai',
      humanSeat: 0,
      difficulty: 'hard',
      rng: seededRng(1),
    });
    expect(g.difficulty).toBe('hard');
  });
});
