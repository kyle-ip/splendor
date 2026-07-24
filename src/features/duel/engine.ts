import {
  DUEL_LEVEL1,
  DUEL_LEVEL2,
  DUEL_LEVEL3,
  DUEL_ROYALS,
  canAffordDuelCard,
  drawDisplay,
  emptyDuelBonuses,
  emptyDuelHand,
  payForDuelCard,
  shuffle,
  tokenTotal,
  type DuelGem,
  type DuelJewelCard,
  type DuelToken,
  type OwnedDuelCard,
} from '@/data/duel-cards';
import type {
  CreateDuelOptions,
  DuelGameAction,
  DuelGameState,
  DuelSeat,
  SeatNameKey,
} from './types';

export const BOARD_SIZE = 25;
export const BOARD_DIM = 5;

/** Clockwise spiral from center (index 12), first step east. */
export const SPIRAL_ORDER: number[] = (() => {
  const n = BOARD_DIM;
  const order: number[] = [];
  let x = Math.floor(n / 2);
  let y = Math.floor(n / 2);
  order.push(y * n + x);
  const dirs: [number, number][] = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ];
  let dist = 1;
  let di = 0;
  while (order.length < n * n) {
    for (let leg = 0; leg < 2; leg++) {
      const [dx, dy] = dirs[di % 4];
      for (let s = 0; s < dist; s++) {
        if (order.length >= n * n) break;
        x += dx;
        y += dy;
        if (x >= 0 && x < n && y >= 0 && y < n) {
          order.push(y * n + x);
        }
      }
      di += 1;
      if (order.length >= n * n) break;
    }
    dist += 1;
  }
  return order;
})();

const GEM_COLORS: DuelGem[] = [
  'emerald',
  'sapphire',
  'ruby',
  'diamond',
  'onyx',
];

const START_TOKENS: DuelToken[] = [
  ...Array(4).fill('emerald'),
  ...Array(4).fill('sapphire'),
  ...Array(4).fill('ruby'),
  ...Array(4).fill('diamond'),
  ...Array(4).fill('onyx'),
  ...Array(2).fill('pearl'),
  ...Array(3).fill('gold'),
] as DuelToken[];

function cloneSeat(s: DuelSeat): DuelSeat {
  return {
    ...s,
    hand: { ...s.hand },
    bonuses: { ...s.bonuses },
    reserved: [...s.reserved],
    purchased: s.purchased.map((c) => ({ ...c })),
    royals: [...s.royals],
  };
}

function cloneState(state: DuelGameState): DuelGameState {
  return {
    ...state,
    seats: [cloneSeat(state.seats[0]), cloneSeat(state.seats[1])],
    board: [...state.board],
    bag: [...state.bag],
    l1: [...state.l1],
    l2: [...state.l2],
    l3: [...state.l3],
    d1: [...state.d1],
    d2: [...state.d2],
    d3: [...state.d3],
    royals: [...state.royals],
    log: [...state.log],
  };
}

export function currentSeat(state: DuelGameState): DuelSeat {
  return state.seats[state.currentSeat];
}

export function opponentSeat(state: DuelGameState): DuelSeat {
  return state.seats[1 - state.currentSeat];
}

function placeTokensOnBoard(
  board: (DuelToken | null)[],
  tokens: DuelToken[],
): { board: (DuelToken | null)[]; bag: DuelToken[] } {
  const next = [...board];
  const bag = [...tokens];
  for (const idx of SPIRAL_ORDER) {
    if (bag.length === 0) break;
    if (next[idx] === null) {
      next[idx] = bag.shift()!;
    }
  }
  return { board: next, bag };
}

function givePrivilege(state: DuelGameState, seatId: number): void {
  const seat = state.seats[seatId];
  if (seat.privileges >= 3) return;
  if (state.privilegesSupply > 0) {
    state.privilegesSupply -= 1;
    seat.privileges += 1;
    return;
  }
  const opp = state.seats[1 - seatId];
  if (opp.privileges > 0) {
    opp.privileges -= 1;
    seat.privileges += 1;
  }
}

function rowOf(i: number): number {
  return Math.floor(i / BOARD_DIM);
}
function colOf(i: number): number {
  return i % BOARD_DIM;
}

