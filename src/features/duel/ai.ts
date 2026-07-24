import type { DuelJewelCard, DuelGem } from '@/data/duel-cards';
import {
  applyAction,
  checkVictory,
  currentSeat,
  listLegalActions,
  opponentSeat,
  takeGivesPrivilegeTax,
} from './engine';
import type {
  DuelDifficulty,
  DuelGameAction,
  DuelGameState,
  DuelSeat,
} from './types';

export type DuelPersona = {
  prestige: number;
  crowns: number;
  abilityExtraTurn: number;
  abilityOther: number;
  eagerBuyBias: number;
  buyQualityFloor: number;
  privilegeTaxPenalty: number;
  denyScale: number;
  winLineAware: number;
  reserveValue: number;
  pearlValue: number;
  noise: number;
  mistakeRate: number;
};

const PERSONAS: Record<DuelDifficulty, DuelPersona> = {
  easy: {
    prestige: 6,
    crowns: 5,
    abilityExtraTurn: 8,
    abilityOther: 3,
    eagerBuyBias: 8,
    buyQualityFloor: 0,
    privilegeTaxPenalty: 1,
    denyScale: 0.2,
    winLineAware: 0.4,
    reserveValue: 1,
    pearlValue: 1.5,
    noise: 3,
    mistakeRate: 0.42,
  },
  normal: {
    prestige: 12,
    crowns: 10,
    abilityExtraTurn: 18,
    abilityOther: 7,
    eagerBuyBias: 2,
    buyQualityFloor: 4,
    privilegeTaxPenalty: 6,
    denyScale: 1,
    winLineAware: 1,
    reserveValue: 2.5,
    pearlValue: 3,
    noise: 0.6,
    mistakeRate: 0.06,
  },
  hard: {
    prestige: 14,
    crowns: 13,
    abilityExtraTurn: 22,
    abilityOther: 9,
    eagerBuyBias: 0,
    buyQualityFloor: 8,
    privilegeTaxPenalty: 12,
    denyScale: 1.8,
    winLineAware: 1.6,
    reserveValue: 4,
    pearlValue: 4,
    noise: 0.1,
    mistakeRate: 0,
  },
};

export function getDuelPersona(difficulty: DuelDifficulty): DuelPersona {
  return PERSONAS[difficulty] ?? PERSONAS.normal;
}

function colorPrestige(seat: DuelSeat): Record<DuelGem, number> {
  const out: Record<DuelGem, number> = {
    emerald: 0,
    sapphire: 0,
    ruby: 0,
    diamond: 0,
    onyx: 0,
  };
  for (const c of seat.purchased) {
    if (c.effectiveBonus) out[c.effectiveBonus] += c.prestige;
  }
  return out;
}

function maxColorPrestige(seat: DuelSeat): number {
  return Math.max(...Object.values(colorPrestige(seat)));
}

function findCard(
  state: DuelGameState,
  cardId: string,
  from: 'pyramid' | 'reserved',
  seat: DuelSeat,
): DuelJewelCard | null {
  if (from === 'reserved') {
    return seat.reserved.find((c) => c.id === cardId) ?? null;
  }
  return (
    [...state.l1, ...state.l2, ...state.l3].find((c) => c?.id === cardId) ??
    null
  );
}

function buyQuality(card: DuelJewelCard): number {
  return (
    card.prestige * 3 +
    card.crowns * 2.5 +
    (card.ability === 'extraTurn' ? 4 : card.ability ? 2 : 0) +
    (card.bonusCount >= 2 ? 2 : 0) +
    (card.bonus === 'associate' ? 1.5 : 0)
  );
}

function oppThreatLevel(opp: DuelSeat, persona: DuelPersona): number {
  let threat = 0;
  if (opp.prestige >= 16) threat += 4;
  else if (opp.prestige >= 12) threat += 2;
  if (opp.crowns >= 7) threat += 4;
  else if (opp.crowns >= 5) threat += 2;
  const colorMax = maxColorPrestige(opp);
  if (colorMax >= 8) threat += 4;
  else if (colorMax >= 6) threat += 2;
  return threat * persona.denyScale;
}

function wouldWinWithCard(seat: DuelSeat, card: DuelJewelCard): boolean {
  if (seat.prestige + card.prestige >= 20) return true;
  if (seat.crowns + card.crowns >= 10) return true;
  // Color win: need effective bonus; associate unknown until placed — treat as soft
  if (card.bonus && card.bonus !== 'associate') {
    const colors = colorPrestige(seat);
    if (colors[card.bonus] + card.prestige >= 10) return true;
  }
  return false;
}

