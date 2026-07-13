import noblesData from '@/data/nobles.json';
import setupTable from '@/data/setup-table.json';
import type { GemCounts, NobleRequirement, SetupConfig } from '@/types';
import {
  LEVEL1_CARDS,
  LEVEL2_CARDS,
  LEVEL3_CARDS,
  drawDisplay,
  emptyBonuses,
  payForCard,
  shuffle,
  type SoloCard,
} from '@/data/solo-cards';
import type {
  Color,
  CreateGameOptions,
  GameAction,
  GameState,
  GemKey,
  LogEntry,
  Seat,
  SeatNameKey,
} from './types';

export const COLORS: Color[] = [
  'emerald',
  'sapphire',
  'ruby',
  'diamond',
  'onyx',
];

const noblesAll = noblesData as NobleRequirement[];
const setups = setupTable as SetupConfig[];

const AI_NAME_KEYS: SeatNameKey[] = [
  'marco',
  'lucrezia',
  'cosimo',
  'isabella',
];

export function emptyHand(): GemCounts {
  return {
    emerald: 0,
    sapphire: 0,
    ruby: 0,
    diamond: 0,
    onyx: 0,
    gold: 0,
  };
}

export function tokenCount(g: GemCounts): number {
  return g.emerald + g.sapphire + g.ruby + g.diamond + g.onyx + g.gold;
}

export function refill(
  row: SoloCard[],
  deck: SoloCard[],
): { row: SoloCard[]; deck: SoloCard[] } {
  const next = [...row];
  let d = deck;
  while (next.length < 4 && d.length > 0) {
    next.push(d[0]);
    d = d.slice(1);
  }
  return { row: next, deck: d };
}

function setupFor(players: number): SetupConfig {
  return setups.find((s) => s.players === players) ?? setups[0];
}

export function createGame(opts: CreateGameOptions): GameState {
  const cfg = setupFor(opts.playerCount);
  const humanSeat = Math.max(
    0,
    Math.min(opts.playerCount - 1, opts.humanSeat),
  );
  const d1s = shuffle(LEVEL1_CARDS);
  const d2s = shuffle(LEVEL2_CARDS);
  const d3s = shuffle(LEVEL3_CARDS);
  const a = drawDisplay(d1s, 4);
  const b = drawDisplay(d2s, 4);
  const c = drawDisplay(d3s, 4);

  const seats: Seat[] = Array.from({ length: opts.playerCount }, (_, id) => ({
    id,
    isHuman: id === humanSeat,
    nameKey: 'you' as SeatNameKey,
    hand: emptyHand(),
    bonuses: emptyBonuses(),
    prestige: 0,
    reserved: [],
    cardCount: 0,
  }));

  let aiName = 0;
  for (const seat of seats) {
    if (seat.isHuman) {
      seat.nameKey = 'you';
    } else {
      seat.nameKey = AI_NAME_KEYS[aiName % AI_NAME_KEYS.length];
      aiName += 1;
    }
  }

  const bank: GemCounts = {
    emerald: cfg.gemsPerColor,
    sapphire: cfg.gemsPerColor,
    ruby: cfg.gemsPerColor,
    diamond: cfg.gemsPerColor,
    onyx: cfg.gemsPerColor,
    gold: cfg.gold,
  };

  const humanFirst = seats[0].isHuman;

  return {
    seats,
    bank,
    l1: a.display,
    l2: b.display,
    l3: c.display,
    d1: a.deck,
    d2: b.deck,
    d3: c.deck,
    nobles: shuffle(noblesAll).slice(0, cfg.nobles),
    currentSeat: 0,
    phase: humanFirst ? 'human' : 'aiBusy',
    pendingNobles: [],
    discardNeeded: 0,
    endingRound: false,
    winnerIds: [],
    log: [],
    turn: 1,
    busyNonce: humanFirst ? 0 : 1,
    difficulty: opts.difficulty,
    pendingTake: [],
  };
}

export function currentSeat(state: GameState): Seat {
  return state.seats[state.currentSeat];
}