/** True if indices form an uninterrupted line of 1–3 occupied non-gold tokens. */
export function isLegalTakeLine(
  board: (DuelToken | null)[],
  indices: number[],
): boolean {
  if (indices.length < 1 || indices.length > 3) return false;
  if (new Set(indices).size !== indices.length) return false;
  for (const i of indices) {
    if (i < 0 || i >= BOARD_SIZE) return false;
    const t = board[i];
    if (!t || t === 'gold') return false;
  }
  if (indices.length === 1) return true;

  const sorted = [...indices].sort((a, b) => a - b);
  const cells = sorted.map((i) => ({ r: rowOf(i), c: colOf(i), i }));
  const dr = cells[1].r - cells[0].r;
  const dc = cells[1].c - cells[0].c;
  if (dr === 0 && dc === 0) return false;
  // Must be axis or diagonal unit step
  const stepR = Math.sign(dr);
  const stepC = Math.sign(dc);
  if (Math.abs(dr) > 1 || Math.abs(dc) > 1) {
    // allow length-3 with step 1 checked below
  }
  // Normalize direction from first to second
  if (Math.abs(dr) > 1 || Math.abs(dc) > 1) return false;
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return false;

  for (let k = 1; k < cells.length; k++) {
    const er = cells[k].r - cells[k - 1].r;
    const ec = cells[k].c - cells[k - 1].c;
    if (er !== stepR || ec !== stepC) return false;
    if (Math.abs(er) > 1 || Math.abs(ec) > 1) return false;
  }
  return true;
}

export function takeGivesPrivilegeTax(
  board: (DuelToken | null)[],
  indices: number[],
): boolean {
  const tokens = indices.map((i) => board[i]!);
  if (tokens.length === 3 && tokens.every((t) => t === tokens[0])) return true;
  if (tokens.filter((t) => t === 'pearl').length >= 2) return true;
  return false;
}

function displayRow(
  state: DuelGameState,
  level: 1 | 2 | 3,
): (DuelJewelCard | null)[] {
  if (level === 1) return state.l1;
  if (level === 2) return state.l2;
  return state.l3;
}

function deckOf(state: DuelGameState, level: 1 | 2 | 3): DuelJewelCard[] {
  if (level === 1) return state.d1;
  if (level === 2) return state.d2;
  return state.d3;
}

function setDisplayRow(
  state: DuelGameState,
  level: 1 | 2 | 3,
  row: (DuelJewelCard | null)[],
): void {
  if (level === 1) state.l1 = row;
  else if (level === 2) state.l2 = row;
  else state.l3 = row;
}

function setDeck(
  state: DuelGameState,
  level: 1 | 2 | 3,
  deck: DuelJewelCard[],
): void {
  if (level === 1) state.d1 = deck;
  else if (level === 2) state.d2 = deck;
  else state.d3 = deck;
}

function refillSlot(
  state: DuelGameState,
  level: 1 | 2 | 3,
  slotIndex: number,
): void {
  const row = [...displayRow(state, level)];
  const deck = [...deckOf(state, level)];
  if (deck.length > 0) {
    row[slotIndex] = deck.shift()!;
  } else {
    row[slotIndex] = null;
  }
  setDisplayRow(state, level, row);
  setDeck(state, level, deck);
}

function findPyramidCard(
  state: DuelGameState,
  cardId: string,
): { level: 1 | 2 | 3; index: number; card: DuelJewelCard } | null {
  for (const level of [3, 2, 1] as const) {
    const row = displayRow(state, level);
    const index = row.findIndex((c) => c?.id === cardId);
    if (index >= 0 && row[index]) {
      return { level, index, card: row[index]! };
    }
  }
  return null;
}

function colorPrestige(seat: DuelSeat): Record<DuelGem, number> {
  const out = emptyDuelBonuses();
  for (const c of seat.purchased) {
    if (c.effectiveBonus) {
      out[c.effectiveBonus] += c.prestige;
    }
  }
  return out;
}

export function checkVictory(
  seat: DuelSeat,
): 'prestige' | 'crowns' | 'color' | null {
  if (seat.prestige >= 20) return 'prestige';
  if (seat.crowns >= 10) return 'crowns';
  const byColor = colorPrestige(seat);
  if (GEM_COLORS.some((g) => byColor[g] >= 10)) return 'color';
  return null;
}

