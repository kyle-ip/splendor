import { useEffect, useMemo, useRef, useState } from 'react';
import type { MessageKey } from '@/i18n/messages';
import { useGemLabels } from '@/i18n/useGemLabels';
import { useI18n } from '@/i18n/I18nProvider';
import { gems } from '@/lib/assets';
import { pushCappedHistory } from '@/lib/practiceHistory';
import { loadSession, saveSession, clearSession } from '@/lib/practiceSession';
import type { SoloCard } from '@/data/solo-cards';
import { payForCard } from '@/data/solo-cards';
import {
  PracticeShell,
  SoloActionLog,
  ReservedHand,
} from '@/features/solo/shared';
import {
  PracticeCoaching,
  buildStandardCoaching,
} from '@/features/solo/PracticeCoaching';
import { usePurchaseFx } from '@/features/solo/PurchaseFx';
import { useSoloToast } from '@/features/solo/SoloToast';
import { useSoloHints } from '@/features/solo/SoloHints';
import { useBankTakeFx } from '@/features/solo/BankTakeFx';
import {
  BoardTable,
  BuyableCard,
  HandDropZone,
  ReserveDropZone,
  NobleTile,
  getTakeRejectionReason,
  isTakeComplete,
  type TakeColor,
} from '@/features/solo/Board';
import { chooseAiAction } from './ai';
import {
  applyAction,
  createGame,
  currentSeat,
  findCard,
  passTurn,
  setPendingTake,
} from './engine';
import {
  contestedCardIds,
  selectStandardTip,
} from './practiceTips';
import { SetupForm, type SetupValues } from './SetupForm';
import {
  SideTable,
  SeatPanel,
  seatDisplayName,
  seatsToSides,
} from './SeatPanel';
import { StandardTipBanner } from './StandardTipBanner';
import type { Color, GameState, GemKey, LogEntry } from './types';

const AI_DELAY_MS = 420;
const AI_FAST_MS = 160;
const STD_SESSION_KEY = 'splendor-standard-session';

type StdSession = { setup: SetupValues; state: GameState };

function formatLog(
  entry: LogEntry,
  state: GameState,
  t: (key: MessageKey, vars?: Record<string, string | number>) => string,
  labels: Record<string, string>,
): string {
  const who = (id: number) => {
    const seat = state.seats[id];
    if (!seat) return '?';
    return seatDisplayName(seat, t);
  };

  switch (entry.kind) {
    case 'take3':
      return t('stdLogTake3', { who: who(entry.seat) });
    case 'take2':
      return t('stdLogTake2', {
        who: who(entry.seat),
        color: labels[entry.color] ?? entry.color,
      });
    case 'buy':
      return t('stdLogBuy', {
        who: who(entry.seat),
        points: entry.points,
        bonus: labels[entry.bonus] ?? entry.bonus,
      });
    case 'reserve':
      return t('stdLogReserve', { who: who(entry.seat) });
    case 'noble':
      return t('stdLogNoble', { who: who(entry.seat) });
    case 'discard':
      return t('stdLogDiscard', { who: who(entry.seat) });
    case 'gameOver':
      return t('stdLogGameOver');
    default:
      return '';
  }
}

function difficultyKey(d: SetupValues['difficulty']): MessageKey {
  if (d === 'easy') return 'stdDiff_easy';
  if (d === 'normal') return 'stdDiff_normal';
  return 'stdDiff_hard';
}