export function eligibleNobles(
  bonuses: Omit<GemCounts, 'gold'>,
  nobles: NobleRequirement[],
): NobleRequirement[] {
  return nobles.filter((n) =>
    COLORS.every((c) => bonuses[c] >= n.requirements[c]),
  );
}

export function findCard(
  state: GameState,
  cardId: string,
): { card: SoloCard; level: 1 | 2 | 3 | 'reserved'; seatIndex?: number } | null {
  if (state.l1.some((c) => c.id === cardId)) {
    return { card: state.l1.find((c) => c.id === cardId)!, level: 1 };
  }
  if (state.l2.some((c) => c.id === cardId)) {
    return { card: state.l2.find((c) => c.id === cardId)!, level: 2 };
  }
  if (state.l3.some((c) => c.id === cardId)) {
    return { card: state.l3.find((c) => c.id === cardId)!, level: 3 };
  }
  for (const seat of state.seats) {
    const card = seat.reserved.find((c) => c.id === cardId);
    if (card) return { card, level: 'reserved', seatIndex: seat.id };
  }
  return null;
}

function pushLog(state: GameState, entry: LogEntry): LogEntry[] {
  return [entry, ...state.log].slice(0, 24);
}

function removeFromDisplay(
  state: GameState,
  cardId: string,
  level: 1 | 2 | 3,
): GameState {
  let { l1, l2, l3, d1, d2, d3 } = state;
  if (level === 1) {
    l1 = l1.filter((c) => c.id !== cardId);
    ({ row: l1, deck: d1 } = refill(l1, d1));
  } else if (level === 2) {
    l2 = l2.filter((c) => c.id !== cardId);
    ({ row: l2, deck: d2 } = refill(l2, d2));
  } else {
    l3 = l3.filter((c) => c.id !== cardId);
    ({ row: l3, deck: d3 } = refill(l3, d3));
  }
  return { ...state, l1, l2, l3, d1, d2, d3 };
}

function updateSeat(state: GameState, seat: Seat): GameState {
  const seats = state.seats.map((s) => (s.id === seat.id ? seat : s));
  return { ...state, seats };
}

function isValidTake(colors: Color[], bank: GemCounts): boolean {
  if (colors.length === 2) {
    if (colors[0] !== colors[1]) return false;
    return bank[colors[0]] >= 4;
  }
  if (colors.length === 3) {
    if (new Set(colors).size !== 3) return false;
    return colors.every((c) => bank[c] >= 1);
  }
  return false;
}

/** Enumerate legal main-turn actions for the current seat (not discard/noble). */
export function listLegalActions(state: GameState): GameAction[] {
  if (state.phase !== 'human' && state.phase !== 'aiBusy') return [];
  const seat = currentSeat(state);
  const actions: GameAction[] = [];

  // Take 2 same
  for (const c of COLORS) {
    if (state.bank[c] >= 4) {
      actions.push({ type: 'take', colors: [c, c] });
    }
  }

  // Take 3 different
  for (let i = 0; i < COLORS.length; i++) {
    for (let j = i + 1; j < COLORS.length; j++) {
      for (let k = j + 1; k < COLORS.length; k++) {
        const colors: Color[] = [COLORS[i], COLORS[j], COLORS[k]];
        if (colors.every((c) => state.bank[c] >= 1)) {
          actions.push({ type: 'take', colors });
        }
      }
    }
  }

  const tryBuy = (card: SoloCard, from: 'display' | 'reserved', level?: 1 | 2 | 3) => {
    if (payForCard(seat.hand, card.cost, seat.bonuses)) {
      actions.push({ type: 'buy', cardId: card.id, from, level });
    }
  };

  for (const card of state.l1) tryBuy(card, 'display', 1);
  for (const card of state.l2) tryBuy(card, 'display', 2);
  for (const card of state.l3) tryBuy(card, 'display', 3);
  for (const card of seat.reserved) tryBuy(card, 'reserved');

  if (seat.reserved.length < 3) {
    for (const card of state.l1) {
      actions.push({ type: 'reserve', cardId: card.id, level: 1 });
    }
    for (const card of state.l2) {
      actions.push({ type: 'reserve', cardId: card.id, level: 2 });
    }
    for (const card of state.l3) {
      actions.push({ type: 'reserve', cardId: card.id, level: 3 });
    }
  }

  return actions;
}

