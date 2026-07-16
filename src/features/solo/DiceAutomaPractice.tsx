import { useCallback, useEffect, useRef, useState } from 'react';
import noblesData from '@/data/nobles.json';
import type { GemCounts, NobleRequirement } from '@/types';
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
import { useGemLabels } from '@/i18n/useGemLabels';
import { useI18n } from '@/i18n/I18nProvider';
import { gems } from '@/lib/assets';
import { pushCappedHistory } from '@/lib/practiceHistory';
import { loadSession, saveSession, clearSession } from '@/lib/practiceSession';
import { discardNeeded } from '@/lib/splendorRules';
import { PracticeShell, SoloActionLog, TokenRow, ReservedHand } from './shared';
import {
  PracticeCoaching,
  buildDiceCoaching,
} from './PracticeCoaching';
import { usePurchaseFx } from './PurchaseFx';
import { useDiceFx } from './DiceFx';
import {
  BoardTable,
  BuyableCard,
  HandDropZone,
  NobleTile,
  ReserveDropZone,
  getTakeRejectionReason,
  isTakeComplete,
  type TakeColor,
} from './Board';
import { useSoloToast } from './SoloToast';
import { useSoloHints } from './SoloHints';
import { useBankTakeFx } from './BankTakeFx';
import {
  SoloPracticeTierPicker,
  useSoloPracticeTier,
} from './PracticeTierPicker';
import { rollPracticeDie } from './practiceTier';

const COLORS = ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'] as const;
const noblesAll = noblesData as NobleRequirement[];

type Phase = 'player' | 'discardGems' | 'chooseNoble' | 'busy' | 'done';

type State = {
  bank: GemCounts;
  hand: GemCounts;
  bonuses: Omit<GemCounts, 'gold'>;
  prestige: number;
  reserved: SoloCard[];
  autoBonuses: Omit<GemCounts, 'gold'>;
  autoGold: number;
  autoPrestige: number;
  l1: SoloCard[];
  l2: SoloCard[];
  l3: SoloCard[];
  d1: SoloCard[];
  d2: SoloCard[];
  d3: SoloCard[];
  nobles: NobleRequirement[];
  phase: Phase;
  winner: 'player' | 'automa' | 'tie' | null;
  log: string[];
  lastDice: number | null;
  turn: number;
  pending: TakeColor[];
  busyNonce: number;
  discardNeeded: number;
  pendingNobles: NobleRequirement[];
  stats: {
    takes: number;
    buys: number;
    playerNobles: number;
    autoNobles: number;
  };
};