function phaseForSeat(state: DuelGameState): DuelGameState['phase'] {
  const seat = currentSeat(state);
  if (!seat.isHuman) return 'aiBusy';
  return 'optional';
}

function finishTurn(state: DuelGameState): DuelGameState {
  const seat = currentSeat(state);
  const reason = checkVictory(seat);
  if (reason) {
    state.phase = 'done';
    state.winnerId = seat.id;
    state.winReason = reason;
    state.log.push({ kind: 'win', seat: seat.id, reason });
    state.log.push({ kind: 'gameOver' });
    return state;
  }

  if (state.extraTurnPending) {
    state.extraTurnPending = false;
    state.usedPrivilegeThisTurn = false;
    state.usedReplenishThisTurn = false;
    state.turn += 1;
    state.phase = phaseForSeat(state);
    if (state.phase === 'aiBusy') state.busyNonce += 1;
    return state;
  }

  state.currentSeat = 1 - state.currentSeat;
  state.usedPrivilegeThisTurn = false;
  state.usedReplenishThisTurn = false;
  state.turn += 1;
  state.phase = phaseForSeat(state);
  if (state.phase === 'aiBusy') state.busyNonce += 1;
  return state;
}

function afterTokensOk(state: DuelGameState): DuelGameState {
  const seat = currentSeat(state);
  const total = tokenTotal(seat.hand);
  if (total > 10) {
    state.phase = 'discardTokens';
    state.discardNeeded = total - 10;
    return state;
  }
  return finishTurn(state);
}

function afterAbilityPipeline(state: DuelGameState): DuelGameState {
  // pending associate / steal / takeMatching handled via phases first
  if (state.pendingAssociateCardId) {
    state.phase = 'chooseAssociate';
    return state;
  }
  if (state.pendingSteal) {
    const opp = opponentSeat(state);
    const has =
      opp.hand.emerald +
        opp.hand.sapphire +
        opp.hand.ruby +
        opp.hand.diamond +
        opp.hand.onyx +
        opp.hand.pearl >
      0;
    if (has) {
      state.phase = 'chooseSteal';
      return state;
    }
    state.pendingSteal = false;
  }
  if (state.pendingTakeMatchingColor) {
    const color = state.pendingTakeMatchingColor;
    const has = state.board.some((t) => t === color);
    if (has) {
      state.phase = 'chooseTakeMatching';
      return state;
    }
    state.pendingTakeMatchingColor = null;
  }
  if (state.pendingRoyalSlots > 0 && state.royals.length > 0) {
    state.phase = 'chooseRoyal';
    return state;
  }
  state.pendingRoyalSlots = 0;
  return afterTokensOk(state);
}

function applyCardAbility(
  state: DuelGameState,
  card: OwnedDuelCard,
): void {
  if (card.ability === 'extraTurn') {
    state.extraTurnPending = true;
  } else if (card.ability === 'privilege') {
    givePrivilege(state, state.currentSeat);
  } else if (card.ability === 'steal') {
    state.pendingSteal = true;
  } else if (card.ability === 'takeMatching' && card.effectiveBonus) {
    state.pendingTakeMatchingColor = card.effectiveBonus;
  }
}

function addPurchased(
  state: DuelGameState,
  card: DuelJewelCard,
  effectiveBonus: DuelGem | null,
): void {
  const seat = currentSeat(state);
  const owned: OwnedDuelCard = { ...card, effectiveBonus };
  seat.purchased.push(owned);
  seat.prestige += card.prestige;
  const prevCrowns = seat.crowns;
  seat.crowns += card.crowns;
  if (effectiveBonus && card.bonusCount > 0) {
    seat.bonuses[effectiveBonus] += card.bonusCount;
  }
  // Royal thresholds at 3 and 6
  const crossed3 = prevCrowns < 3 && seat.crowns >= 3;
  const crossed6 = prevCrowns < 6 && seat.crowns >= 6;
  if (crossed3) state.pendingRoyalSlots += 1;
  if (crossed6) state.pendingRoyalSlots += 1;

  applyCardAbility(state, owned);
}