export function listDiscardActions(state: GameState): GameAction[] {
  if (state.phase !== 'discardGems' || state.discardNeeded <= 0) return [];
  const seat = currentSeat(state);
  const actions: GameAction[] = [];
  const keys: GemKey[] = [...COLORS, 'gold'];
  // Generate combinations of discardNeeded gems from hand
  const available: GemKey[] = [];
  for (const k of keys) {
    for (let i = 0; i < seat.hand[k]; i++) available.push(k);
  }
  if (available.length < state.discardNeeded) return [];

  const seen = new Set<string>();
  const pick = (start: number, chosen: GemKey[]) => {
    if (chosen.length === state.discardNeeded) {
      const key = [...chosen].sort().join(',');
      if (!seen.has(key)) {
        seen.add(key);
        actions.push({ type: 'discard', gems: [...chosen] });
      }
      return;
    }
    for (let i = start; i < available.length; i++) {
      chosen.push(available[i]);
      pick(i + 1, chosen);
      chosen.pop();
    }
  };
  pick(0, []);
  return actions;
}

export function resolveWinners(state: GameState): number[] {
  let bestPrestige = -1;
  for (const s of state.seats) {
    if (s.prestige > bestPrestige) bestPrestige = s.prestige;
  }
  const tied = state.seats.filter((s) => s.prestige === bestPrestige);
  if (tied.length === 1) return [tied[0].id];

  let fewestCards = Infinity;
  for (const s of tied) {
    if (s.cardCount < fewestCards) fewestCards = s.cardCount;
  }
  return tied.filter((s) => s.cardCount === fewestCards).map((s) => s.id);
}

/**
 * After a main action (and discard/noble resolution), advance the turn
 * or enter discard / noble / done phases.
 */
function afterMainAction(state: GameState): GameState {
  const seat = currentSeat(state);
  const over = tokenCount(seat.hand) - 10;
  if (over > 0) {
    return {
      ...state,
      phase: 'discardGems',
      discardNeeded: over,
      pendingTake: [],
    };
  }
  return afterTokensOk(state);
}

function afterTokensOk(state: GameState): GameState {
  const seat = currentSeat(state);
  const eligible = eligibleNobles(seat.bonuses, state.nobles);
  if (eligible.length === 1) {
    return applyClaimNoble(
      { ...state, pendingNobles: eligible, phase: 'chooseNoble' },
      eligible[0].id,
    );
  }
  if (eligible.length > 1) {
    // AI auto-picks best later via chooseAiNoble; human chooses
    if (!seat.isHuman) {
      const best = pickBestNoble(seat, eligible);
      return applyClaimNoble(
        { ...state, pendingNobles: eligible, phase: 'chooseNoble' },
        best.id,
      );
    }
    return {
      ...state,
      phase: 'chooseNoble',
      pendingNobles: eligible,
      pendingTake: [],
    };
  }
  return advanceTurn(state);
}

function pickBestNoble(
  _seat: Seat,
  nobles: NobleRequirement[],
): NobleRequirement {
  return [...nobles].sort((a, b) => a.id - b.id)[0] ?? nobles[0];
}

function advanceTurn(state: GameState): GameState {
  let next = { ...state, pendingTake: [], pendingNobles: [], discardNeeded: 0 };

  if (next.seats.some((s) => s.prestige >= 15)) {
    next = { ...next, endingRound: true };
  }

  const nextSeat = (next.currentSeat + 1) % next.seats.length;
  const wrapped = nextSeat === 0;

  if (next.endingRound && wrapped) {
    return {
      ...next,
      phase: 'done',
      winnerIds: resolveWinners(next),
      log: pushLog(next, { kind: 'gameOver' }),
      currentSeat: nextSeat,
    };
  }

  const seat = next.seats[nextSeat];
  return {
    ...next,
    currentSeat: nextSeat,
    turn: wrapped ? next.turn + 1 : next.turn,
    phase: seat.isHuman ? 'human' : 'aiBusy',
    busyNonce: seat.isHuman ? next.busyNonce : next.busyNonce + 1,
  };
}

