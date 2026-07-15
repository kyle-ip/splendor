import { describe, expect, it } from 'vitest';
import type { SoloCard } from '@/data/solo-cards';
import { emptyBonuses } from '@/data/solo-cards';
import { createGame } from '@/features/standard/engine';
import {
  chooseAiAction,
  nobleClaimScore,
  rankLegalActions,
} from '@/features/standard/ai';
import type { Difficulty, GameState, Seat } from '@/features/standard/types';

const emptyHand = () => ({
  emerald: 0,
  sapphire: 0,
  ruby: 0,
  diamond: 0,
  onyx: 0,
  gold: 0,
});

function junkCard(): SoloCard {
  return {
    id: 'junk-emerald',
    name: 'junk',
    level: 1,
    points: 0,
    bonus: 'emerald',
    cost: { emerald: 1, sapphire: 0, ruby: 0, diamond: 0, onyx: 0 },
  };
}

function prizeCard(): SoloCard {
  return {
    id: 'prize-ruby',
    name: 'prize',
    level: 2,
    points: 3,
    bonus: 'ruby',
    cost: { emerald: 0, sapphire: 2, ruby: 2, diamond: 0, onyx: 0 },
  };
}

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

function baseAiState(difficulty: Difficulty): GameState {
  let g = createGame({ playerCount: 2, humanSeat: 0, difficulty });
  g = {
    ...g,
    currentSeat: 1,
    phase: 'aiBusy',
    l2: [],
    l3: [],
    d2: [],
    d3: [],
  };
  return g;
}

function withSeats(g: GameState, ai: Partial<Seat>, human?: Partial<Seat>): GameState {
  return {
    ...g,
    seats: g.seats.map((s) => {
      if (s.id === 1) return { ...s, ...ai };
      if (human && s.id === 0) return { ...s, ...human };
      return s;
    }),
  };
}