export function createDuelGame(opts: CreateDuelOptions): DuelGameState {
  const rng = opts.rng ?? Math.random;
  const mode = opts.mode;
  const humanSeat =
    mode === 'hotseat'
      ? -1
      : Math.max(0, Math.min(1, opts.humanSeat ?? 0));

  const d1s = shuffle(DUEL_LEVEL1, rng);
  const d2s = shuffle(DUEL_LEVEL2, rng);
  const d3s = shuffle(DUEL_LEVEL3, rng);
  const a = drawDisplay(d1s, 5);
  const b = drawDisplay(d2s, 4);
  const c = drawDisplay(d3s, 3);

  const tokens = shuffle(START_TOKENS, rng);
  const board: (DuelToken | null)[] = Array(BOARD_SIZE).fill(null);
  const placed = placeTokensOnBoard(board, tokens);

  const seats: [DuelSeat, DuelSeat] = [
    makeSeat(0, mode, humanSeat, 'you'),
    makeSeat(1, mode, humanSeat, mode === 'hotseat' ? 'marco' : 'marco'),
  ];
  if (mode === 'ai') {
    seats[0].isHuman = humanSeat === 0;
    seats[0].nameKey = humanSeat === 0 ? 'you' : 'marco';
    seats[1].isHuman = humanSeat === 1;
    seats[1].nameKey = humanSeat === 1 ? 'you' : 'lucrezia';
  } else {
    seats[0].isHuman = true;
    seats[0].nameKey = 'you';
    seats[1].isHuman = true;
    seats[1].nameKey = 'marco';
  }

  // Second player starts with 1 Privilege
  const first = 0;
  const second = 1;
  const state: DuelGameState = {
    mode,
    seats,
    board: placed.board,
    bag: placed.bag,
    privilegesSupply: 2, // 3 total; second player holds 1
    l1: a.display,
    l2: b.display,
    l3: c.display,
    d1: a.rest,
    d2: b.rest,
    d3: c.rest,
    royals: shuffle(DUEL_ROYALS, rng),
    currentSeat: first,
    phase: seats[first].isHuman ? 'optional' : 'aiBusy',
    usedPrivilegeThisTurn: false,
    usedReplenishThisTurn: false,
    pendingAssociateCardId: null,
    pendingSteal: false,
    pendingTakeMatchingColor: null,
    pendingRoyalSlots: 0,
    discardNeeded: 0,
    extraTurnPending: false,
    winnerId: null,
    winReason: null,
    log: [],
    turn: 1,
    busyNonce: seats[first].isHuman ? 0 : 1,
    difficulty: opts.difficulty ?? 'normal',
  };
  seats[second].privileges = 1;
  return state;
}

function makeSeat(
  id: number,
  mode: CreateDuelOptions['mode'],
  humanSeat: number,
  nameKey: SeatNameKey,
): DuelSeat {
  return {
    id,
    isHuman: mode === 'hotseat' || id === humanSeat,
    nameKey,
    hand: emptyDuelHand(),
    bonuses: emptyDuelBonuses(),
    prestige: 0,
    crowns: 0,
    privileges: 0,
    reserved: [],
    purchased: [],
    royals: [],
  };
}

function mustReplenish(state: DuelGameState): boolean {
  if (state.bag.length === 0) return false;
  const legal = listMainActions(state);
  return legal.length === 0;
}