function applyClaimNoble(state: GameState, nobleId: number): GameState {
  const noble = state.pendingNobles.find((n) => n.id === nobleId)
    ?? state.nobles.find((n) => n.id === nobleId);
  if (!noble) return advanceTurn(state);

  const seat = currentSeat(state);
  if (!eligibleNobles(seat.bonuses, [noble]).length) return advanceTurn(state);

  const updated: Seat = {
    ...seat,
    prestige: seat.prestige + 3,
  };
  let next = updateSeat(state, updated);
  next = {
    ...next,
    nobles: next.nobles.filter((n) => n.id !== noble.id),
    pendingNobles: [],
    log: pushLog(next, { kind: 'noble', seat: seat.id }),
  };
  return advanceTurn(next);
}

function applyTake(state: GameState, colors: Color[]): GameState | null {
  if (!isValidTake(colors, state.bank)) return null;
  const seat = currentSeat(state);
  const hand = { ...seat.hand };
  const bank = { ...state.bank };
  for (const c of colors) {
    hand[c] += 1;
    bank[c] -= 1;
  }
  const entry: LogEntry =
    colors.length === 2
      ? { kind: 'take2', seat: seat.id, color: colors[0] }
      : { kind: 'take3', seat: seat.id };

  let next = updateSeat(
    { ...state, bank, log: pushLog(state, entry), pendingTake: [] },
    { ...seat, hand },
  );
  return afterMainAction(next);
}

function applyBuy(
  state: GameState,
  cardId: string,
  from: 'display' | 'reserved',
  level?: 1 | 2 | 3,
): GameState | null {
  const seat = currentSeat(state);
  let card: SoloCard | undefined;
  let buyLevel = level;

  if (from === 'reserved') {
    card = seat.reserved.find((c) => c.id === cardId);
  } else if (buyLevel === 1) {
    card = state.l1.find((c) => c.id === cardId);
  } else if (buyLevel === 2) {
    card = state.l2.find((c) => c.id === cardId);
  } else if (buyLevel === 3) {
    card = state.l3.find((c) => c.id === cardId);
  } else {
    const found = findCard(state, cardId);
    if (!found || found.level === 'reserved') return null;
    card = found.card;
    buyLevel = found.level;
  }
  if (!card) return null;

  const paid = payForCard(seat.hand, card.cost, seat.bonuses);
  if (!paid) return null;

  const bank = { ...state.bank };
  for (const c of [...COLORS, 'gold'] as const) {
    bank[c] += seat.hand[c] - paid[c];
  }

  const bonuses = {
    ...seat.bonuses,
    [card.bonus]: seat.bonuses[card.bonus] + 1,
  };
  let reserved = seat.reserved;
  let next: GameState = { ...state, bank };

  if (from === 'reserved') {
    reserved = reserved.filter((c) => c.id !== card.id);
  } else if (buyLevel) {
    next = removeFromDisplay(next, card.id, buyLevel);
  }

  next = updateSeat(next, {
    ...seat,
    hand: paid,
    bonuses,
    prestige: seat.prestige + card.points,
    reserved,
    cardCount: seat.cardCount + 1,
  });
  next = {
    ...next,
    log: pushLog(next, {
      kind: 'buy',
      seat: seat.id,
      points: card.points,
      bonus: card.bonus,
    }),
    pendingTake: [],
  };
  return afterMainAction(next);
}