export function StandardPractice() {
  const { t } = useI18n();
  const labels = useGemLabels();
  const purchaseFx = usePurchaseFx();
  const toast = useSoloToast();
  const hints = useSoloHints();
  const bankFx = useBankTakeFx();

  const [setup, setSetup] = useState<SetupValues>(() => {
    const saved = loadSession<StdSession>(STD_SESSION_KEY);
    return saved?.setup ?? {
      playerCount: 2,
      humanSeat: 0,
      difficulty: 'normal',
    };
  });
  const [playing, setPlaying] = useState(() => {
    const saved = loadSession<StdSession>(STD_SESSION_KEY);
    return Boolean(saved?.state && !saved.state.winnerIds.length);
  });
  const [state, setState] = useState<GameState | null>(() => {
    const saved = loadSession<StdSession>(STD_SESSION_KEY);
    if (saved?.state && !saved.state.winnerIds.length) return saved.state;
    return null;
  });
  const [history, setHistory] = useState<GameState[]>([]);
  const [fastAi, setFastAi] = useState(false);
  const [discardPick, setDiscardPick] = useState<GemKey[]>([]);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(
    () => new Set(),
  );
  const aiLockRef = useRef(false);

  useEffect(() => {
    if (!playing || !state) {
      if (!playing) clearSession(STD_SESSION_KEY);
      return;
    }
    if (state.winnerIds.length > 0) clearSession(STD_SESSION_KEY);
    else saveSession(STD_SESSION_KEY, { setup, state });
  }, [playing, setup, state]);

  const startGame = () => {
    setHistory([]);
    aiLockRef.current = false;
    setDiscardPick([]);
    setDismissedTips(new Set());
    const next = createGame(setup);
    setState(next);
    setPlaying(true);
    saveSession(STD_SESSION_KEY, { setup, state: next });
  };

  const backToSetup = () => {
    setPlaying(false);
    setState(null);
    setHistory([]);
    aiLockRef.current = false;
    setDiscardPick([]);
    setDismissedTips(new Set());
    clearSession(STD_SESSION_KEY);
  };

  const pushHistory = (s: GameState) => {
    setHistory((h) => pushCappedHistory(h, s, (x) => x.turn));
  };

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      aiLockRef.current = false;
      setDiscardPick([]);
      setState(h[h.length - 1]);
      return h.slice(0, -1);
    });
  };

  const humanSeat = state?.seats.find((s) => s.isHuman) ?? null;
  const active = state ? currentSeat(state) : null;

  const isHumanSeat =
    Boolean(state && humanSeat && state.currentSeat === humanSeat.id);

  const humanMainTurn =
    isHumanSeat &&
    state?.phase === 'human' &&
    !purchaseFx.isAnimating &&
    !aiLockRef.current;

  const humanChoosingNoble =
    isHumanSeat && state?.phase === 'chooseNoble' && !purchaseFx.isAnimating;

  const humanDiscarding =
    isHumanSeat && state?.phase === 'discardGems' && !purchaseFx.isAnimating;

  const logLines = useMemo(() => {
    if (!state) return [];
    return state.log.map((e) => formatLog(e, state, t, labels));
  }, [state, t, labels]);

  const contestedIds = useMemo(() => {
    if (!state || !humanSeat || !hints.enabled) return new Set<string>();
    return contestedCardIds(state, humanSeat.id);
  }, [state, humanSeat, hints.enabled]);

  const activeTip = useMemo(() => {
    if (!state || !humanSeat || !hints.enabled || !humanMainTurn) return null;
    return selectStandardTip(state, humanSeat.id, dismissedTips);
  }, [state, humanSeat, hints.enabled, humanMainTurn, dismissedTips]);

  const dismissTip = (id: string) => {
    setDismissedTips((prev) => new Set(prev).add(id));
  };

  useEffect(() => {
    setDiscardPick([]);
  }, [state?.phase, state?.currentSeat, state?.discardNeeded]);

  useEffect(() => {
    if (!state || state.phase === 'done') return;
    if (state.phase === 'human') return;
    if (state.phase === 'chooseNoble' && currentSeat(state).isHuman) return;
    if (state.phase === 'discardGems' && currentSeat(state).isHuman) return;
    if (aiLockRef.current || purchaseFx.isAnimating) return;

    const delay = fastAi ? AI_FAST_MS : AI_DELAY_MS;
    const timer = window.setTimeout(() => {
      if (aiLockRef.current) return;

      setState((s) => {
        if (!s || s.phase === 'done' || s.phase === 'human') return s;
        if (
          (s.phase === 'chooseNoble' || s.phase === 'discardGems') &&
          currentSeat(s).isHuman
        ) {
          return s;
        }

        const action = chooseAiAction(s);
        if (!action) {
          return passTurn(s);
        }

        if (action.type === 'take') {
          queueMicrotask(() =>
            bankFx.takeMany(action.colors, { toward: 'out', staggerMs: 80 }),
          );
        }
        if (action.type === 'reserve' && s.bank.gold > 0) {
          queueMicrotask(() => bankFx.take('gold', { toward: 'out' }));
        }

        if (action.type === 'buy') {
          const found = findCard(s, action.cardId);
          if (found) {
            aiLockRef.current = true;
            purchaseFx.run(found.card.id, 'ai', () => {
              setState((cur) => {
                aiLockRef.current = false;
                if (!cur) return cur;
                return applyAction(cur, action) ?? cur;
              });
            });
            return s;
          }
        }

        return applyAction(s, action) ?? s;
      });
    }, delay);

    return () => window.clearTimeout(timer);
  }, [
    state?.phase,
    state?.busyNonce,
    state?.currentSeat,
    state?.discardNeeded,
    state?.pendingNobles.length,
    fastAi,
    purchaseFx.isAnimating,
    bankFx,
  ]);

  const pickGem = (color: TakeColor) => {
    if (!state || !humanMainTurn) return;
    const reason = getTakeRejectionReason(
      state.pendingTake as TakeColor[],
      color,
      state.bank,
    );
    if (reason) {
      toast.show(
        t(reason, {
          color: labels[color],
        } as { color: string }),
      );
      setState((s) => (s ? setPendingTake(s, []) : s));
      return;
    }

    bankFx.take(color, { toward: 'down' });

    setState((s) => {
      if (!s) return s;
      const pending = [...s.pendingTake, color] as Color[];
      if (!isTakeComplete(pending as TakeColor[])) {
        return setPendingTake(s, pending);
      }
      pushHistory(s);
      return (
        applyAction({ ...s, pendingTake: [] }, { type: 'take', colors: pending }) ??
        s
      );
    });
  };

  const reserve = (cardId: string) => {
    setState((s) => {
      if (!s || s.phase !== 'human') return s;
      if (!currentSeat(s).isHuman) return s;
      if (s.pendingTake.length > 0) return s;
      const found = findCard(s, cardId);
      if (!found || found.level === 'reserved') return s;
      if (s.bank.gold > 0) {
        queueMicrotask(() => bankFx.take('gold', { toward: 'down' }));
      }
      pushHistory(s);
      return (
        applyAction(s, {
          type: 'reserve',
          cardId,
          level: found.level,
        }) ?? s
      );
    });
  };

  const buy = (
    card: SoloCard,
    from: 'display' | 'reserved',
    level?: 1 | 2 | 3,
  ) => {
    if (!state || !humanMainTurn || state.pendingTake.length > 0) return;
    if (purchaseFx.isAnimating) return;
    if (!humanSeat) return;
    if (!payForCard(humanSeat.hand, card.cost, humanSeat.bonuses)) return;

    purchaseFx.run(card.id, 'player', () => {
      setState((s) => {
        if (!s) return s;
        pushHistory(s);
        return (
          applyAction(s, {
            type: 'buy',
            cardId: card.id,
            from,
            level,
          }) ?? s
        );
      });
    });
  };

  const claimNoble = (nobleId: number) => {
    setState((s) => {
      if (!s || s.phase !== 'chooseNoble') return s;
      pushHistory(s);
      return applyAction(s, { type: 'claimNoble', nobleId }) ?? s;
    });
  };

  const toggleDiscard = (gem: GemKey) => {
    if (!state || !humanDiscarding) return;
    const seat = currentSeat(state);
    const already = discardPick.filter((g) => g === gem).length;
    if (already >= seat.hand[gem]) return;
    if (discardPick.length >= state.discardNeeded) return;

    const next = [...discardPick, gem];
    if (next.length === state.discardNeeded) {
      pushHistory(state);
      setDiscardPick([]);
      setState((s) => (s && applyAction(s, { type: 'discard', gems: next })) || s);
    } else {
      setDiscardPick(next);
    }
  };

  if (!playing || !state) {
    return (
      <div className="space-y-6">
        <header>
          <p className="font-serif text-[11px] tracking-[0.22em] uppercase text-splendor-muted mb-2">
            {t('navStandardPractice')}
          </p>
          <h1 className="page-title">{t('stdTitle')}</h1>
          <div className="ornament-line my-4" />
          <p className="font-serif text-splendor-muted leading-relaxed max-w-2xl">
            {t('stdIntro')}
          </p>
        </header>
        <SetupForm
          value={setup}
          onChange={setSetup}
          onStart={startGame}
          t={t}
        />
      </div>
    );
  }

  const me = humanSeat!;
  const sides = seatsToSides(state.seats, me.id);

  const phaseLocked =
    !humanMainTurn ||
    state.pendingTake.length > 0 ||
    state.phase === 'chooseNoble' ||
    state.phase === 'discardGems';

  const winnerText = (() => {
    if (state.phase !== 'done') return null;
    const ids = state.winnerIds;
    if (ids.length !== 1) return t('stdTie');
    const w = state.seats[ids[0]];
    if (w?.isHuman) return t('stdWinYou');
    return t('stdWinAi', { name: seatDisplayName(w, t) });
  })();

  const renderSeat = (seat: typeof me, opts?: { isHumanControls?: boolean }) => (
    <SeatPanel
      key={seat.id}
      seat={seat}
      isCurrent={state.currentSeat === seat.id && state.phase !== 'done'}
      compact
      showTokens
    >
      {opts?.isHumanControls && (
        <div className="space-y-2 pt-1">
          <HandDropZone
            hand={me.hand}
            pending={state.pendingTake as TakeColor[]}
            bank={state.bank}
            active={Boolean(humanMainTurn)}
            hideHandDisplay
            onDropGem={pickGem}
            onCancelPending={() =>
              setState((s) => (s ? setPendingTake(s, []) : s))
            }
          />
          <ReserveDropZone
            active={Boolean(humanMainTurn) && me.reserved.length < 3}
            title={t('soloReserved')}
            emptyHint={t('soloReserveDrop')}
            onDropCard={reserve}
          >
            {me.reserved.length > 0 ? (
              <ReservedHand
                cards={me.reserved}
                hand={me.hand}
                bonuses={me.bonuses}
                showHints={hints.enabled}
                onBuy={!phaseLocked ? (card) => buy(card, 'reserved') : undefined}
                isExiting={(id) => purchaseFx.isExiting(id)}
              />
            ) : undefined}
          </ReserveDropZone>
        </div>
      )}
    </SeatPanel>
  );

  return (
    <PracticeShell
      eyebrow={t('navStandardPractice')}
      title={t('stdTitle')}
      subtitle={t('stdPlayingSubtitle', {
        players: state.seats.length,
        difficulty: t(difficultyKey(setup.difficulty)),
      })}
      onReset={backToSetup}
      onUndo={undo}
      canUndo={history.length > 0 && Boolean(humanMainTurn)}
      recordLine={
        state.endingRound && state.phase !== 'done'
          ? t('stdEndingRound')
          : t('stdTurnLine', {
              turn: state.turn,
              who: active ? seatDisplayName(active, t) : '—',
            })
      }
      headerExtra={
        <button
          type="button"
          onClick={() => setFastAi((v) => !v)}
          className={`btn-outline text-sm ${
            fastAi
              ? 'border-splendor-gold/70 bg-splendor-gold/10 text-splendor-velvet'
              : ''
          }`}
        >
          {fastAi ? t('stdAiFastOn') : t('stdAiFastOff')}
        </button>
      }
    >
      {winnerText && state && (
        <div className="panel p-4">
          <p className="font-serif text-lg text-splendor-velvet">{winnerText}</p>
          <p className="text-sm text-splendor-muted mt-2 font-serif">
            {state.seats
              .map((s) =>
                t('stdScoreSeat', {
                  name: seatDisplayName(s, t),
                  prestige: s.prestige,
                }),
              )
              .join(' · ')}
          </p>
          <PracticeCoaching
            tips={(() => {
              const human = state.seats.find((s) => s.isHuman);
              if (!human) return [];
              const takeActions = state.log.filter(
                (e) =>
                  (e.kind === 'take3' || e.kind === 'take2') &&
                  e.seat === human.id,
              ).length;
              const buyActions = state.log.filter(
                (e) => e.kind === 'buy' && e.seat === human.id,
              ).length;
              const humanNobles = state.log.filter(
                (e) => e.kind === 'noble' && e.seat === human.id,
              ).length;
              const oppNobles = state.log.filter(
                (e) => e.kind === 'noble' && e.seat !== human.id,
              ).length;
              const oppSeats = state.seats.filter((s) => !s.isHuman);
              const oppLead =
                oppSeats.reduce(
                  (best, s) =>
                    !best || s.prestige > best.prestige ? s : best,
                  null as (typeof oppSeats)[0] | null,
                ) ?? null;
              const oppMax = oppLead?.prestige ?? 0;
              return buildStandardCoaching({
                humanPrestige: human.prestige,
                humanCardCount: human.cardCount,
                humanNoblesApprox: humanNobles,
                oppMaxPrestige: oppMax,
                oppHasNobleLead: oppNobles > humanNobles,
                oppCardCountAtLead: oppLead?.cardCount ?? 0,
                takeActions,
                buyActions,
                won: state.winnerIds.includes(human.id),
                turns: state.turn,
              });
            })()}
          />
        </div>
      )}

      {activeTip && (
        <StandardTipBanner tip={activeTip} onDismiss={dismissTip} />
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
                onSpend={() => claimNoble(n.id)}
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
              ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx', 'gold'] as GemKey[]
            ).map((gem) => {
              const count = me.hand[gem];
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

      <SideTable
        west={
          <>
            {sides.west.map((seat) =>
              renderSeat(seat, { isHumanControls: seat.isHuman }),
            )}
          </>
        }
        east={
          <>
            {sides.east.map((seat) => renderSeat(seat))}
          </>
        }
        center={
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
                    hand={me.hand}
                    bonuses={me.bonuses}
                    phaseLocked={phaseLocked}
                    contested={contestedIds.has(card.id)}
                    onBuy={() => buy(card, 'display', lv)}
                    reservable={
                      Boolean(humanMainTurn) &&
                      state.pendingTake.length === 0 &&
                      me.reserved.length < 3
                    }
                    onReserve={() => reserve(card.id)}
                  />
                ),
              };
            })}
            bank={state.bank}
            bankInteractive={Boolean(humanMainTurn)}
            onBankGem={pickGem}
          />
        }
      />

      <SoloActionLog lines={logLines} />
    </PracticeShell>
  );
}
