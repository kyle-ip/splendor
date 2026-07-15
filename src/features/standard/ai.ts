import type { GemCounts, NobleRequirement } from '@/types';
import { payForCard, type SoloCard } from '@/data/solo-cards';
import {
  COLORS,
  currentSeat,
  eligibleNobles,
  listDiscardActions,
  listLegalActions,
  autoDiscard,
  findCard,
} from './engine';
import type {
  Color,
  Difficulty,
  GameAction,
  GameState,
  Seat,
} from './types';

export type PhaseKind = 'engine' | 'mid' | 'finish';

export type Persona = {
  weights: Weights;
  /** Chance to pick 2nd/3rd ranked action instead of best */
  mistakeRate: number;
  /** Scales opponent-threat contribution on reserve / leaveThreat */
  denyScale: number;
  /** Fixed threat threshold for leaveThreat (not inverted by denyScale) */
  threatThreshold: number;
  /** Eager flat boost on any buy (Easy only, high) */
  eagerBuyBias: number;
  /** Minimum buy quality before applying qualityCommit */
  buyQualityFloor: number;
  /** Extra commit when buyQuality exceeds floor */
  qualityCommit: number;
  /** Soften takes when a buy that clears floor exists */
  takeWhenCanBuy: number;
  useHardDenyPass: boolean;
};

type Weights = {
  prestige: number;
  bonus: number;
  buyProgress: number;
  takeCoverage: number;
  reserveValue: number;
  goldValue: number;
  denyNoble: number;
  bankBlock: number;
  noise: number;
  leaveThreat: number;
};

const PERSONAS: Record<Difficulty, Persona> = {
  easy: {
    weights: {
      prestige: 3,
      bonus: 1.8,
      buyProgress: 1.0,
      takeCoverage: 1.1,
      reserveValue: 0.8,
      goldValue: 0.8,
      denyNoble: 0.4,
      bankBlock: 0.2,
      noise: 2.5,
      leaveThreat: 0.3,
    },
    mistakeRate: 0.42,
    denyScale: 0.15,
    threatThreshold: 6,
    eagerBuyBias: 5,
    buyQualityFloor: 0,
    qualityCommit: 1.5,
    takeWhenCanBuy: 0.7,
    useHardDenyPass: false,
  },
  normal: {
    weights: {
      prestige: 5,
      bonus: 3.2,
      buyProgress: 2,
      takeCoverage: 2.2,
      reserveValue: 2.4,
      goldValue: 1.8,
      denyNoble: 3,
      bankBlock: 2.2,
      noise: 0.6,
      leaveThreat: 3.5,
    },
    mistakeRate: 0.06,
    denyScale: 1.0,
    threatThreshold: 4,
    eagerBuyBias: 2,
    buyQualityFloor: 2,
    qualityCommit: 5.5,
    takeWhenCanBuy: 0.32,
    useHardDenyPass: false,
  },
  hard: {
    weights: {
      prestige: 5.5,
      bonus: 3.5,
      buyProgress: 2.4,
      takeCoverage: 2.5,
      reserveValue: 3.2,
      goldValue: 2,
      denyNoble: 5,
      bankBlock: 3.5,
      noise: 0.1,
      leaveThreat: 6.5,
    },
    mistakeRate: 0,
    denyScale: 1.8,
    threatThreshold: 3.5,
    eagerBuyBias: 0,
    buyQualityFloor: 6,
    qualityCommit: 7,
    takeWhenCanBuy: 0.2,
    useHardDenyPass: true,
  },
};

export function getPersona(difficulty: Difficulty): Persona {
  return PERSONAS[difficulty];
}

function costGap(
  card: SoloCard,
  hand: GemCounts,
  bonuses: Omit<GemCounts, 'gold'>,
): number {
  let gap = 0;
  let gold = hand.gold;
  for (const c of COLORS) {
    const need = Math.max(0, card.cost[c] - bonuses[c]);
    const have = hand[c];
    if (have >= need) continue;
    const miss = need - have;
    const useGold = Math.min(gold, miss);
    gold -= useGold;
    gap += miss - useGold;
  }
  return gap;
}

function canAfford(seat: Seat, card: SoloCard): boolean {
  return payForCard(seat.hand, card.cost, seat.bonuses) !== null;
}

function visibleCards(state: GameState): SoloCard[] {
  return [...state.l1, ...state.l2, ...state.l3];
}