function refill(
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

function createGame(): State {
  const d1s = shuffle(LEVEL1_CARDS);
  const d2s = shuffle(LEVEL2_CARDS);
  const d3s = shuffle(LEVEL3_CARDS);
  const a = drawDisplay(d1s, 4);
  const b = drawDisplay(d2s, 4);
  const c = drawDisplay(d3s, 4);
  return {
    bank: {
      emerald: 4,
      sapphire: 4,
      ruby: 4,
      diamond: 4,
      onyx: 4,
      gold: 5,
    },
    hand: { emerald: 0, sapphire: 0, ruby: 0, diamond: 0, onyx: 0, gold: 0 },
    bonuses: emptyBonuses(),
    prestige: 0,
    reserved: [],
    autoBonuses: emptyBonuses(),
    autoGold: 0,
    autoPrestige: 0,
    l1: a.display,
    l2: b.display,
    l3: c.display,
    d1: a.deck,
    d2: b.deck,
    d3: c.deck,
    nobles: shuffle(noblesAll).slice(0, 3),
    phase: 'player',
    winner: null,
    log: [],
    lastDice: null,
    turn: 1,
    pending: [],
    busyNonce: 0,
    discardNeeded: 0,
    pendingNobles: [],
    stats: { takes: 0, buys: 0, playerNobles: 0, autoNobles: 0 },
  };
}

function eligibleNobles(
  bonuses: Omit<GemCounts, 'gold'>,
  nobles: NobleRequirement[],
): NobleRequirement[] {
  return nobles.filter((n) =>
    COLORS.every((c) => bonuses[c] >= n.requirements[c]),
  );
}

function claimNoble(
  bonuses: Omit<GemCounts, 'gold'>,
  nobles: NobleRequirement[],
): { noble: NobleRequirement | null; rest: NobleRequirement[] } {
  const match = eligibleNobles(bonuses, nobles)[0] ?? null;
  if (!match) return { noble: null, rest: nobles };
  return { noble: match, rest: nobles.filter((n) => n.id !== match.id) };
}

function automaAfford(
  card: SoloCard,
  bonuses: Omit<GemCounts, 'gold'>,
  gold: number,
): boolean {
  const fakeHand: GemCounts = {
    emerald: 0,
    sapphire: 0,
    ruby: 0,
    diamond: 0,
    onyx: 0,
    gold,
  };
  return payForCard(fakeHand, card.cost, bonuses) !== null;
}

function automaPay(
  card: SoloCard,
  bonuses: Omit<GemCounts, 'gold'>,
  gold: number,
): number | null {
  const fakeHand: GemCounts = {
    emerald: 0,
    sapphire: 0,
    ruby: 0,
    diamond: 0,
    onyx: 0,
    gold,
  };
  const paid = payForCard(fakeHand, card.cost, bonuses);
  return paid ? paid.gold : null;
}

function applyTake(s: State, pick: TakeColor[], logLine: string): State {
  const hand = { ...s.hand };
  const bank = { ...s.bank };
  for (const c of pick) {
    hand[c] += 1;
    bank[c] -= 1;
  }
  return {
    ...s,
    hand,
    bank,
    pending: [],
    stats: { ...s.stats, takes: s.stats.takes + 1 },
    log: [logLine, ...s.log].slice(0, 14),
  };
}

function findAutomaPurchase(
  s: State,
  tier: 'easy' | 'normal' | 'hard' = 'normal',
): { card: SoloCard; level: 1 | 2 | 3 } | null {
  // Easy: prefer lower levels (weaker). Hard/normal: L3→L1; hard picks highest points among affordable.
  const rows: { level: 1 | 2 | 3; cards: SoloCard[] }[] =
    tier === 'easy'
      ? [
          { level: 1, cards: s.l1 },
          { level: 2, cards: s.l2 },
          { level: 3, cards: s.l3 },
        ]
      : [
          { level: 3, cards: s.l3 },
          { level: 2, cards: s.l2 },
          { level: 1, cards: s.l1 },
        ];

  if (tier === 'hard') {
    let best: { card: SoloCard; level: 1 | 2 | 3 } | null = null;
    for (const row of rows) {
      for (const card of row.cards) {
        if (!automaAfford(card, s.autoBonuses, s.autoGold)) continue;
        if (
          !best ||
          card.points > best.card.points ||
          (card.points === best.card.points && card.level > best.card.level)
        ) {
          best = { card, level: row.level };
        }
      }
    }
    return best;
  }

  for (const row of rows) {
    for (const card of row.cards) {
      if (automaAfford(card, s.autoBonuses, s.autoGold)) {
        return { card, level: row.level };
      }
    }
  }
  return null;
}

function applyAutomaBuy(
  s: State,
  card: SoloCard,
  buyLevel: 1 | 2 | 3,
  logLine: string,
  nobleLogLine: string,
): State {
  const leftGold = automaPay(card, s.autoBonuses, s.autoGold);
  if (leftGold === null) return s;

  const spentGold = s.autoGold - leftGold;
  let { l1, l2, l3, d1, d2, d3, autoBonuses, autoGold, autoPrestige, bank, nobles, log } =
    s;

  autoGold = leftGold;
  bank = { ...bank, gold: bank.gold + spentGold };
  autoBonuses = {
    ...autoBonuses,
    [card.bonus]: autoBonuses[card.bonus] + 1,
  };
  autoPrestige += card.points;

  if (buyLevel === 1) {
    l1 = l1.filter((c) => c.id !== card.id);
    ({ row: l1, deck: d1 } = refill(l1, d1));
  } else if (buyLevel === 2) {
    l2 = l2.filter((c) => c.id !== card.id);
    ({ row: l2, deck: d2 } = refill(l2, d2));
  } else {
    l3 = l3.filter((c) => c.id !== card.id);
    ({ row: l3, deck: d3 } = refill(l3, d3));
  }

  log = [logLine, ...log];
  const claimed = claimNoble(autoBonuses, nobles);
  if (claimed.noble) {
    nobles = claimed.rest;
    autoPrestige += 3;
    log = [nobleLogLine, ...log];
  }

  return {
    ...s,
    l1,
    l2,
    l3,
    d1,
    d2,
    d3,
    autoBonuses,
    autoGold,
    autoPrestige,
    bank,
    nobles,
    log: log.slice(0, 14),
    lastDice: null,
    pending: [],
    turn: s.turn + 1,
    stats: {
      ...s.stats,
      autoNobles: claimed.noble ? s.stats.autoNobles + 1 : s.stats.autoNobles,
    },
  };
}

function applyAutomaFreeTake(
  s: State,
  card: SoloCard,
  freeLogLine: string,
  nobleLogLine: string,
): State {
  let { l1, d1, autoBonuses, autoPrestige, nobles, log } = s;

  autoBonuses = {
    ...autoBonuses,
    [card.bonus]: autoBonuses[card.bonus] + 1,
  };
  autoPrestige += card.points;
  l1 = l1.filter((c) => c.id !== card.id);
  ({ row: l1, deck: d1 } = refill(l1, d1));
  log = [freeLogLine, ...log];

  const claimed = claimNoble(autoBonuses, nobles);
  if (claimed.noble) {
    nobles = claimed.rest;
    autoPrestige += 3;
    log = [nobleLogLine, ...log];
  }

  return {
    ...s,
    l1,
    d1,
    autoBonuses,
    autoPrestige,
    nobles,
    log: log.slice(0, 14),
    pending: [],
    turn: s.turn + 1,
    stats: {
      ...s.stats,
      autoNobles: claimed.noble ? s.stats.autoNobles + 1 : s.stats.autoNobles,
    },
  };
}

type PendingAutomaFx =
  | { kind: 'buy'; cardId: string; level: 1 | 2 | 3 }
  | { kind: 'free'; cardId: string };

const DICE_RECORD_KEY = 'splendor-solo-dice-record';
const DICE_SESSION_KEY = 'splendor-solo-dice-session';

type DiceRecord = { wins: number; losses: number; ties: number };

function readDiceRecord(): DiceRecord {
  try {
    const raw = localStorage.getItem(DICE_RECORD_KEY);
    if (!raw) return { wins: 0, losses: 0, ties: 0 };
    const parsed = JSON.parse(raw) as Partial<DiceRecord>;
    return {
      wins: Number(parsed.wins) || 0,
      losses: Number(parsed.losses) || 0,
      ties: Number(parsed.ties) || 0,
    };
  } catch {
    return { wins: 0, losses: 0, ties: 0 };
  }
}

function writeDiceRecord(winner: 'player' | 'automa' | 'tie'): DiceRecord {
  const cur = readDiceRecord();
  const next = { ...cur };
  if (winner === 'player') next.wins += 1;
  else if (winner === 'automa') next.losses += 1;
  else next.ties += 1;
  try {
    localStorage.setItem(DICE_RECORD_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function DiceAutomaPractice() {
  const { t } = useI18n();
  const labels = useGemLabels();
  const purchaseFx = usePurchaseFx();
  const diceFx = useDiceFx();
  const toast = useSoloToast();
  const hints = useSoloHints();
  const bankFx = useBankTakeFx();
  const { tier, setTier } = useSoloPracticeTier();
  const pendingAutomaFx = useRef<PendingAutomaFx | null>(null);
  const pendingDiceRef = useRef<number | null>(null);
  const recordedWinRef = useRef(false);
  const [state, setState] = useState<State>(() => {
    const saved = loadSession<State>(DICE_SESSION_KEY);
    return saved ?? createGame();
  });
  const [history, setHistory] = useState<State[]>([]);
  const [record, setRecord] = useState(() => readDiceRecord());
  const [discardPick, setDiscardPick] = useState<(keyof GemCounts)[]>([]);

  useEffect(() => {
    if (state.winner) clearSession(DICE_SESSION_KEY);
    else saveSession(DICE_SESSION_KEY, state);
  }, [state]);

  const pushHistory = (s: State) => {
    setHistory((h) => pushCappedHistory(h, s, (x) => x.turn));
  };

  const restart = useCallback(() => {
    recordedWinRef.current = false;
    pendingAutomaFx.current = null;
    pendingDiceRef.current = null;
    clearSession(DICE_SESSION_KEY);
    setHistory([]);
    setDiscardPick([]);
    setState(createGame());
  }, []);

  const tierBoot = useRef(true);
  useEffect(() => {
    if (tierBoot.current) {
      tierBoot.current = false;
      return;
    }
    restart();
  }, [tier, restart]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      pendingAutomaFx.current = null;
      pendingDiceRef.current = null;
      recordedWinRef.current = false;
      setDiscardPick([]);
      setState(h[h.length - 1]);
      return h.slice(0, -1);
    });
  }, []);

  useEffect(() => {
    if (!state.winner || recordedWinRef.current) return;
    recordedWinRef.current = true;
    const next = writeDiceRecord(state.winner);
    setRecord(next);
  }, [state.winner]);

  const finishIfNeeded = (s: State, afterPlayer: boolean): Partial<State> => {
    const pDone = s.prestige >= 15;
    const aDone = s.autoPrestige >= 15;
    if (!pDone && !aDone) return {};
    if (afterPlayer && !aDone) return {};
    let winner: State['winner'] = null;
    if (s.prestige > s.autoPrestige) winner = 'player';
    else if (s.autoPrestige > s.prestige) winner = 'automa';
    else winner = 'tie';
    return { phase: 'done', winner };
  };

  const findCardOnBoard = (
    s: State,
    cardId: string,
    level: 1 | 2 | 3,
  ): SoloCard | null => {
    const row = level === 1 ? s.l1 : level === 2 ? s.l2 : s.l3;
    return row.find((c) => c.id === cardId) ?? null;
  };

  const applyDiceOutcome = (s: State, dice: number): State => {
    let log = [t('soloLogDice', { n: dice }), ...s.log];

    if (dice <= 4) {
      const idx = dice - 1;
      const card = s.l1[idx];
      if (card) {
        pendingAutomaFx.current = { kind: 'free', cardId: card.id };
        return {
          ...s,
          phase: 'busy',
          busyNonce: s.busyNonce + 1,
          log: log.slice(0, 14),
          lastDice: dice,
          pending: [],
        };
      }
      log = [t('soloLogDiceMiss'), ...log];
    } else if (s.bank.gold > 0) {
      const bank = { ...s.bank, gold: s.bank.gold - 1 };
      const autoGold = s.autoGold + 1;
      log = [t('soloLogAutoGold'), ...log];
      let { autoBonuses, autoPrestige, nobles } = s;
      const claimed = claimNoble(autoBonuses, nobles);
      if (claimed.noble) {
        nobles = claimed.rest;
        autoPrestige += 3;
        log = [t('soloLogAutoNoble'), ...log];
      }
      const next: State = {
        ...s,
        bank,
        autoGold,
        autoPrestige,
        nobles,
        log: log.slice(0, 14),
        lastDice: dice,
        pending: [],
        turn: s.turn + 1,
        phase: 'player',
      };
      return { ...next, ...finishIfNeeded(next, false) };
    } else {
      log = [t('soloLogNoGold'), ...log];
    }

    let { autoBonuses, autoPrestige, nobles } = s;
    const claimed = claimNoble(autoBonuses, nobles);
    if (claimed.noble) {
      nobles = claimed.rest;
      autoPrestige += 3;
      log = [t('soloLogAutoNoble'), ...log];
    }

    const next: State = {
      ...s,
      autoPrestige,
      nobles,
      log: log.slice(0, 14),
      lastDice: dice,
      pending: [],
      turn: s.turn + 1,
      phase: 'player',
    };
    return { ...next, ...finishIfNeeded(next, false) };
  };

  const startAutomaDice = (s: State): State => {
    const occupied = [0, 1, 2, 3].map((i) => Boolean(s.l1[i]));
    const dice = rollPracticeDie(tier, occupied);
    pendingDiceRef.current = dice;
    return { ...s, phase: 'busy', busyNonce: s.busyNonce + 1 };
  };

  const scheduleAutomaTurn = (s: State): State => {
    const purchase = findAutomaPurchase(s, tier);
    if (purchase) {
      pendingAutomaFx.current = {
        kind: 'buy',
        cardId: purchase.card.id,
        level: purchase.level,
      };
      return { ...s, phase: 'busy', busyNonce: s.busyNonce + 1 };
    }
    return startAutomaDice(s);
  };

  const continueAfterPlayer = (s: State): State => {
    const cleared: State = {
      ...s,
      phase: 'player',
      discardNeeded: 0,
      pendingNobles: [],
    };
    const end = finishIfNeeded(cleared, true);
    if (end.phase === 'done') return { ...cleared, ...end };
    return scheduleAutomaTurn(cleared);
  };

  const resolveNoblesOrContinue = (s: State): State => {
    const eligible = eligibleNobles(s.bonuses, s.nobles);
    if (eligible.length === 0) return continueAfterPlayer(s);
    if (eligible.length === 1) {
      const noble = eligible[0];
      return continueAfterPlayer({
        ...s,
        nobles: s.nobles.filter((n) => n.id !== noble.id),
        prestige: s.prestige + 3,
        pendingNobles: [],
        stats: { ...s.stats, playerNobles: s.stats.playerNobles + 1 },
        log: [t('soloLogPlayerNoble'), ...s.log].slice(0, 14),
      });
    }
    return {
      ...s,
      phase: 'chooseNoble',
      pendingNobles: eligible,
      discardNeeded: 0,
    };
  };

  const resolveAfterMainAction = (s: State): State => {
    const over = discardNeeded(s.hand);
    if (over > 0) {
      return {
        ...s,
        phase: 'discardGems',
        discardNeeded: over,
        pending: [],
        pendingNobles: [],
      };
    }
    return resolveNoblesOrContinue(s);
  };

  useEffect(() => {
    if (state.phase !== 'busy') return;

    if (pendingDiceRef.current !== null) {
      const dice = pendingDiceRef.current;
      pendingDiceRef.current = null;
      diceFx.run(dice, () => {
        setState((s) => {
          if (dice >= 5 && s.bank.gold > 0) {
            queueMicrotask(() => bankFx.take('gold', { toward: 'out' }));
          }
          return applyDiceOutcome(s, dice);
        });
      });
      return;
    }

    if (!pendingAutomaFx.current) return;

    const pending = pendingAutomaFx.current;
    pendingAutomaFx.current = null;

    let card: SoloCard | null = null;
    if (pending.kind === 'buy') {
      card = findCardOnBoard(state, pending.cardId, pending.level);
    } else {
      card = state.l1.find((c) => c.id === pending.cardId) ?? null;
    }

    if (!card) {
      setState((s) => ({ ...s, phase: 'player' }));
      return;
    }

    purchaseFx.run(card.id, 'automa', () => {
      setState((s) => {
        let next: State;
        if (pending.kind === 'buy') {
          const found = findCardOnBoard(s, pending.cardId, pending.level);
          if (!found) return { ...s, phase: 'player' };
          next = applyAutomaBuy(
            s,
            found,
            pending.level,
            t('soloLogAutoBuy', { level: pending.level, points: found.points }),
            t('soloLogAutoNoble'),
          );
        } else {
          const found = s.l1.find((c) => c.id === pending.cardId);
          if (!found) return { ...s, phase: 'player' };
          next = applyAutomaFreeTake(
            s,
            found,
            t('soloLogAutoFree', { slot: s.lastDice ?? 0 }),
            t('soloLogAutoNoble'),
          );
        }
        return { ...next, phase: 'player', ...finishIfNeeded(next, false) };
      });
    });
  }, [state.phase, state.busyNonce, state.l1, diceFx, purchaseFx, bankFx, t]);

  const pickGem = (color: TakeColor) => {
    if (state.phase !== 'player' || state.winner) return;

    const reason = getTakeRejectionReason(state.pending, color, state.bank);
    if (reason) {
      toast.show(
        t(reason, {
          color: labels[color],
        } as { color: string }),
      );
      setState((s) => ({ ...s, pending: [] }));
      return;
    }

    bankFx.take(color, { toward: 'down' });

    setState((s) => {
      const pending = [...s.pending, color];
      if (!isTakeComplete(pending)) {
        return { ...s, pending };
      }
      const logLine =
        pending.length === 2
          ? t('soloLogTake2', { color: labels[pending[0]] })
          : t('soloLogTake3');
      pushHistory(s);
      return resolveAfterMainAction(
        applyTake({ ...s, pending: [] }, pending, logLine),
      );
    });
  };

  const findCard = (
    s: State,
    id: string,
  ): { card: SoloCard; level: 1 | 2 | 3 | 'reserved' } | null => {
    if (s.l1.some((c) => c.id === id))
      return { card: s.l1.find((c) => c.id === id)!, level: 1 };
    if (s.l2.some((c) => c.id === id))
      return { card: s.l2.find((c) => c.id === id)!, level: 2 };
    if (s.l3.some((c) => c.id === id))
      return { card: s.l3.find((c) => c.id === id)!, level: 3 };
    if (s.reserved.some((c) => c.id === id))
      return { card: s.reserved.find((c) => c.id === id)!, level: 'reserved' };
    return null;
  };

  const reserve = (cardId: string) => {
    setState((s) => {
      if (s.phase !== 'player' || s.winner) return s;
      if (s.reserved.length >= 3) return s;
      if (s.pending.length > 0) return s;
      const found = findCard(s, cardId);
      if (!found || found.level === 'reserved') return s;
      const { card, level } = found;

      let { l1, l2, l3, d1, d2, d3, bank, hand } = s;
      if (level === 1) {
        l1 = l1.filter((c) => c.id !== card.id);
        ({ row: l1, deck: d1 } = refill(l1, d1));
      } else if (level === 2) {
        l2 = l2.filter((c) => c.id !== card.id);
        ({ row: l2, deck: d2 } = refill(l2, d2));
      } else {
        l3 = l3.filter((c) => c.id !== card.id);
        ({ row: l3, deck: d3 } = refill(l3, d3));
      }
      if (bank.gold > 0) {
        bank = { ...bank, gold: bank.gold - 1 };
        hand = { ...hand, gold: hand.gold + 1 };
        queueMicrotask(() => bankFx.take('gold', { toward: 'down' }));
      }
      pushHistory(s);
      return resolveAfterMainAction({
        ...s,
        l1,
        l2,
        l3,
        d1,
        d2,
        d3,
        bank,
        hand,
        reserved: [...s.reserved, card],
        pending: [],
        log: [t('soloLogReserve'), ...s.log].slice(0, 14),
      });
    });
  };

  const applyPlayerBuy = (
    s: State,
    card: SoloCard,
    from: 'display' | 'reserved',
    level?: 1 | 2 | 3,
  ): State => {
    const paid = payForCard(s.hand, card.cost, s.bonuses);
    if (!paid) return s;

    const bank = { ...s.bank };
    for (const c of [...COLORS, 'gold'] as const) {
      bank[c] += s.hand[c] - paid[c];
    }

    const bonuses = {
      ...s.bonuses,
      [card.bonus]: s.bonuses[card.bonus] + 1,
    };
    let { l1, l2, l3, d1, d2, d3, reserved } = s;
    if (from === 'reserved') {
      reserved = reserved.filter((c) => c.id !== card.id);
    } else if (level === 1) {
      l1 = l1.filter((c) => c.id !== card.id);
      ({ row: l1, deck: d1 } = refill(l1, d1));
    } else if (level === 2) {
      l2 = l2.filter((c) => c.id !== card.id);
      ({ row: l2, deck: d2 } = refill(l2, d2));
    } else if (level === 3) {
      l3 = l3.filter((c) => c.id !== card.id);
      ({ row: l3, deck: d3 } = refill(l3, d3));
    }

    return resolveAfterMainAction({
      ...s,
      hand: paid,
      bank,
      bonuses,
      prestige: s.prestige + card.points,
      l1,
      l2,
      l3,
      d1,
      d2,
      d3,
      reserved,
      pending: [],
      stats: { ...s.stats, buys: s.stats.buys + 1 },
      log: [
        t('soloLogBuy', {
          bonus: labels[card.bonus],
          points: card.points,
        }),
        ...s.log,
      ].slice(0, 14),
    });
  };

  const buy = (
    card: SoloCard,
    from: 'display' | 'reserved',
    level?: 1 | 2 | 3,
  ) => {
    if (state.phase !== 'player' || state.winner || state.pending.length > 0) {
      return;
    }
    if (purchaseFx.isAnimating) return;
    if (!payForCard(state.hand, card.cost, state.bonuses)) return;

    purchaseFx.run(card.id, 'player', () => {
      setState((s) => {
        pushHistory(s);
        return applyPlayerBuy(s, card, from, level);
      });
    });
  };

  const toggleDiscard = (gem: keyof GemCounts) => {
    if (state.phase !== 'discardGems' || state.discardNeeded <= 0) return;
    const already = discardPick.filter((g) => g === gem).length;
    const held = state.hand[gem];
    if (already >= held) return;
    if (discardPick.length >= state.discardNeeded) return;
    const next = [...discardPick, gem];
    if (next.length === state.discardNeeded) {
      setDiscardPick([]);
      setState((s) => {
        const hand = { ...s.hand };
        const bank = { ...s.bank };
        for (const g of next) {
          hand[g] -= 1;
          bank[g] += 1;
        }
        return resolveNoblesOrContinue({
          ...s,
          hand,
          bank,
          discardNeeded: 0,
          log: [t('soloLogDiscard'), ...s.log].slice(0, 14),
        });
      });
      return;
    }
    setDiscardPick(next);
  };

  const claimPlayerNoble = (nobleId: number) => {
    if (state.phase !== 'chooseNoble') return;
    setState((s) => {
      const noble = s.pendingNobles.find((n) => n.id === nobleId);
      if (!noble) return s;
      return continueAfterPlayer({
        ...s,
        nobles: s.nobles.filter((n) => n.id !== nobleId),
        prestige: s.prestige + 3,
        pendingNobles: [],
        stats: { ...s.stats, playerNobles: s.stats.playerNobles + 1 },
        log: [t('soloLogPlayerNoble'), ...s.log].slice(0, 14),
      });
    });
  };

  const playerActive =
    state.phase === 'player' &&
    !state.winner &&
    !purchaseFx.isAnimating &&
    !diceFx.isAnimating;

  const humanDiscarding = state.phase === 'discardGems' && !state.winner;
  const humanChoosingNoble = state.phase === 'chooseNoble' && !state.winner;

  return (
    <PracticeShell
      title={t('soloDiceTitle')}
      subtitle={t('soloDiceDesc')}
      onReset={restart}
      onUndo={undo}
      canUndo={history.length > 0 && (playerActive || humanDiscarding || humanChoosingNoble)}
      recordLine={t('soloDiceRecord', {
        wins: record.wins,
        losses: record.losses,
        ties: record.ties,
      })}
      headerExtra={
        <SoloPracticeTierPicker value={tier} onChange={setTier} />
      }
    >
      {state.winner && (
        <div className="panel p-4">
          <p className="font-serif text-lg text-splendor-velvet">
            {state.winner === 'player'
              ? t('soloDiceWinPlayer')
              : state.winner === 'automa'
                ? t('soloDiceWinAutoma')
                : t('soloDiceTie')}
          </p>
          <p className="text-sm text-splendor-muted mt-1 font-serif">
            {t('soloScoreLine', {
              player: state.prestige,
              automa: state.autoPrestige,
            })}
          </p>
          <PracticeCoaching
            tips={buildDiceCoaching({
              playerPrestige: state.prestige,
              autoPrestige: state.autoPrestige,
              playerWon: state.winner === 'player',
              takeLogCount: state.stats.takes,
              buyLogCount: state.stats.buys,
              playerNobles: state.stats.playerNobles,
              autoNobles: state.stats.autoNobles,
              turns: state.turn,
            })}
          />
        </div>
      )}

      {humanChoosingNoble && (
        <div className="panel p-4 space-y-3">
          <p className="font-serif text-splendor-velvet">{t('stdChooseNoble')}</p>
          <div className="flex flex-wrap gap-3">
            {state.pendingNobles.map((n) => (
              <NobleTile
                key={n.id}
                noble={n}
                spendable
                onSpend={() => claimPlayerNoble(n.id)}
              />
            ))}
          </div>
        </div>
      )}

      {humanDiscarding && (
        <div className="panel p-4 space-y-3">
          <p className="font-serif text-splendor-velvet">
            {t('stdDiscardHint', {
              need: state.discardNeeded,
              picked: discardPick.length,
            })}
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx', 'gold'] as (keyof GemCounts)[]
            ).map((gem) => {
              const count = state.hand[gem];
              if (count <= 0) return null;
              const picked = discardPick.filter((g) => g === gem).length;
              return (
                <button
                  key={gem}
                  type="button"
                  disabled={
                    picked >= count || discardPick.length >= state.discardNeeded
                  }
                  onClick={() => toggleDiscard(gem)}
                  className="btn-outline text-sm inline-flex items-center gap-1.5 disabled:opacity-40"
                >
                  <img
                    src={gems[gem]}
                    alt={labels[gem]}
                    className="w-6 h-6 object-contain"
                  />
                  {labels[gem]} ×{count}
                  {picked > 0 ? ` (−${picked})` : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_16rem] gap-4 items-start">
        <BoardTable
          nobles={state.nobles}
          rows={[
            {
              level: 3,
              deckCount: state.d3.length,
              cards: state.l3,
              renderCard: (card) => (
                <BuyableCard
                  card={card}
                  hand={state.hand}
                  bonuses={state.bonuses}
                  phaseLocked={!playerActive || state.pending.length > 0}
                  onBuy={() => buy(card, 'display', 3)}
                  reservable={
                    playerActive &&
                    state.pending.length === 0 &&
                    state.reserved.length < 3
                  }
                  onReserve={() => reserve(card.id)}
                />
              ),
            },
            {
              level: 2,
              deckCount: state.d2.length,
              cards: state.l2,
              renderCard: (card) => (
                <BuyableCard
                  card={card}
                  hand={state.hand}
                  bonuses={state.bonuses}
                  phaseLocked={!playerActive || state.pending.length > 0}
                  onBuy={() => buy(card, 'display', 2)}
                  reservable={
                    playerActive &&
                    state.pending.length === 0 &&
                    state.reserved.length < 3
                  }
                  onReserve={() => reserve(card.id)}
                />
              ),
            },
            {
              level: 1,
              deckCount: state.d1.length,
              cards: state.l1,
              renderCard: (card) => (
                <BuyableCard
                  card={card}
                  hand={state.hand}
                  bonuses={state.bonuses}
                  phaseLocked={!playerActive || state.pending.length > 0}
                  onBuy={() => buy(card, 'display', 1)}
                  reservable={
                    playerActive &&
                    state.pending.length === 0 &&
                    state.reserved.length < 3
                  }
                  onReserve={() => reserve(card.id)}
                />
              ),
            },
          ]}
          bank={state.bank}
          bankInteractive={playerActive}
          onBankGem={pickGem}
        />

        <aside className="space-y-3">
          <div className="panel p-3 space-y-2">
            <p className="font-serif text-splendor-velvet text-sm">
              {t('soloYou')} · {t('soloPrestige')}: {state.prestige}
            </p>
            <TokenRow
              values={state.bonuses}
              showGold={false}
              title={t('soloYourBonuses')}
            />
          </div>

          <HandDropZone
            hand={state.hand}
            pending={state.pending}
            bank={state.bank}
            active={playerActive}
            onDropGem={pickGem}
            onCancelPending={() =>
              setState((s) => ({ ...s, pending: [] }))
            }
          />

          <ReserveDropZone
            active={playerActive && state.reserved.length < 3}
            title={t('soloReserved')}
            emptyHint={t('soloReserveDrop')}
            onDropCard={reserve}
          >
            {state.reserved.length > 0 ? (
              <ReservedHand
                cards={state.reserved}
                hand={state.hand}
                bonuses={state.bonuses}
                showHints={hints.enabled}
                onBuy={
                  playerActive && state.pending.length === 0
                    ? (card) => buy(card, 'reserved')
                    : undefined
                }
                isExiting={(id) => purchaseFx.isExiting(id)}
              />
            ) : undefined}
          </ReserveDropZone>

          <div className="panel p-3 space-y-2">
            <p className="font-serif text-splendor-velvet text-sm">
              {t('soloAutoma')} · {t('soloPrestige')}: {state.autoPrestige}
            </p>
            <TokenRow
              values={state.autoBonuses}
              showGold={false}
              title={t('soloYourBonuses')}
            />
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-splendor-line bg-white/80 text-base font-serif tabular-nums ${
                  state.autoGold === 0 ? 'opacity-45' : ''
                }`}
              >
                <img
                  src={gems.gold}
                  alt={labels.gold}
                  className="w-8 h-8 object-contain"
                />
                {state.autoGold}
              </span>
              {state.lastDice != null && (
                <span className="text-xs font-serif text-splendor-muted">
                  {t('soloLastDice')}: {state.lastDice}
                </span>
              )}
            </div>
          </div>
        </aside>
      </div>

      <SoloActionLog lines={state.log} />
    </PracticeShell>
  );
}
