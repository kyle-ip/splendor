import { describe, expect, it } from 'vitest';
import type { SoloCard } from '@/data/solo-cards';
import { emptyBonuses } from '@/data/solo-cards';
import { createGame } from '@/features/standard/engine';
import {
  contestedCardIds,
  selectStandardTip,
} from '@/features/standard/practiceTips';
import type { GameState, Seat } from '@/features/standard/types';

const emptyHand = () => ({
  emerald: 0,
  sapphire: 0,
  ruby: 0,
  diamond: 0,
  onyx: 0,
  gold: 0,
});

function threatCard(): SoloCard {
  return {
    id: 'threat-4pt',
    name: 'threat',
    level: 2,
    points: 4,
    bonus: 'diamond',
    cost: { emerald: 0, sapphire: 0, ruby: 0, diamond: 3, onyx: 0 },
  };
}

function withSeats(
  g: GameState,
  ai: Partial<Seat>,
  human?: Partial<Seat>,
): GameState {
  return {
    ...g,
    seats: g.seats.map((s) => {
      if (s.id === 1) return { ...s, ...ai };
      if (human && s.id === 0) return { ...s, ...human };
      return s;
    }),
  };
}

describe('practiceTips', () => {
  it('lists contested card ids opponents can afford', () => {
    let g = createGame({ playerCount: 2, humanSeat: 0, difficulty: 'normal' });
    const threat = threatCard();
    g = {
      ...g,
      phase: 'human',
      currentSeat: 0,
      l1: [],
      l2: [threat],
      l3: [],
    };
    g = withSeats(
      g,
      {
        hand: { ...emptyHand(), diamond: 3 },
        bonuses: emptyBonuses(),
      },
      { hand: emptyHand(), bonuses: emptyBonuses() },
    );

    expect([...contestedCardIds(g, 0)]).toContain('threat-4pt');
  });

  it('prioritizes ending over deny', () => {
    let g = createGame({ playerCount: 2, humanSeat: 0, difficulty: 'normal' });
    const threat = threatCard();
    g = {
      ...g,
      phase: 'human',
      currentSeat: 0,
      endingRound: true,
      l1: [],
      l2: [threat],
      l3: [],
    };
    g = withSeats(
      g,
      {
        hand: { ...emptyHand(), diamond: 3 },
        bonuses: emptyBonuses(),
      },
      { hand: emptyHand(), bonuses: emptyBonuses(), reserved: [] },
    );

    const tip = selectStandardTip(g, 0, new Set());
    expect(tip?.id).toBe('ending');
  });

  it('suggests deny when an opponent can buy a display card', () => {
    let g = createGame({ playerCount: 2, humanSeat: 0, difficulty: 'normal' });
    const threat = threatCard();
    g = {
      ...g,
      phase: 'human',
      currentSeat: 0,
      endingRound: false,
      l1: [],
      l2: [threat],
      l3: [],
      log: [],
      turn: 5,
    };
    g = withSeats(
      g,
      {
        hand: { ...emptyHand(), diamond: 3 },
        bonuses: emptyBonuses(),
      },
      { hand: emptyHand(), bonuses: emptyBonuses(), reserved: [] },
    );

    const tip = selectStandardTip(g, 0, new Set());
    expect(tip?.id).toBe('deny');
  });

  it('skips dismissed tip ids and picks the next', () => {
    let g = createGame({ playerCount: 2, humanSeat: 0, difficulty: 'normal' });
    const threat = threatCard();
    g = {
      ...g,
      phase: 'human',
      currentSeat: 0,
      endingRound: true,
      l1: [],
      l2: [threat],
      l3: [],
    };
    g = withSeats(
      g,
      {
        hand: { ...emptyHand(), diamond: 3 },
        bonuses: emptyBonuses(),
      },
      {
        hand: {
          emerald: 2,
          sapphire: 2,
          ruby: 2,
          diamond: 2,
          onyx: 0,
          gold: 0,
        },
        bonuses: emptyBonuses(),
        reserved: [],
      },
    );

    const tip = selectStandardTip(g, 0, new Set(['ending']));
    expect(tip?.id).toBe('deny');
  });

  it('fires handLimit when human holds ≥8 gems', () => {
    let g = createGame({ playerCount: 2, humanSeat: 0, difficulty: 'normal' });
    g = {
      ...g,
      phase: 'human',
      currentSeat: 0,
      endingRound: false,
      l1: [],
      l2: [],
      l3: [],
      log: [],
      turn: 3,
    };
    g = withSeats(g, { hand: emptyHand(), bonuses: emptyBonuses() }, {
      hand: {
        emerald: 2,
        sapphire: 2,
        ruby: 2,
        diamond: 2,
        onyx: 0,
        gold: 0,
      },
      bonuses: emptyBonuses(),
      reserved: [],
    });

    expect(selectStandardTip(g, 0, new Set())?.id).toBe('handLimit');
  });

  it('returns null when all candidates are dismissed', () => {
    let g = createGame({ playerCount: 2, humanSeat: 0, difficulty: 'normal' });
    g = {
      ...g,
      phase: 'human',
      endingRound: true,
      l1: [],
      l2: [],
      l3: [],
    };
    expect(
      selectStandardTip(
        g,
        0,
        new Set(['ending', 'deny', 'nobleRace', 'handLimit', 'engine']),
      ),
    ).toBeNull();
  });
});