export function derivePhase(me: Seat): PhaseKind {
  const bonusTotal = COLORS.reduce((n, c) => n + me.bonuses[c], 0);
  if (me.prestige >= 10 || (me.prestige >= 7 && bonusTotal >= 8)) return 'finish';
  if (me.prestige < 6 && bonusTotal < 5) return 'engine';
  return 'mid';
}

function opponentThreatScore(
  state: GameState,
  me: Seat,
  card: SoloCard,
  w: Weights,
): number {
  let threat = 0;
  for (const opp of state.seats) {
    if (opp.id === me.id) continue;
    if (!canAfford(opp, card)) continue;
    const value =
      card.points * w.prestige + w.bonus * 1.5 + card.level * 0.8;
    const lead = opp.prestige - me.prestige;
    threat += value * (1 + Math.max(0, lead) * 0.08);
  }
  return threat;
}

function noblePressure(
  state: GameState,
  me: Seat,
  bonusesAfter: Omit<GemCounts, 'gold'>,
  w: Weights,
): number {
  let score = 0;
  for (const noble of state.nobles) {
    const before = COLORS.reduce(
      (n, c) => n + Math.max(0, noble.requirements[c] - me.bonuses[c]),
      0,
    );
    const after = COLORS.reduce(
      (n, c) => n + Math.max(0, noble.requirements[c] - bonusesAfter[c]),
      0,
    );
    if (after === 0 && before > 0) score += 3 * w.prestige;
    else if (after < before) score += (before - after) * w.denyNoble * 0.35;

    for (const opp of state.seats) {
      if (opp.id === me.id) continue;
      const oppGap = COLORS.reduce(
        (n, c) =>
          n + Math.max(0, noble.requirements[c] - opp.bonuses[c]),
        0,
      );
      if (oppGap <= 2 && after < before) {
        score += w.denyNoble * (3 - oppGap) * 0.5;
      }
    }
  }
  return score;
}

/** Intrinsic card value without flat buy-bias — used for quality gates. */
export function buyQuality(
  state: GameState,
  me: Seat,
  card: SoloCard,
  persona: Persona,
): number {
  const w = persona.weights;
  const phase = derivePhase(me);
  const bonusesAfter = {
    ...me.bonuses,
    [card.bonus]: me.bonuses[card.bonus] + 1,
  };
  let q =
    card.points * w.prestige +
    w.bonus * (1 + card.level * 0.15) +
    noblePressure(state, me, bonusesAfter, w) * 0.5;

  if (phase === 'engine') {
    if (card.level === 1 && card.points >= 1) q += 2.5;
    else if (card.level === 1) q -= 0.8;
    if (card.level === 3 && card.points <= 3) q -= 2;
  }
  if (phase === 'finish' && card.points >= 3) q += 3;
  if (phase === 'mid' && card.level === 1 && card.points === 0) q -= 1.2;

  return q;
}

function takeCoverageScore(
  state: GameState,
  me: Seat,
  colors: Color[],
  persona: Persona,
): number {
  const w = persona.weights;
  const hand = { ...me.hand };
  for (const c of colors) hand[c] += 1;

  let bestImprove = 0;
  const targets = [...visibleCards(state), ...me.reserved];
  for (const card of targets) {
    const before = costGap(card, me.hand, me.bonuses);
    const after = costGap(card, hand, me.bonuses);
    if (after < before) {
      const value =
        (card.points + 1) * w.buyProgress + card.level * 0.5;
      bestImprove = Math.max(bestImprove, (before - after) * value);
    }
  }

  let block = 0;
  for (const c of colors) {
    for (const opp of state.seats) {
      if (opp.id === me.id) continue;
      for (const card of visibleCards(state)) {
        if (!canAfford(opp, card)) {
          const need = Math.max(
            0,
            card.cost[c] - opp.bonuses[c] - opp.hand[c],
          );
          if (
            need > 0 &&
            state.bank[c] - colors.filter((x) => x === c).length < need
          ) {
            block +=
              w.bankBlock * persona.denyScale * (card.points + 1) * 0.25;
          }
        }
      }
    }
  }

  const afterCount = Object.values(hand).reduce((a, b) => a + b, 0);
  const overflowPenalty = afterCount > 10 ? (afterCount - 10) * 2.5 : 0;

  let score = bestImprove * w.takeCoverage + block - overflowPenalty;

  const qualityBuyExists = [...visibleCards(state), ...me.reserved].some(
    (card) =>
      canAfford(me, card) &&
      buyQuality(state, me, card, persona) >= persona.buyQualityFloor,
  );
  if (qualityBuyExists) score *= persona.takeWhenCanBuy;

  return score;
}

