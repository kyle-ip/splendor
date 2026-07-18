import { useCallback, useEffect, useRef, useState } from 'react';
import type { GemCounts, NobleRequirement } from '@/types';
import {
  LEVEL1_CARDS,
  LEVEL2_CARDS,
  LEVEL3_CARDS,
  NOBLES,
  drawDisplay,
  emptyBonuses,
  payForCard,
  shuffle,
  type SoloCard,
} from '@/data/solo-cards';
import {
  AUTOMA_CARDS,
  NUM_TO_COLOR,
  type AutomaBand,
  type AutomaCardDef,
} from '@/data/solo3-automa';
import { useGemLabels } from '@/i18n/useGemLabels';
import { useI18n } from '@/i18n/I18nProvider';
import { pushCappedHistory } from '@/lib/practiceHistory';
import { preserveScroll } from '@/lib/preserveScroll';
import { loadSession, saveSession, clearSession } from '@/lib/practiceSession';
import { discardNeeded } from '@/lib/splendorRules';
import {
  PracticeShell,
  TokenRow,
  ReservedHand,
} from './shared';
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
import { useBankTakeFx, bankTakeManyDuration } from './BankTakeFx';
import { usePurchaseFx } from './PurchaseFx';
import {
  useCeremonyFx,
  useTurnPulseOnChange,
  useWinCelebrateOnce,
} from './CeremonyFx';
import { useScrollLock } from '@/lib/useScrollLock';
import {
  SoloPracticeTierPicker,
  useSoloPracticeTier,
} from './PracticeTierPicker';
import { readSoloPracticeTier, starCountForTier } from './practiceTier';
import {
  PracticeCoaching,
  buildCardAutomaCoaching,
} from './PracticeCoaching';

const COLORS = ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'] as const;
const noblesAll = NOBLES;
const SESSION_KEY = 'splendor-solo-card-automa';

type Phase = 'automa' | 'player' | 'discardGems' | 'chooseNoble' | 'done';

type State = {
  bank: GemCounts;
  /** Automa chip stack bottom→top (board numbers 1–5) */
  stack: number[];
  hand: GemCounts;
  bonuses: Omit<GemCounts, 'gold'>;
  prestige: number;
  reserved: SoloCard[];
  autoPrestige: number;
  l1: SoloCard[];
  l2: SoloCard[];
  l3: SoloCard[];
  d1: SoloCard[];
  d2: SoloCard[];
  d3: SoloCard[];
  nobles: NobleRequirement[];
  deck: AutomaCardDef[];
  discard: AutomaCardDef[];
  phaseBand: 1 | 2 | 3;
  turn: number;
  phase: Phase;
  winner: 'player' | 'automa' | 'tie' | null;
  log: string[];
  pending: TakeColor[];
  discardNeeded: number;
  pendingNobles: NobleRequirement[];
  lastCardId: number | null;
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

function eligibleNobles(
  bonuses: Omit<GemCounts, 'gold'>,
  nobles: NobleRequirement[],
): NobleRequirement[] {
  return nobles.filter((n) =>
    COLORS.every((c) => bonuses[c] >= n.requirements[c]),
  );
}

function buildAutomaDeck(starCount = 2): AutomaCardDef[] {
  const stars = shuffle(AUTOMA_CARDS.filter((c) => c.star));
  const normals = AUTOMA_CARDS.filter((c) => !c.star);
  const n = Math.max(0, Math.min(4, starCount));
  const pickedStars = stars.slice(0, n);
  return shuffle([...normals, ...pickedStars]);
}

function bandFor(card: AutomaCardDef, phaseBand: 1 | 2 | 3): AutomaBand {
  if (phaseBand === 1) return card.top;
  if (phaseBand === 2) return card.middle;
  return card.bottom;
}

function createGame(starCount = 2): State {
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
    stack: [],
    hand: { emerald: 0, sapphire: 0, ruby: 0, diamond: 0, onyx: 0, gold: 0 },
    bonuses: emptyBonuses(),
    prestige: 0,
    reserved: [],
    autoPrestige: 0,
    l1: a.display,
    l2: b.display,
    l3: c.display,
    d1: a.deck,
    d2: b.deck,
    d3: c.deck,
    nobles: shuffle(noblesAll).slice(0, 3),
    deck: buildAutomaDeck(starCount),
    discard: [],
    phaseBand: 1,
    turn: 1,
    phase: 'automa',
    winner: null,
    log: [],
    pending: [],
    discardNeeded: 0,
    pendingNobles: [],
    lastCardId: null,
  };
}

