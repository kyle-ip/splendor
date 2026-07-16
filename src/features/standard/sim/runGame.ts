import { payForCard } from '@/data/solo-cards';
import {
  applyAction,
  createGame,
  currentSeat,
  listLegalActions,
  passTurn,
  resolveWinners,
} from '@/features/standard/engine';
import { chooseAiAction } from '@/features/standard/ai';
import type {
  Difficulty,
  GameAction,
  GameState,
} from '@/features/standard/types';

export type HumanPolicy = 'greedyBuy' | 'engineThenPoints' | 'mirrorAi';

export type SimResult = {
  seed: number;
  difficulty: Difficulty;
  winnerIds: number[];
  turns: number;
  humanWon: boolean;
  aiPrestige: number;
  humanPrestige: number;
  /** AI seat: buys / turns where a buy was legal */
  aiBuyRate: number;
  /** AI seat: reserves when an opp-affordable card was on board / such turns */
  aiDenyReserveRate: number;
};

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 15)) >>> 0) / 4294967296;
  };
}

function oppCanAffordVisible(state: GameState, seatId: number): boolean {
  const cards = [...state.l1, ...state.l2, ...state.l3];
  for (const card of cards) {
    for (const opp of state.seats) {
      if (opp.id === seatId) continue;
      if (payForCard(opp.hand, card.cost, opp.bonuses)) return true;
    }
  }
  return false;
}

function scriptedHumanAction(
  state: GameState,
  policy: HumanPolicy,
  rng: () => number,
): GameAction | null {
  if (policy === 'mirrorAi') {
    return chooseAiAction({ ...state, difficulty: 'normal' }, rng);
  }

  const actions = listLegalActions(state);
  const seat = currentSeat(state);
  const buys = actions.filter((a) => a.type === 'buy');

  if (buys.length > 0) {
    if (policy === 'greedyBuy') {
      return buys[Math.floor(rng() * buys.length)] ?? buys[0];
    }
    const scored = buys.map((a) => {
      if (a.type !== 'buy') return { a, s: -Infinity };
      const card =
        [...state.l1, ...state.l2, ...state.l3, ...seat.reserved].find(
          (c) => c.id === a.cardId,
        ) ?? null;
      if (!card) return { a, s: -Infinity };
      let s = card.points * 5 + card.level;
      if (seat.prestige < 8 && card.level === 1) s += 3;
      return { a, s };
    });
    scored.sort((x, y) => y.s - x.s);
    return scored[0]?.a ?? buys[0];
  }

  const takes = actions.filter((a) => a.type === 'take');
  if (takes.length > 0) {
    return takes[Math.floor(rng() * takes.length)] ?? takes[0];
  }

  const reserves = actions.filter((a) => a.type === 'reserve');
  if (reserves.length > 0) return reserves[0];
  return actions[0] ?? null;
}

function resolveAction(state: GameState, action: GameAction | null): GameState {
  if (!action) return passTurn(state);
  return applyAction(state, action) ?? state;
}

/**
 * Headless simulation: seat 0 is scripted "human", others use AI at `difficulty`.
 */
export function runGame(
  seed: number,
  opts: {
    difficulty: Difficulty;
    playerCount?: number;
    humanPolicy?: HumanPolicy;
    maxTurns?: number;
  },
): SimResult {
  const rng = mulberry32(seed);
  const rawPlayers = opts.playerCount ?? 2;
  const playerCount: 2 | 3 | 4 =
    rawPlayers === 3 || rawPlayers === 4 ? rawPlayers : 2;
  const humanPolicy = opts.humanPolicy ?? 'engineThenPoints';
  const maxTurns = opts.maxTurns ?? 80;

  let state = createGame({
    playerCount,
    humanSeat: 0,
    difficulty: opts.difficulty,
    rng,
  });

  let aiBuyOps = 0;
  let aiBuys = 0;
  let aiThreatOps = 0;
  let aiDenyReserves = 0;

  let guard = 0;
  while (state.phase !== 'done' && state.turn <= maxTurns && guard < 5000) {
    guard += 1;
    const seat = currentSeat(state);

    if (state.phase === 'discardGems' || state.phase === 'chooseNoble') {
      state = resolveAction(state, chooseAiAction(state, rng));
      continue;
    }

    if (seat.isHuman) {
      state = resolveAction(
        state,
        scriptedHumanAction(state, humanPolicy, rng),
      );
      continue;
    }

    const legal = listLegalActions(state);
    if (legal.some((a) => a.type === 'buy')) aiBuyOps += 1;
    const threat = oppCanAffordVisible(state, seat.id);
    if (threat) aiThreatOps += 1;

    const action = chooseAiAction(state, rng);
    if (action?.type === 'buy') aiBuys += 1;
    if (action?.type === 'reserve' && threat) aiDenyReserves += 1;
    state = resolveAction(state, action);
  }

  if (state.phase !== 'done') {
    state = {
      ...state,
      phase: 'done',
      winnerIds: resolveWinners(state),
    };
  }

  const human = state.seats[0];
  const aiSeats = state.seats.filter((s) => !s.isHuman);
  const aiPrestige = Math.max(...aiSeats.map((s) => s.prestige), 0);

  return {
    seed,
    difficulty: opts.difficulty,
    winnerIds: state.winnerIds,
    turns: state.turn,
    humanWon: state.winnerIds.includes(0),
    aiPrestige,
    humanPrestige: human.prestige,
    aiBuyRate: aiBuyOps > 0 ? aiBuys / aiBuyOps : 0,
    aiDenyReserveRate: aiThreatOps > 0 ? aiDenyReserves / aiThreatOps : 0,
  };
}

export function aggregate(results: SimResult[]) {
  const n = results.length || 1;
  const wins = results.filter((r) => r.humanWon).length;
  return {
    n: results.length,
    /** Scripted human win rate (should fall Easy → Hard) */
    humanWinRate: wins / n,
    avgAiPrestige: results.reduce((a, r) => a + r.aiPrestige, 0) / n,
    avgTurns: results.reduce((a, r) => a + r.turns, 0) / n,
    avgAiBuyRate: results.reduce((a, r) => a + r.aiBuyRate, 0) / n,
    avgAiDenyReserveRate:
      results.reduce((a, r) => a + r.aiDenyReserveRate, 0) / n,
  };
}

export function runBatch(
  baseSeed: number,
  n: number,
  opts: {
    difficulty: Difficulty;
    playerCount?: number;
    humanPolicy?: HumanPolicy;
  },
): SimResult[] {
  const out: SimResult[] = [];
  for (let i = 0; i < n; i++) {
    out.push(runGame(baseSeed + i * 9973, opts));
  }
  return out;
}