function scoreBuy(
  state: GameState,
  me: Seat,
  card: SoloCard,
  persona: Persona,
): number {
  const w = persona.weights;
  const q = buyQuality(state, me, card, persona);
  const bonusesAfter = {
    ...me.bonuses,
    [card.bonus]: me.bonuses[card.bonus] + 1,
  };
  let score =
    q +
    persona.eagerBuyBias +
    noblePressure(state, me, bonusesAfter, w) * 0.5 +
    opponentThreatScore(state, me, card, w) * 0.35 * persona.denyScale;

  if (q >= persona.buyQualityFloor) {
    score += persona.qualityCommit;
  } else if (persona.eagerBuyBias < 3) {
    // Weak buys (wrong-color / low quality) — Normal/Hard shy away hard
    score -= 4 + persona.buyQualityFloor;
  }

  if (me.prestige < 8 && card.level === 1) score += 1.2;
  if (me.prestige >= 10 && card.points >= 3) score += 2;

  return score;
}

function scoreReserve(
  state: GameState,
  me: Seat,
  card: SoloCard,
  persona: Persona,
): number {
  const w = persona.weights;
  const rawThreat = opponentThreatScore(state, me, card, w);
  const threat = rawThreat * 0.9 * persona.denyScale;
  let score = threat;
  if (rawThreat >= persona.threatThreshold && persona.useHardDenyPass) {
    score += rawThreat * 0.85 + card.points * 2;
  }
  const gap = costGap(card, me.hand, me.bonuses);
  if (gap <= 3) {
    score +=
      ((card.points + 1) * w.reserveValue) / Math.max(1, gap + 0.5);
  } else {
    score += w.reserveValue * 0.25;
  }
  if (state.bank.gold > 0) score += w.goldValue;
  if (me.reserved.length >= 2) score -= 1.5;

  // Behind on tempo: Hard avoids suicide snipes of low-value cards
  if (persona.useHardDenyPass) {
    const lead =
      Math.max(...state.seats.map((s) => s.prestige)) - me.prestige;
    if (lead >= 4 && card.points < 3 && rawThreat < 8) score -= 3;
  }

  return score;
}

function leaveThreatPenalty(
  state: GameState,
  me: Seat,
  action: GameAction,
  persona: Persona,
): number {
  const w = persona.weights;
  if (w.leaveThreat <= 0 || persona.denyScale <= 0.05) return 0;
  let penalty = 0;
  for (const card of visibleCards(state)) {
    const threat = opponentThreatScore(state, me, card, w);
    if (threat < persona.threatThreshold) continue;
    const taking =
      (action.type === 'buy' && action.cardId === card.id) ||
      (action.type === 'reserve' && action.cardId === card.id);
    if (!taking) {
      penalty +=
        (threat / 8) * w.leaveThreat * 0.15 * persona.denyScale;
    }
  }
  return penalty;
}

export function scoreAction(
  state: GameState,
  action: GameAction,
  persona: Persona,
  rng: () => number,
): number {
  const me = currentSeat(state);
  let score = 0;

  if (action.type === 'buy') {
    const found = findCard(state, action.cardId);
    if (!found) return -Infinity;
    if (action.from === 'reserved' && found.seatIndex !== me.id) {
      return -Infinity;
    }
    score = scoreBuy(state, me, found.card, persona);
  } else if (action.type === 'take') {
    score = takeCoverageScore(state, me, action.colors, persona);
  } else if (action.type === 'reserve') {
    const found = findCard(state, action.cardId);
    if (!found || found.level === 'reserved') return -Infinity;
    score = scoreReserve(state, me, found.card, persona);
  } else {
    return -Infinity;
  }

  score -= leaveThreatPenalty(state, me, action, persona);
  score += (rng() - 0.5) * persona.weights.noise;
  return score;
}