function finishCompare(s: State): Partial<State> {
  if (s.prestige < 15 && s.autoPrestige < 15) return {};
  let winner: State['winner'] = 'tie';
  if (s.prestige > s.autoPrestige) winner = 'player';
  else if (s.autoPrestige > s.prestige) winner = 'automa';
  return { phase: 'done', winner };
}

export function CardAutomaPractice() {
  const { t } = useI18n();
  const labels = useGemLabels();
  const toast = useSoloToast();
  const hints = useSoloHints();
  const bankFx = useBankTakeFx();
  const purchaseFx = usePurchaseFx();
  const ceremonyFx = useCeremonyFx();
  const { tier, setTier } = useSoloPracticeTier();
  const [state, setState] = useState<State>(() => {
    const saved = loadSession<State>(SESSION_KEY);
    return saved ?? createGame(starCountForTier(readSoloPracticeTier()));
  });
  const [history, setHistory] = useState<State[]>([]);
  const [discardPick, setDiscardPick] = useState<(keyof GemCounts)[]>([]);
  const pendingAutomaTakeRef = useRef<TakeColor[]>([]);

  useWinCelebrateOnce(Boolean(state.winner), state.winner === 'player', 'player');
  useTurnPulseOnChange(
    state.winner
      ? null
      : state.phase === 'automa'
        ? `a-${state.turn}`
        : `p-${state.turn}`,
    state.phase === 'automa' ? 'opponent' : 'player',
  );
  useScrollLock(!state.winner);

  useEffect(() => {
    if (state.winner) clearSession(SESSION_KEY);
    else saveSession(SESSION_KEY, state);
  }, [state]);

  const pushHistory = (s: State) => {
    setHistory((h) => pushCappedHistory(h, s, (x) => x.turn));
  };

  const restart = useCallback(() => {
    clearSession(SESSION_KEY);
    setHistory([]);
    setDiscardPick([]);
    setState(createGame(starCountForTier(tier)));
  }, [tier]);

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
      setDiscardPick([]);
      setState(h[h.length - 1]);
      return h.slice(0, -1);
    });
  }, []);

  const runAutomaBand = (s: State, band: AutomaBand, cardId: number): State => {
    let next = { ...s, lastCardId: cardId };
    if (band.kind === 'take') {
      const stack = [...next.stack];
      const bank = { ...next.bank };
      const taken: string[] = [];
      const takenColors: TakeColor[] = [];
      for (const num of band.nums) {
        const color = NUM_TO_COLOR[num as 1 | 2 | 3 | 4 | 5];
        if (bank[color] > 0) {
          bank[color] -= 1;
          stack.push(num);
          taken.push(labels[color]);
          takenColors.push(color);
        }
      }
      if (takenColors.length > 0) {
        // FX + delayed player turn are handled by the automa effect.
        pendingAutomaTakeRef.current = takenColors;
      } else {
        pendingAutomaTakeRef.current = [];
      }
      return {
        ...next,
        bank,
        stack,
        log: [
          t('solo3LogTake', { gems: taken.join(', ') || '—' }),
          ...next.log,
        ].slice(0, 14),
      };
    }

    pendingAutomaTakeRef.current = [];
    const rowKey = band.level === 1 ? 'l1' : band.level === 2 ? 'l2' : 'l3';
    const deckKey = band.level === 1 ? 'd1' : band.level === 2 ? 'd2' : 'd3';
    let row = [...next[rowKey]];
    let deck = [...next[deckKey]];
    let card = row[band.slot] ?? row.find(Boolean) ?? null;
    if (!card) {
      return {
        ...next,
        log: [t('solo3LogMiss'), ...next.log].slice(0, 14),
      };
    }

    const discardN = Math.min(band.discard, next.stack.length);
    const removed = next.stack.slice(0, discardN);
    const stack = next.stack.slice(discardN);
    const bank = { ...next.bank };
    for (const num of removed) {
      const color = NUM_TO_COLOR[num as 1 | 2 | 3 | 4 | 5];
      bank[color] += 1;
    }

    row = row.filter((c) => c.id !== card!.id);
    ({ row, deck } = refill(row, deck));
    const autoPrestige =
      next.autoPrestige + (card.points > 0 ? card.points : 0);

    return {
      ...next,
      [rowKey]: row,
      [deckKey]: deck,
      stack,
      bank,
      autoPrestige,
      log: [
        t('solo3LogGain', {
          level: band.level,
          points: card.points,
          discard: discardN,
        }),
        ...next.log,
      ].slice(0, 14),
    };
  };

  const startPlayerTurn = (s: State): State => {
    const end = finishCompare(s);
    if (end.phase === 'done') return { ...s, ...end };
    return { ...s, phase: 'player' };
  };

  const advanceAfterPlayer = (s: State): State => {
    const end = finishCompare(s);
    if (end.phase === 'done') return { ...s, ...end };

    const nextTurn = s.turn + 1;
    if (nextTurn > 30) {
      return { ...s, turn: nextTurn, phase: 'done', winner: 'automa' };
    }

    let deck = s.deck;
    let discard = s.discard;
    let phaseBand = s.phaseBand;
    if (deck.length === 0) {
      if (phaseBand >= 3) {
        return { ...s, turn: nextTurn, phase: 'done', winner: 'automa' };
      }
      phaseBand = (phaseBand + 1) as 1 | 2 | 3;
      deck = shuffle(discard);
      discard = [];
    }

    return {
      ...s,
      turn: nextTurn,
      phaseBand,
      deck,
      discard,
      phase: 'automa',
      discardNeeded: 0,
      pendingNobles: [],
    };
  };

  const resolveNoblesOrContinue = (s: State): State => {
    const eligible = eligibleNobles(s.bonuses, s.nobles);
    if (eligible.length === 0) return advanceAfterPlayer(s);
    return { ...s, phase: 'chooseNoble', pendingNobles: eligible };
  };

  const resolveAfterMain = (s: State): State => {
    const over = discardNeeded(s.hand);
    if (over > 0) {
      return { ...s, phase: 'discardGems', discardNeeded: over, pending: [] };
    }
    return resolveNoblesOrContinue(s);
  };

  useEffect(() => {
    if (state.phase !== 'automa' || state.winner) return;
    const timer = window.setTimeout(() => {
      let takenForFx: TakeColor[] = [];
      setState((s) => {
        if (s.phase !== 'automa') return s;
        let deck = [...s.deck];
        let discard = [...s.discard];
        if (deck.length === 0) {
          deck = shuffle(discard);
          discard = [];
        }
        const card = deck[0];
        deck = deck.slice(1);
        discard = [...discard, card];
        const band = bandFor(card, s.phaseBand);
        const after = runAutomaBand(
          { ...s, deck, discard },
          band,
          card.id,
        );
        takenForFx = pendingAutomaTakeRef.current;
        pendingAutomaTakeRef.current = [];
        if (takenForFx.length > 0) {
          // Stay on automa until take FX finishes.
          return { ...after, phase: 'automa' };
        }
        return startPlayerTurn(after);
      });
      if (takenForFx.length > 0) {
        queueMicrotask(() =>
          bankFx.takeMany(takenForFx, { toward: 'up' }),
        );
        window.setTimeout(() => {
          setState((s) =>
            s.phase === 'automa' && !s.winner ? startPlayerTurn(s) : s,
          );
        }, bankTakeManyDuration(takenForFx.length, 'up') + 280);
      }
    }, 520);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.turn, state.winner]);

  const pickGem = (color: TakeColor) => {
    if (state.phase !== 'player' || state.winner) return;
    preserveScroll(() => {
      const reason = getTakeRejectionReason(state.pending, color, state.bank);
      if (reason) {
        toast.show(t(reason, { color: labels[color] } as { color: string }));
        setState((s) => ({ ...s, pending: [] }));
        return;
      }
      bankFx.take(color, { toward: 'down' });
      setState((s) => {
        const pending = [...s.pending, color];
        if (!isTakeComplete(pending)) return { ...s, pending };
        const hand = { ...s.hand };
        const bank = { ...s.bank };
        for (const c of pending) {
          hand[c] += 1;
          bank[c] -= 1;
        }
        pushHistory(s);
        return resolveAfterMain({
          ...s,
          hand,
          bank,
          pending: [],
          log: [
            pending.length === 2
              ? t('soloLogTake2', { color: labels[pending[0]] })
              : t('soloLogTake3'),
            ...s.log,
          ].slice(0, 14),
        });
      });
    });
  };

  const reserve = (cardId: string) => {
    setState((s) => {
      if (s.phase !== 'player' || s.winner || s.pending.length > 0) return s;
      if (s.reserved.length >= 3) return s;
      const found =
        s.l1.find((c) => c.id === cardId) ||
        s.l2.find((c) => c.id === cardId) ||
        s.l3.find((c) => c.id === cardId);
      if (!found) return s;
      let { l1, l2, l3, d1, d2, d3, bank, hand } = s;
      if (s.l1.some((c) => c.id === cardId)) {
        l1 = l1.filter((c) => c.id !== cardId);
        ({ row: l1, deck: d1 } = refill(l1, d1));
      } else if (s.l2.some((c) => c.id === cardId)) {
        l2 = l2.filter((c) => c.id !== cardId);
        ({ row: l2, deck: d2 } = refill(l2, d2));
      } else {
        l3 = l3.filter((c) => c.id !== cardId);
        ({ row: l3, deck: d3 } = refill(l3, d3));
      }
      if (bank.gold > 0) {
        bank = { ...bank, gold: bank.gold - 1 };
        hand = { ...hand, gold: hand.gold + 1 };
        queueMicrotask(() => bankFx.take('gold', { toward: 'down' }));
      }
      pushHistory(s);
      return resolveAfterMain({
        ...s,
        l1,
        l2,
        l3,
        d1,
        d2,
        d3,
        bank,
        hand,
        reserved: [...s.reserved, found],
        log: [t('soloLogReserve'), ...s.log].slice(0, 14),
      });
    });
  };

  const buy = (card: SoloCard, from: 'display' | 'reserved', level?: 1 | 2 | 3) => {
    if (state.phase !== 'player' || state.winner || state.pending.length > 0) {
      return;
    }
    const paidPreview = payForCard(state.hand, card.cost, state.bonuses);
    if (!paidPreview) return;
    bankFx.spendDiff(state.hand, paidPreview);
    purchaseFx.run(card.id, 'player', () => {
      setState((s) => {
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
        pushHistory(s);
        return resolveAfterMain({
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
          log: [
            t('soloLogBuy', {
              bonus: labels[card.bonus],
              points: card.points,
            }),
            ...s.log,
          ].slice(0, 14),
        });
      });
    });
  };

  const toggleDiscard = (gem: keyof GemCounts) => {
    if (state.phase !== 'discardGems') return;
    const already = discardPick.filter((g) => g === gem).length;
    if (already >= state.hand[gem]) return;
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
        });
      });
      return;
    }
    setDiscardPick(next);
  };

  const claimNoble = (id: number) => {
    if (state.phase !== 'chooseNoble') return;
    if (!state.pendingNobles.some((n) => n.id === id)) return;
    ceremonyFx.nobleVisit(id, 'player', () => {
      setState((s) => {
        if (s.phase !== 'chooseNoble') return s;
        if (!s.pendingNobles.some((n) => n.id === id)) return s;
        return advanceAfterPlayer({
          ...s,
          nobles: s.nobles.filter((n) => n.id !== id),
          prestige: s.prestige + 3,
          pendingNobles: [],
          log: [t('soloLogPlayerNoble'), ...s.log].slice(0, 14),
        });
      });
    });
  };

  // Auto-claim when only one noble is eligible (visit FX then commit).
  useEffect(() => {
    if (state.phase !== 'chooseNoble' || state.pendingNobles.length !== 1) {
      return;
    }
    const id = state.pendingNobles[0].id;
    const timer = window.setTimeout(() => claimNoble(id), 120);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.pendingNobles]);

  const playerActive =
    state.phase === 'player' && !state.winner && !purchaseFx.isAnimating;

  return (
    <PracticeShell
      title={t('solo3Title')}
      subtitle={t('solo3Desc')}
      onReset={restart}
      onUndo={undo}
      canUndo={history.length > 0 && (playerActive || state.phase === 'discardGems')}
      focusBoard
      headerExtra={
        <SoloPracticeTierPicker value={tier} onChange={setTier} />
      }
      recordLine={t('solo3TurnBand', {
        turn: state.turn,
        band: state.phaseBand,
        deck: state.deck.length,
      })}
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
            tips={buildCardAutomaCoaching({
              playerPrestige: state.prestige,
              autoPrestige: state.autoPrestige,
              playerWon: state.winner === 'player',
              takeLogCount: state.log.filter(
                (l) =>
                  l.startsWith('Took ') ||
                  l.includes('拿取 3') ||
                  l.includes('拿取 2') ||
                  l.includes('拿取2'),
              ).length,
              buyLogCount: state.log.filter(
                (l) => l.startsWith('Bought ') || l.startsWith('购买发展卡'),
              ).length,
              playerNobles: state.log.filter(
                (l) =>
                  l.includes('noble visited you') ||
                  l.includes('贵族来访') ||
                  l === t('soloLogPlayerNoble'),
              ).length,
              turns: state.turn,
            })}
          />
        </div>
      )}

      {state.phase === 'chooseNoble' && (
        <div className="panel p-4 space-y-3">
          <p className="font-serif text-splendor-velvet">{t('stdChooseNoble')}</p>
          <div className="flex flex-wrap gap-3">
            {state.pendingNobles.map((n) => (
              <NobleTile
                key={n.id}
                noble={n}
                spendable
                onSpend={() => claimNoble(n.id)}
              />
            ))}
          </div>
        </div>
      )}

      {state.phase === 'discardGems' && (
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
          rows={[3, 2, 1].map((level) => {
            const lv = level as 1 | 2 | 3;
            const cards =
              lv === 1 ? state.l1 : lv === 2 ? state.l2 : state.l3;
            const deck =
              lv === 1 ? state.d1 : lv === 2 ? state.d2 : state.d3;
            return {
              level: lv,
              deckCount: deck.length,
              cards,
              renderCard: (card: SoloCard) => (
                <BuyableCard
                  card={card}
                  hand={state.hand}
                  bonuses={state.bonuses}
                  phaseLocked={!playerActive || state.pending.length > 0}
                  onBuy={() => buy(card, 'display', lv)}
                  reservable={
                    playerActive &&
                    state.pending.length === 0 &&
                    state.reserved.length < 3
                  }
                  onReserve={() => reserve(card.id)}
                />
              ),
            };
          })}
          bank={state.bank}
          bankInteractive={playerActive}
          onBankGem={pickGem}
        />

        <aside className="space-y-3">
          <div className="panel p-3 space-y-2" data-seat-target="player">
            <p className="font-serif text-splendor-velvet text-sm">
              {t('soloYou')} · {t('soloPrestige')}:{' '}
              <span data-prestige="player">{state.prestige}</span>
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
              />
            ) : undefined}
          </ReserveDropZone>

          <div className="panel p-3 space-y-2" data-seat-target="opponent">
            <p className="font-serif text-splendor-velvet text-sm">
              {t('soloAutoma')} · {t('soloPrestige')}:{' '}
              <span data-prestige="opponent">{state.autoPrestige}</span>
            </p>
            <p className="text-xs font-serif text-splendor-muted">
              {t('solo3Stack', { n: state.stack.length })}
              {state.lastCardId != null
                ? ` · AI-${state.lastCardId}`
                : ''}
            </p>
            <p
              className={`text-xs font-serif text-splendor-velvet ${
                state.phase === 'automa' ? '' : 'invisible'
              }`}
            >
              {t('solo3AutomaActing')}
            </p>
          </div>
        </aside>
      </div>
    </PracticeShell>
  );
}