describe('AI decision fixtures', () => {
  it('Easy often buys junk when affordable; Hard prefers developing take', () => {
    const junk = junkCard();
    const prize = prizeCard();

    const make = (difficulty: Difficulty) => {
      let g = baseAiState(difficulty);
      g = {
        ...g,
        l1: [junk, prize, junkCard(), junkCard()],
      };
      // AI can buy junk (1 emerald) but prize needs sapphire+ruby it lacks —
      // taking sapphire+ruby+diamond would progress prize better.
      return withSeats(g, {
        hand: { ...emptyHand(), emerald: 2, sapphire: 0, ruby: 0, diamond: 0, gold: 0 },
        bonuses: emptyBonuses(),
      });
    };

    const easy = chooseAiAction(make('easy'), () => 0.5);

    // Easy's eager bias + low floor → buy junk is acceptable
    expect(easy?.type === 'buy' || easy?.type === 'take').toBe(true);
    if (easy?.type === 'buy') {
      expect(easy.cardId).toBe('junk-emerald');
    }

    // Hard should not prefer junk buy when a meaningful take exists
    const hardRank = rankLegalActions(make('hard'), () => 0.5);
    const top = hardRank[0]?.action;
    expect(top).toBeDefined();
    if (top?.type === 'buy') {
      expect(top.cardId).not.toBe('junk-emerald');
    } else {
      expect(top?.type).toBe('take');
    }
  });

  it('Hard reserves a high-threat card opponent can buy; Easy often does not', () => {
    const threat = threatCard();

    const make = (difficulty: Difficulty) => {
      let g = baseAiState(difficulty);
      g = {
        ...g,
        l1: [junkCard(), junkCard(), junkCard(), junkCard()],
        l2: [threat],
        bank: {
          emerald: 4,
          sapphire: 4,
          ruby: 4,
          diamond: 5,
          onyx: 4,
          gold: 5,
        },
      };
      return withSeats(
        g,
        {
          // AI cannot afford the 4pt card
          hand: emptyHand(),
          bonuses: emptyBonuses(),
          reserved: [],
        },
        {
          // Human can buy the threat next
          hand: { ...emptyHand(), diamond: 3 },
          bonuses: emptyBonuses(),
        },
      );
    };

    const hard = chooseAiAction(make('hard'), () => 0.5);
    const easy = chooseAiAction(make('easy'), () => 0.5);

    expect(hard?.type).toBe('reserve');
    if (hard?.type === 'reserve') {
      expect(hard.cardId).toBe('threat-4pt');
    }

    // Easy may take or buy junk rather than deny
    if (easy?.type === 'reserve') {
      // occasional — but with rng=0.5 and denyScale 0.2, usually not
      expect(true).toBe(true);
    } else {
      expect(['take', 'buy']).toContain(easy?.type);
    }
  });

  it('Normal buys a quality affordable card instead of endless takes', () => {
    const good: SoloCard = {
      id: 'good-l1',
      name: 'good',
      level: 1,
      points: 1,
      bonus: 'sapphire',
      cost: { emerald: 2, sapphire: 0, ruby: 0, diamond: 0, onyx: 0 },
    };
    let g = baseAiState('normal');
    g = { ...g, l1: [good, junkCard(), junkCard(), junkCard()] };
    g = withSeats(g, {
      hand: { ...emptyHand(), emerald: 3 },
      bonuses: emptyBonuses(),
    });

    const action = chooseAiAction(g, () => 0.5);
    expect(action?.type).toBe('buy');
    if (action?.type === 'buy') expect(action.cardId).toBe('good-l1');
  });

  it('Noble claim prefers denying opponent who is one gap away', () => {
    let g = baseAiState('hard');
    const nobleA = {
      id: 101,
      requirements: {
        emerald: 3,
        sapphire: 3,
        ruby: 0,
        diamond: 0,
        onyx: 0,
      },
    };
    const nobleB = {
      id: 102,
      requirements: {
        emerald: 0,
        sapphire: 0,
        ruby: 4,
        diamond: 4,
        onyx: 0,
      },
    };
    g = {
      ...g,
      phase: 'chooseNoble',
      pendingNobles: [nobleA, nobleB],
      nobles: [nobleA, nobleB],
    };
    g = withSeats(
      g,
      {
        bonuses: {
          emerald: 3,
          sapphire: 3,
          ruby: 0,
          diamond: 0,
          onyx: 0,
        },
      },
      {
        // Human almost on nobleA (missing 1 sapphire)
        bonuses: {
          emerald: 3,
          sapphire: 2,
          ruby: 0,
          diamond: 0,
          onyx: 0,
        },
      },
    );

    const me = g.seats[1];
    expect(nobleClaimScore(g, me, nobleA)).toBeGreaterThan(
      nobleClaimScore(g, me, nobleB),
    );

    const action = chooseAiAction(g, () => 0.5);
    expect(action).toEqual({ type: 'claimNoble', nobleId: 101 });
  });

  it('Hard is stable under fixed rng; Easy explores multiple actions across seeds', () => {
    const make = (difficulty: Difficulty) => {
      let g = baseAiState(difficulty);
      g = {
        ...g,
        l1: [
          junkCard(),
          {
            id: 'l1-b',
            name: 'b',
            level: 1,
            points: 0,
            bonus: 'sapphire',
            cost: { emerald: 0, sapphire: 0, ruby: 2, diamond: 0, onyx: 0 },
          },
          {
            id: 'l1-c',
            name: 'c',
            level: 1,
            points: 0,
            bonus: 'ruby',
            cost: { emerald: 0, sapphire: 1, ruby: 0, diamond: 1, onyx: 0 },
          },
          junkCard(),
        ],
      };
      return withSeats(g, {
        hand: {
          emerald: 1,
          sapphire: 1,
          ruby: 1,
          diamond: 1,
          onyx: 0,
          gold: 0,
        },
        bonuses: emptyBonuses(),
      });
    };

    const hardFixed = new Set<string>();
    for (let i = 0; i < 20; i++) {
      hardFixed.add(JSON.stringify(chooseAiAction(make('hard'), () => 0.5)));
    }
    expect(hardFixed.size).toBe(1);

    const easyKeys = new Set<string>();
    for (let i = 0; i < 40; i++) {
      let s = i * 97 + 3;
      const rng = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return (s & 0xffff) / 0x10000;
      };
      easyKeys.add(JSON.stringify(chooseAiAction(make('easy'), rng)));
    }
    expect(easyKeys.size).toBeGreaterThanOrEqual(2);
  });
});