export function nobleClaimScore(
  state: GameState,
  me: Seat,
  noble: NobleRequirement,
): number {
  let score = 3;
  for (const opp of state.seats) {
    if (opp.id === me.id) continue;
    const gap = COLORS.reduce(
      (n, c) => n + Math.max(0, noble.requirements[c] - opp.bonuses[c]),
      0,
    );
    if (gap <= 1) score += 4;
    else if (gap <= 3) score += 1.5;
  }
  return score;
}

function pickFromRanked(
  ranked: { action: GameAction; score: number }[],
  persona: Persona,
  rng: () => number,
): GameAction | null {
  if (ranked.length === 0) return null;
  if (
    persona.mistakeRate <= 0 ||
    ranked.length === 1 ||
    rng() >= persona.mistakeRate
  ) {
    return ranked[0].action;
  }
  // Easy blunders: sometimes pick among bottom half of legal actions
  if (rng() < 0.35) {
    const start = Math.floor(ranked.length / 2);
    const idx = start + Math.floor(rng() * Math.max(1, ranked.length - start));
    return ranked[Math.min(idx, ranked.length - 1)].action;
  }
  const k = Math.min(3, ranked.length);
  const idx = 1 + Math.floor(rng() * (k - 1));
  return ranked[idx].action;
}

export function chooseAiAction(
  state: GameState,
  rng: () => number = Math.random,
): GameAction | null {
  if (state.phase === 'discardGems') {
    return autoDiscard(state);
  }
  if (state.phase === 'chooseNoble') {
    const me = currentSeat(state);
    const nobles = state.pendingNobles;
    if (nobles.length === 0) return null;
    const sorted = [...nobles].sort((a, b) => {
      const scoreA = nobleClaimScore(state, me, a);
      const scoreB = nobleClaimScore(state, me, b);
      return scoreB - scoreA || a.id - b.id;
    });
    return { type: 'claimNoble', nobleId: sorted[0].id };
  }

  const actions = listLegalActions(state);
  if (actions.length === 0) return null;

  const persona = getPersona(state.difficulty);
  const ranked = actions
    .map((action) => ({
      action,
      score: scoreAction(state, action, persona, rng),
    }))
    .filter((x) => Number.isFinite(x.score))
    .sort((a, b) => b.score - a.score);

  let best = pickFromRanked(ranked, persona, rng);
  let bestScore = ranked[0]?.score ?? -Infinity;

  if (persona.useHardDenyPass && best && ranked[0]) {
    const me = currentSeat(state);
    const lead =
      Math.max(...state.seats.map((s) => s.prestige)) - me.prestige;
    // Don't suicide-snipe when clearly behind
    if (lead < 5) {
      for (const action of actions) {
        if (action.type !== 'buy' && action.type !== 'reserve') continue;
        const found = findCard(state, action.cardId);
        if (!found || found.level === 'reserved') continue;
        const threat = opponentThreatScore(
          state,
          me,
          found.card,
          persona.weights,
        );
        if (threat > bestScore * 0.55 && threat >= persona.threatThreshold) {
          const s =
            scoreAction(state, action, persona, () => 0.5) +
            threat * 0.4 * persona.denyScale;
          if (s > bestScore) {
            bestScore = s;
            best = action;
          }
        }
      }
    }
  }

  return best;
}

export function chooseAiDiscard(state: GameState): GameAction | null {
  return autoDiscard(state) ?? listDiscardActions(state)[0] ?? null;
}

/** Cards an opponent can currently afford (for UI hints). */
export function opponentAffordable(
  state: GameState,
  humanId: number,
): SoloCard[] {
  const result: SoloCard[] = [];
  for (const card of visibleCards(state)) {
    for (const seat of state.seats) {
      if (seat.id === humanId) continue;
      if (canAfford(seat, card)) {
        result.push(card);
        break;
      }
    }
  }
  return result;
}

export function seatCanClaim(
  seat: Seat,
  nobles: NobleRequirement[],
): NobleRequirement[] {
  return eligibleNobles(seat.bonuses, nobles);
}

/** Rank all legal actions (deterministic rng) for tests / oracle. */
export function rankLegalActions(
  state: GameState,
  rng: () => number = () => 0.5,
): { action: GameAction; score: number }[] {
  const persona = getPersona(state.difficulty);
  return listLegalActions(state)
    .map((action) => ({
      action,
      score: scoreAction(state, action, persona, rng),
    }))
    .sort((a, b) => b.score - a.score);
}