export function scoreAction(
  state: DuelGameState,
  action: DuelGameAction,
  persona: DuelPersona,
  rng: () => number = Math.random,
): number {
  const seat = currentSeat(state);
  const opp = opponentSeat(state);
  let score = 0;
  const threat = oppThreatLevel(opp, persona);

  switch (action.type) {
    case 'buy': {
      const card = findCard(state, action.cardId, action.from, seat);
      if (!card) return -100;
      const quality = buyQuality(card);
      score += card.prestige * persona.prestige;
      score += card.crowns * persona.crowns;
      if (card.ability === 'extraTurn') score += persona.abilityExtraTurn;
      else if (card.ability) score += persona.abilityOther;
      if (card.bonus === 'associate') score += 5 * persona.winLineAware;
      if (card.bonusCount >= 2) score += 4;

      score += persona.eagerBuyBias;
      if (quality >= persona.buyQualityFloor) {
        score += (quality - persona.buyQualityFloor) * 1.2;
      } else if (persona.buyQualityFloor > 0) {
        score -= (persona.buyQualityFloor - quality) * 1.5;
      }

      if (wouldWinWithCard(seat, card)) score += 200;

      // Progress toward own win lines
      const nextColor =
        card.bonus && card.bonus !== 'associate'
          ? colorPrestige(seat)[card.bonus] + card.prestige
          : 0;
      score +=
        Math.max(0, seat.prestige + card.prestige - 12) *
        0.8 *
        persona.winLineAware;
      score +=
        Math.max(0, seat.crowns + card.crowns - 5) *
        1.2 *
        persona.winLineAware;
      score += Math.max(0, nextColor - 6) * 1.5 * persona.winLineAware;

      // Deny: buy contested high-value card when opp is threatening
      if (threat >= 3 && quality >= 6) {
        score += threat * 1.5;
      }
      break;
    }
    case 'takeTokens': {
      score += action.indices.length * 2;
      const tax = takeGivesPrivilegeTax(state.board, action.indices);
      if (tax) score -= persona.privilegeTaxPenalty;
      for (const i of action.indices) {
        const t = state.board[i];
        if (t === 'pearl') score += persona.pearlValue;
      }
      break;
    }
    case 'reserve': {
      score += 2 + persona.reserveValue;
      if (action.source.kind === 'pyramid') {
        const card = findCard(
          state,
          action.source.cardId,
          'pyramid',
          seat,
        );
        if (card) {
          const quality = buyQuality(card);
          score +=
            card.prestige * persona.reserveValue * 0.4 +
            card.crowns * persona.reserveValue * 0.5;
          // Deny-reserve when opponent threatens
          if (threat >= persona.denyScale * 2 && quality >= 5) {
            score += threat * persona.reserveValue;
          }
        }
      }
      break;
    }
    case 'usePrivilege': {
      score += 5;
      const t = state.board[action.boardIndex];
      if (t === 'pearl') score += persona.pearlValue;
      break;
    }
    case 'replenish': {
      score += state.bag.length > 8 ? 3 : -2;
      // Hard: avoid gifting privilege unless board is sparse
      if (persona.denyScale >= 1.5) {
        const empty = state.board.filter((x) => x === null).length;
        score += empty >= 10 ? 4 : -4;
      }
      break;
    }
    case 'chooseAssociate': {
      const colors = colorPrestige(seat);
      score += colors[action.color] * 3 * persona.winLineAware;
      break;
    }
    case 'chooseSteal': {
      score += action.token === 'pearl' ? 4 + persona.pearlValue : 4;
      if (threat >= 3 && action.token === 'pearl') score += threat;
      break;
    }
    case 'chooseTakeMatching':
      score += 5;
      break;
    case 'claimRoyal': {
      const royal = state.royals.find((r) => r.id === action.royalId);
      if (royal) {
        score += royal.prestige * persona.prestige * 0.8;
        if (royal.ability === 'extraTurn') score += persona.abilityExtraTurn;
        else if (royal.ability) score += persona.abilityOther;
      }
      break;
    }
    case 'discard': {
      const t = action.tokens[0];
      if (t === 'gold') score -= 3 + persona.pearlValue * 0.5;
      else if (t === 'pearl') score -= 2 + persona.pearlValue * 0.3;
      else score += 1;
      break;
    }
    default:
      break;
  }

  // Soft denial nudge near win clocks
  if (opp.prestige >= 16 || opp.crowns >= 7 || maxColorPrestige(opp) >= 8) {
    if (action.type === 'reserve') score += 5 * persona.denyScale;
    if (action.type === 'buy') score += 3 * persona.denyScale;
  }

  score += (rng() - 0.5) * 2 * persona.noise;
  return score;
}

function pickFromRanked(
  ranked: { action: DuelGameAction; score: number }[],
  persona: DuelPersona,
  rng: () => number,
): DuelGameAction | null {
  if (ranked.length === 0) return null;
  if (
    persona.mistakeRate <= 0 ||
    ranked.length === 1 ||
    rng() >= persona.mistakeRate
  ) {
    return ranked[0].action;
  }
  if (rng() < 0.35) {
    const start = Math.floor(ranked.length / 2);
    const idx = start + Math.floor(rng() * Math.max(1, ranked.length - start));
    return ranked[Math.min(idx, ranked.length - 1)].action;
  }
  const k = Math.min(3, ranked.length);
  const idx = 1 + Math.floor(rng() * (k - 1));
  return ranked[idx].action;
}

export function chooseDuelAiAction(
  state: DuelGameState,
  rng: () => number = Math.random,
): DuelGameAction | null {
  const legal = listLegalActions(state);
  if (legal.length === 0) return null;

  const seat = currentSeat(state);
  // Immediate win buys first (all difficulties)
  for (const action of legal) {
    if (action.type !== 'buy') continue;
    const card = findCard(state, action.cardId, action.from, seat);
    if (card && wouldWinWithCard(seat, card)) return action;
  }

  const persona = getDuelPersona(state.difficulty ?? 'normal');
  const ranked = legal
    .map((action) => ({
      action,
      score: scoreAction(state, action, persona, rng),
    }))
    .sort((a, b) => b.score - a.score);

  return pickFromRanked(ranked, persona, rng);
}

/** Apply AI action with automatic resolution of trivial follow-ups when possible. */
export function runAiStep(state: DuelGameState): DuelGameState {
  const action = chooseDuelAiAction(state);
  if (!action) return state;
  return applyAction(state, action);
}

export function isAiTurn(state: DuelGameState): boolean {
  if (state.phase === 'done') return false;
  if (state.phase === 'aiBusy') return true;
  const seat = currentSeat(state);
  if (!seat.isHuman) {
    return [
      'optional',
      'main',
      'chooseAssociate',
      'chooseSteal',
      'chooseTakeMatching',
      'chooseRoyal',
      'discardTokens',
    ].includes(state.phase);
  }
  return false;
}

void checkVictory;