function listMainActions(state: DuelGameState): DuelGameAction[] {
  const actions: DuelGameAction[] = [];
  const seat = currentSeat(state);

  // take tokens: enumerate legal lines (small board)
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (!state.board[i] || state.board[i] === 'gold') continue;
    if (isLegalTakeLine(state.board, [i])) {
      actions.push({ type: 'takeTokens', indices: [i] });
    }
  }
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = i + 1; j < BOARD_SIZE; j++) {
      if (isLegalTakeLine(state.board, [i, j])) {
        actions.push({ type: 'takeTokens', indices: [i, j] });
      }
      for (let k = j + 1; k < BOARD_SIZE; k++) {
        if (isLegalTakeLine(state.board, [i, j, k])) {
          actions.push({ type: 'takeTokens', indices: [i, j, k] });
        }
      }
    }
  }

  // reserve
  if (seat.reserved.length < 3) {
    const goldIndices = state.board
      .map((t, idx) => (t === 'gold' ? idx : -1))
      .filter((idx) => idx >= 0);
    for (const goldIndex of goldIndices) {
      for (const level of [1, 2, 3] as const) {
        const row = displayRow(state, level);
        for (const card of row) {
          if (card) {
            actions.push({
              type: 'reserve',
              goldIndex,
              source: { kind: 'pyramid', cardId: card.id, level },
            });
          }
        }
        if (deckOf(state, level).length > 0) {
          actions.push({
            type: 'reserve',
            goldIndex,
            source: { kind: 'deck', level },
          });
        }
      }
    }
  }

  // buy
  for (const level of [1, 2, 3] as const) {
    for (const card of displayRow(state, level)) {
      if (
        card &&
        canBuyCard(state, card) &&
        canAffordDuelCard(card, seat.hand, seat.bonuses)
      ) {
        actions.push({
          type: 'buy',
          cardId: card.id,
          from: 'pyramid',
          level,
        });
      }
    }
  }
  for (const card of seat.reserved) {
    if (
      canBuyCard(state, card) &&
      canAffordDuelCard(card, seat.hand, seat.bonuses)
    ) {
      actions.push({ type: 'buy', cardId: card.id, from: 'reserved' });
    }
  }

  return actions;
}

function canBuyCard(state: DuelGameState, card: DuelJewelCard): boolean {
  if (card.bonus === 'associate') {
    const seat = currentSeat(state);
    return seat.purchased.some((c) => c.effectiveBonus !== null);
  }
  return true;
}

export function listLegalActions(state: DuelGameState): DuelGameAction[] {
  if (state.phase === 'done') return [];

  if (state.phase === 'chooseAssociate') {
    const seat = currentSeat(state);
    const colors = new Set(
      seat.purchased
        .map((c) => c.effectiveBonus)
        .filter((c): c is DuelGem => c !== null),
    );
    return [...colors].map((color) => ({
      type: 'chooseAssociate' as const,
      color,
    }));
  }

  if (state.phase === 'chooseSteal') {
    const opp = opponentSeat(state);
    const tokens: Exclude<DuelToken, 'gold'>[] = [
      'emerald',
      'sapphire',
      'ruby',
      'diamond',
      'onyx',
      'pearl',
    ];
    return tokens
      .filter((t) => opp.hand[t] > 0)
      .map((token) => ({ type: 'chooseSteal' as const, token }));
  }

  if (state.phase === 'chooseTakeMatching') {
    const color = state.pendingTakeMatchingColor!;
    const picks = state.board
      .map((t, i) => (t === color ? i : -1))
      .filter((i) => i >= 0)
      .map((boardIndex) => ({
        type: 'chooseTakeMatching' as const,
        boardIndex,
      }));
    return picks.length > 0
      ? picks
      : [{ type: 'skipTakeMatching' }];
  }

  if (state.phase === 'chooseRoyal') {
    return state.royals.map((r) => ({
      type: 'claimRoyal' as const,
      royalId: r.id,
    }));
  }

  if (state.phase === 'discardTokens') {
    const seat = currentSeat(state);
    const tokens: DuelToken[] = [
      'emerald',
      'sapphire',
      'ruby',
      'diamond',
      'onyx',
      'pearl',
      'gold',
    ];
    return tokens
      .filter((t) => seat.hand[t] > 0)
      .map((t) => ({ type: 'discard' as const, tokens: [t] }));
  }

  if (state.phase === 'optional' || state.phase === 'main' || state.phase === 'aiBusy') {
    const actions: DuelGameAction[] = [];
    const seat = currentSeat(state);

    // Optional: privilege (can be used even after moving to "main" conceptually —
    // we keep optional until main is taken; privilege only before replenish/main)
    if (
      (state.phase === 'optional' || state.phase === 'aiBusy') &&
      !state.usedReplenishThisTurn &&
      seat.privileges > 0
    ) {
      for (let i = 0; i < BOARD_SIZE; i++) {
        const t = state.board[i];
        if (t && t !== 'gold') {
          actions.push({ type: 'usePrivilege', boardIndex: i });
        }
      }
    }

    if (
      (state.phase === 'optional' || state.phase === 'aiBusy') &&
      !state.usedReplenishThisTurn &&
      state.bag.length > 0
    ) {
      actions.push({ type: 'replenish' });
    }

    // Main actions: allowed in optional (skipping optionals) or main/aiBusy
    if (!mustReplenish(state) || state.usedReplenishThisTurn) {
      actions.push(...listMainActions(state));
    } else if (state.bag.length > 0) {
      // Forced replenish path — only replenish until done
      if (!state.usedReplenishThisTurn) {
        actions.push({ type: 'replenish' });
      } else {
        actions.push(...listMainActions(state));
      }
    }

    return actions;
  }

  return [];
}

