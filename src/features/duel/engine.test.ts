import { describe, expect, it } from 'vitest';
import {
  SPIRAL_ORDER,
  applyAction,
  checkVictory,
  createDuelGame,
  isLegalTakeLine,
  listLegalActions,
  takeGivesPrivilegeTax,
} from './engine';
import { emptyDuelBonuses, emptyDuelHand } from '@/data/duel-cards';
import type { DuelGameState, DuelSeat } from './types';

function seededRng(seed = 1): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe('duel engine basics', () => {
  it('has a 25-cell spiral covering every index once', () => {
    expect(SPIRAL_ORDER).toHaveLength(25);
    expect(new Set(SPIRAL_ORDER).size).toBe(25);
    expect(SPIRAL_ORDER[0]).toBe(12);
  });

  it('creates a hotseat game with pyramid sizes 5/4/3 and second-player privilege', () => {
    const g = createDuelGame({ mode: 'hotseat', rng: seededRng(42) });
    expect(g.l1).toHaveLength(5);
    expect(g.l2).toHaveLength(4);
    expect(g.l3).toHaveLength(3);
    expect(g.seats[1].privileges).toBe(1);
    expect(g.privilegesSupply).toBe(2);
    expect(g.board.filter(Boolean)).toHaveLength(25);
  });

  it('creates vs-AI with one human seat', () => {
    const g = createDuelGame({
      mode: 'ai',
      humanSeat: 0,
      rng: seededRng(7),
    });
    expect(g.seats[0].isHuman).toBe(true);
    expect(g.seats[1].isHuman).toBe(false);
  });

  it('validates take lines and privilege tax', () => {
    const board = Array(25).fill(null) as (import('@/data/duel-cards').DuelToken | null)[];
    board[0] = 'ruby';
    board[1] = 'ruby';
    board[2] = 'ruby';
    expect(isLegalTakeLine(board, [0, 1, 2])).toBe(true);
    expect(takeGivesPrivilegeTax(board, [0, 1, 2])).toBe(true);
    board[1] = 'gold';
    expect(isLegalTakeLine(board, [0, 1, 2])).toBe(false);
  });

  it('lists legal take/buy/reserve and applies a simple take', () => {
    const g = createDuelGame({ mode: 'hotseat', rng: seededRng(3) });
    const legal = listLegalActions(g);
    expect(legal.some((a) => a.type === 'takeTokens')).toBe(true);
    const take = legal.find((a) => a.type === 'takeTokens')!;
    if (take.type !== 'takeTokens') throw new Error('expected take');
    const next = applyAction(g, take);
    expect(next.currentSeat === 1 || next.phase === 'discardTokens').toBe(true);
  });

  it('detects three victory conditions', () => {
    const base: DuelSeat = {
      id: 0,
      isHuman: true,
      nameKey: 'you',
      hand: emptyDuelHand(),
      bonuses: emptyDuelBonuses(),
      prestige: 0,
      crowns: 0,
      privileges: 0,
      reserved: [],
      purchased: [],
      royals: [],
    };
    expect(checkVictory({ ...base, prestige: 20 })).toBe('prestige');
    expect(checkVictory({ ...base, crowns: 10 })).toBe('crowns');
    expect(
      checkVictory({
        ...base,
        purchased: [
          {
            id: 'x',
            name: 'x',
            level: 3,
            bonus: 'emerald',
            bonusCount: 1,
            prestige: 10,
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
            effectiveBonus: 'emerald',
          },
        ],
      }),
    ).toBe('color');
  });

  it('replenish gifts opponent a privilege', () => {
    const g = createDuelGame({ mode: 'hotseat', rng: seededRng(9) });
    // Empty some board cells into bag so replenish is meaningful
    const s: DuelGameState = {
      ...g,
      board: g.board.map((t, i) => (i < 5 ? null : t)),
      bag: ['ruby', 'pearl', 'emerald'],
    };
    const before = s.seats[1].privileges;
    const next = applyAction(s, { type: 'replenish' });
    expect(next.seats[1].privileges).toBeGreaterThanOrEqual(before);
    expect(next.usedReplenishThisTurn).toBe(true);
  });
});
