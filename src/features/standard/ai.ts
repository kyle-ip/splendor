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

type Weights = {
  prestige: number;
  bonus: number;
  buyProgress: number;
  takeCoverage: number;
  reserveValue: number;
  goldValue: number;
  denyBuy: number;
  denyNoble: number;
  bankBlock: number;
  noise: number;
  /** Penalty if we don't take a card an opponent can buy next */
  leaveThreat: number;
};

const WEIGHTS: Record<Difficulty, Weights> = {
  easy: {
    prestige: 4,
    bonus: 2.5,
    buyProgress: 1.2,
    takeCoverage: 1.5,
    reserveValue: 1.5,
    goldValue: 1.2,
    denyBuy: 1.5,
    denyNoble: 1,
    bankBlock: 0.8,
    noise: 4,
    leaveThreat: 1,
  },
  normal: {
    prestige: 5,
    bonus: 3.2,
    buyProgress: 2,
    takeCoverage: 2.2,
    reserveValue: 2.4,
    goldValue: 1.8,
    denyBuy: 4,
    denyNoble: 3,
    bankBlock: 2.2,
    noise: 1.2,
    leaveThreat: 3.5,
  },
  hard: {
    prestige: 5.5,
    bonus: 3.5,
    buyProgress: 2.4,
    takeCoverage: 2.5,
    reserveValue: 3,
    goldValue: 2,
    denyBuy: 7,
    denyNoble: 5,
    bankBlock: 3.5,
    noise: 0.3,
    leaveThreat: 6,
  },
};

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
      card.points * w.prestige +
      w.bonus * 1.5 +
      card.level * 0.8;
    // Closer opponents matter more
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
      (n, c) =>
        n + Math.max(0, noble.requirements[c] - me.bonuses[c]),
      0,
    );
    const after = COLORS.reduce(
      (n, c) =>
        n + Math.max(0, noble.requirements[c] - bonusesAfter[c]),
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

function takeCoverageScore(
  state: GameState,
  me: Seat,
  colors: Color[],
  w: Weights,
): number {
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

  // Bank blocking: taking colors opponents need
  let block = 0;
  for (const c of colors) {
    for (const opp of state.seats) {
      if (opp.id === me.id) continue;
      for (const card of visibleCards(state)) {
        if (!canAfford(opp, card)) {
          const need = Math.max(0, card.cost[c] - opp.bonuses[c] - opp.hand[c]);
          if (need > 0 && state.bank[c] - colors.filter((x) => x === c).length < need) {
            block += w.bankBlock * (card.points + 1) * 0.25;
          }
        } else if (card.cost[c] > opp.bonuses[c]) {
          // Taking a color they would use next turn slightly helps deny
          block += w.bankBlock * 0.15;
        }
      }
    }
  }

  // Avoid useless tokens when already near hand limit
  const afterCount = Object.values(hand).reduce((a, b) => a + b, 0);
  const overflowPenalty = afterCount > 10 ? (afterCount - 10) * 2.5 : 0;

  return bestImprove * w.takeCoverage + block - overflowPenalty;
}

function scoreBuy(
  state: GameState,
  me: Seat,
  card: SoloCard,
  w: Weights,
): number {
  const bonusesAfter = {
    ...me.bonuses,
    [card.bonus]: me.bonuses[card.bonus] + 1,
  };
  let score =
    card.points * w.prestige +
    w.bonus * (1 + card.level * 0.15) +
    noblePressure(state, me, bonusesAfter, w);

  score += opponentThreatScore(state, me, card, w) * 0.85;

  // Engine: early levels matter more when prestige low
  if (me.prestige < 8 && card.level === 1) score += 1.5;
  if (me.prestige >= 10 && card.points >= 3) score += 2;

  return score;
}

function scoreReserve(
  state: GameState,
  me: Seat,
  card: SoloCard,
  w: Weights,
): number {
  let score = opponentThreatScore(state, me, card, w) * 0.9;
  const gap = costGap(card, me.hand, me.bonuses);
  if (gap <= 3) {
    score +=
      ((card.points + 1) * w.reserveValue) / Math.max(1, gap + 0.5);
  } else {
    score += w.reserveValue * 0.3;
  }
  if (state.bank.gold > 0) score += w.goldValue;
  // Don't reserve junk when hand of reserved is filling
  if (me.reserved.length >= 2) score -= 1.5;
  return score;
}

function leaveThreatPenalty(
  state: GameState,
  me: Seat,
  action: GameAction,
  w: Weights,
): number {
  if (w.leaveThreat <= 0) return 0;
  // Cards opponents can buy that we are not buying/reserving
  let penalty = 0;
  for (const card of visibleCards(state)) {
    const threat = opponentThreatScore(state, me, card, w);
    if (threat <= 0) continue;
    const taking =
      (action.type === 'buy' && action.cardId === card.id) ||
      (action.type === 'reserve' && action.cardId === card.id);
    if (!taking) {
      // Only punish high threats
      if (threat > w.denyBuy * 2) {
        penalty += (threat / 8) * w.leaveThreat * 0.15;
      }
    }
  }
  return penalty;
}

function scoreAction(
  state: GameState,
  action: GameAction,
  w: Weights,
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
    score = scoreBuy(state, me, found.card, w);
  } else if (action.type === 'take') {
    score = takeCoverageScore(state, me, action.colors, w);
  } else if (action.type === 'reserve') {
    const found = findCard(state, action.cardId);
    if (!found || found.level === 'reserved') return -Infinity;
    score = scoreReserve(state, me, found.card, w);
  } else {
    return -Infinity;
  }

  score -= leaveThreatPenalty(state, me, action, w);
  score += (rng() - 0.5) * w.noise;
  return score;
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
    // Prefer claiming when it helps race
    const sorted = [...nobles].sort((a, b) => {
      const scoreA = nobleClaimScore(state, me, a);
      const scoreB = nobleClaimScore(state, me, b);
      return scoreB - scoreA || a.id - b.id;
    });
    return { type: 'claimNoble', nobleId: sorted[0].id };
  }

  const actions = listLegalActions(state);
  if (actions.length === 0) return null;

  const w = WEIGHTS[state.difficulty];
  let best: GameAction | null = null;
  let bestScore = -Infinity;

  for (const action of actions) {
    const s = scoreAction(state, action, w, rng);
    if (s > bestScore) {
      bestScore = s;
      best = action;
    }
  }

  // Hard: 1-ply — if an opponent can buy a high-value card next and we can deny, prefer deny
  if (state.difficulty === 'hard' && best) {
    const me = currentSeat(state);
    for (const action of actions) {
      if (action.type !== 'buy' && action.type !== 'reserve') continue;
      const found = findCard(state, action.cardId);
      if (!found || found.level === 'reserved') continue;
      const threat = opponentThreatScore(state, me, found.card, w);
      if (threat > bestScore * 0.55) {
        const s = scoreAction(state, action, w, () => 0.5) + threat * 0.4;
        if (s > bestScore) {
          bestScore = s;
          best = action;
        }
      }
    }
  }

  return best;
}

function nobleClaimScore(
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