export function applyAction(
  state: DuelGameState,
  action: DuelGameAction,
): DuelGameState {
  const next = cloneState(state);
  const seat = currentSeat(next);

  switch (action.type) {
    case 'usePrivilege': {
      if (seat.privileges <= 0) return state;
      const token = next.board[action.boardIndex];
      if (!token || token === 'gold') return state;
      next.board[action.boardIndex] = null;
      seat.hand[token] += 1;
      seat.privileges -= 1;
      next.privilegesSupply += 1;
      next.usedPrivilegeThisTurn = true;
      next.log.push({ kind: 'privilege', seat: seat.id });
      next.phase = 'optional';
      return next;
    }
    case 'replenish': {
      if (next.bag.length === 0 || next.usedReplenishThisTurn) return state;
      const shuffled = shuffle(next.bag);
      const placed = placeTokensOnBoard(next.board, shuffled);
      next.board = placed.board;
      next.bag = placed.bag;
      next.usedReplenishThisTurn = true;
      givePrivilege(next, 1 - next.currentSeat);
      next.log.push({ kind: 'replenish', seat: seat.id });
      next.phase = 'optional';
      return next;
    }
    case 'takeTokens': {
      if (!isLegalTakeLine(next.board, action.indices)) return state;
      const tax = takeGivesPrivilegeTax(next.board, action.indices);
      for (const i of action.indices) {
        const t = next.board[i]!;
        seat.hand[t] += 1;
        next.board[i] = null;
      }
      if (tax) givePrivilege(next, 1 - next.currentSeat);
      next.log.push({
        kind: 'take',
        seat: seat.id,
        count: action.indices.length,
      });
      return afterAbilityPipeline(next);
    }
    case 'reserve': {
      if (seat.reserved.length >= 3) return state;
      if (next.board[action.goldIndex] !== 'gold') return state;
      next.board[action.goldIndex] = null;
      seat.hand.gold += 1;

      if (action.source.kind === 'pyramid') {
        const found = findPyramidCard(next, action.source.cardId);
        if (!found) return state;
        seat.reserved.push(found.card);
        refillSlot(next, found.level, found.index);
      } else {
        const deck = deckOf(next, action.source.level);
        if (deck.length === 0) return state;
        const [top, ...rest] = deck;
        seat.reserved.push(top);
        setDeck(next, action.source.level, rest);
      }
      next.log.push({ kind: 'reserve', seat: seat.id });
      return afterAbilityPipeline(next);
    }
    case 'buy': {
      let card: DuelJewelCard | null = null;
      let fromReserved = false;
      let pyramidSlot: { level: 1 | 2 | 3; index: number } | null = null;

      if (action.from === 'reserved') {
        const idx = seat.reserved.findIndex((c) => c.id === action.cardId);
        if (idx < 0) return state;
        card = seat.reserved[idx];
        fromReserved = true;
        seat.reserved = [
          ...seat.reserved.slice(0, idx),
          ...seat.reserved.slice(idx + 1),
        ];
      } else {
        const found = findPyramidCard(next, action.cardId);
        if (!found) return state;
        card = found.card;
        pyramidSlot = { level: found.level, index: found.index };
      }

      if (!canBuyCard(next, card)) return state;
      if (!canAffordDuelCard(card, seat.hand, seat.bonuses)) return state;

      const paid = payForDuelCard(card, seat.hand, seat.bonuses);
      seat.hand = paid.hand;
      next.bag.push(...paid.spent);

      if (pyramidSlot) {
        refillSlot(next, pyramidSlot.level, pyramidSlot.index);
      }

      if (card.bonus === 'associate') {
        next.pendingAssociateCardId = card.id;
        // Temporarily store card without effective bonus until chosen
        const owned: OwnedDuelCard = { ...card, effectiveBonus: null };
        seat.purchased.push(owned);
        seat.prestige += card.prestige;
        const prevCrowns = seat.crowns;
        seat.crowns += card.crowns;
        const crossed3 = prevCrowns < 3 && seat.crowns >= 3;
        const crossed6 = prevCrowns < 6 && seat.crowns >= 6;
        if (crossed3) next.pendingRoyalSlots += 1;
        if (crossed6) next.pendingRoyalSlots += 1;
        // ability (e.g. extraTurn) after associate color chosen
        next.log.push({
          kind: 'buy',
          seat: seat.id,
          prestige: card.prestige,
        });
        void fromReserved;
        return afterAbilityPipeline(next);
      }

      const effective =
        card.bonus === null ? null : (card.bonus as DuelGem);
      addPurchased(next, card, effective);
      next.log.push({
        kind: 'buy',
        seat: seat.id,
        prestige: card.prestige,
      });
      return afterAbilityPipeline(next);
    }
    case 'chooseAssociate': {
      const cardId = next.pendingAssociateCardId;
      if (!cardId) return state;
      const owned = seat.purchased.find((c) => c.id === cardId);
      if (!owned) return state;
      owned.effectiveBonus = action.color;
      if (owned.bonusCount > 0) {
        seat.bonuses[action.color] += owned.bonusCount;
      }
      next.pendingAssociateCardId = null;
      applyCardAbility(next, owned);
      return afterAbilityPipeline(next);
    }
    case 'chooseSteal': {
      if (!next.pendingSteal) return state;
      const opp = opponentSeat(next);
      if (opp.hand[action.token] <= 0) return state;
      opp.hand[action.token] -= 1;
      seat.hand[action.token] += 1;
      next.pendingSteal = false;
      return afterAbilityPipeline(next);
    }
    case 'chooseTakeMatching': {
      const color = next.pendingTakeMatchingColor;
      if (!color) return state;
      if (next.board[action.boardIndex] !== color) return state;
      next.board[action.boardIndex] = null;
      seat.hand[color] += 1;
      next.pendingTakeMatchingColor = null;
      return afterAbilityPipeline(next);
    }
    case 'skipTakeMatching': {
      next.pendingTakeMatchingColor = null;
      return afterAbilityPipeline(next);
    }
    case 'claimRoyal': {
      if (next.pendingRoyalSlots <= 0) return state;
      const idx = next.royals.findIndex((r) => r.id === action.royalId);
      if (idx < 0) return state;
      const [royal] = next.royals.splice(idx, 1);
      seat.royals.push(royal);
      seat.prestige += royal.prestige;
      if (royal.ability === 'extraTurn') next.extraTurnPending = true;
      else if (royal.ability === 'privilege') {
        givePrivilege(next, next.currentSeat);
      } else if (royal.ability === 'steal') {
        next.pendingSteal = true;
      }
      next.pendingRoyalSlots -= 1;
      next.log.push({ kind: 'royal', seat: seat.id });
      return afterAbilityPipeline(next);
    }
    case 'discard': {
      if (next.phase !== 'discardTokens') return state;
      for (const t of action.tokens) {
        if (seat.hand[t] <= 0) return state;
        seat.hand[t] -= 1;
        next.bag.push(t);
        next.discardNeeded -= 1;
      }
      next.log.push({ kind: 'discard', seat: seat.id });
      if (next.discardNeeded <= 0) {
        next.discardNeeded = 0;
        return finishTurn(next);
      }
      return next;
    }
    default:
      return state;
  }
}

/** After optional actions, UI may treat phase as main — no-op helper. */
export function beginMainPhase(state: DuelGameState): DuelGameState {
  if (state.phase !== 'optional') return state;
  const next = cloneState(state);
  next.phase = 'main';
  return next;
}