function applyReserve(
  state: GameState,
  cardId: string,
  level: 1 | 2 | 3,
): GameState | null {
  const seat = currentSeat(state);
  if (seat.reserved.length >= 3) return null;
  const row = level === 1 ? state.l1 : level === 2 ? state.l2 : state.l3;
  const card = row.find((c) => c.id === cardId);
  if (!card) return null;

  let next = removeFromDisplay(state, card.id, level);
  let bank = { ...next.bank };
  let hand = { ...seat.hand };
  if (bank.gold > 0) {
    bank = { ...bank, gold: bank.gold - 1 };
    hand = { ...hand, gold: hand.gold + 1 };
  }

  next = {
    ...updateSeat(next, {
      ...seat,
      hand,
      reserved: [...seat.reserved, card],
    }),
    bank,
    log: pushLog(next, { kind: 'reserve', seat: seat.id }),
    pendingTake: [],
  };
  return afterMainAction(next);
}

function applyDiscard(state: GameState, gems: GemKey[]): GameState | null {
  if (state.phase !== 'discardGems') return null;
  if (gems.length !== state.discardNeeded) return null;
  const seat = currentSeat(state);
  const hand = { ...seat.hand };
  const bank = { ...state.bank };
  for (const g of gems) {
    if (hand[g] < 1) return null;
    hand[g] -= 1;
    bank[g] += 1;
  }
  if (tokenCount(hand) > 10) return null;

  let next = updateSeat(
    {
      ...state,
      bank,
      discardNeeded: 0,
      log: pushLog(state, { kind: 'discard', seat: seat.id }),
    },
    { ...seat, hand },
  );
  return afterTokensOk(next);
}

/** Apply a fully-formed action. Returns null if illegal. */
export function applyAction(
  state: GameState,
  action: GameAction,
): GameState | null {
  if (state.phase === 'done') return null;

  if (action.type === 'claimNoble') {
    if (state.phase !== 'chooseNoble') return null;
    return applyClaimNoble(state, action.nobleId);
  }

  if (action.type === 'discard') {
    return applyDiscard(state, action.gems);
  }

  if (state.phase !== 'human' && state.phase !== 'aiBusy') return null;

  if (action.type === 'take') return applyTake(state, action.colors);
  if (action.type === 'buy') {
    return applyBuy(state, action.cardId, action.from, action.level);
  }
  if (action.type === 'reserve') {
    return applyReserve(state, action.cardId, action.level);
  }
  return null;
}

/** Auto-discard for AI: prefer returning colors least useful for near-term buys. */
export function autoDiscard(state: GameState): GameAction | null {
  const options = listDiscardActions(state);
  if (options.length === 0) return null;
  const seat = currentSeat(state);
  let best: GameAction | null = null;
  let bestScore = -Infinity;
  for (const opt of options) {
    if (opt.type !== 'discard') continue;
    let score = 0;
    for (const g of opt.gems) {
      if (g === 'gold') score -= 8;
      else {
        // Prefer discarding surplus beyond what board cards need
        const need = maxBoardNeed(state, seat, g);
        const after = seat.hand[g] - opt.gems.filter((x) => x === g).length;
        if (after >= need) score += 3;
        else score -= 2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = opt;
    }
  }
  return best ?? options[0];
}

function maxBoardNeed(state: GameState, seat: Seat, color: Color): number {
  let max = 0;
  const cards = [...state.l1, ...state.l2, ...state.l3, ...seat.reserved];
  for (const card of cards) {
    const need = Math.max(0, card.cost[color] - seat.bonuses[color]);
    if (need > max) max = need;
  }
  return max;
}

export function pickBestNobleForAi(
  seat: Seat,
  nobles: NobleRequirement[],
): NobleRequirement {
  return pickBestNoble(seat, nobles);
}

/** Human UI: set pending take colors without committing. */
export function setPendingTake(state: GameState, pending: Color[]): GameState {
  return { ...state, pendingTake: pending };
}

/** Rare soft-lock escape when an AI has no legal action. */
export function passTurn(state: GameState): GameState {
  return advanceTurn({
    ...state,
    pendingTake: [],
    pendingNobles: [],
    discardNeeded: 0,
  });
}
