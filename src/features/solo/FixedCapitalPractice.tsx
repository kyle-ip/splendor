import { useCallback, useEffect, useRef, useState } from 'react';
import type { GemCounts, NobleRequirement } from '@/types';
import {
  LEVEL1_CARDS,
  NOBLES,
  drawDisplay,
  emptyBonuses,
  payForCard,
  shuffle,
  type SoloCard,
} from '@/data/solo-cards';
import { useGemLabels } from '@/i18n/useGemLabels';
import { useI18n } from '@/i18n/I18nProvider';
import { pushCappedHistory } from '@/lib/practiceHistory';
import { PracticeShell, TokenRow } from './shared';
import { BoardTable, BuyableCard } from './Board';
import { usePurchaseFx } from './PurchaseFx';
import { useSoloToast } from './SoloToast';
import { useBankTakeFx } from './BankTakeFx';
import { useWinCelebrateOnce } from './CeremonyFx';
import { useScrollLock } from '@/lib/useScrollLock';
import {
  PracticeCoaching,
  buildFixedCoaching,
} from './PracticeCoaching';
import {
  SoloPracticeTierPicker,
  useSoloPracticeTier,
} from './PracticeTierPicker';
import {
  fixedCapitalStart,
  type SoloPracticeTier,
} from './practiceTier';

const noblesAll = NOBLES;
const BEST_KEY = 'splendor-solo-fixed-best-turns';

type State = {
  hand: GemCounts;
  bonuses: Omit<GemCounts, 'gold'>;
  display: SoloCard[];
  deck: SoloCard[];
  nobles: NobleRequirement[];
  initialResets: number;
  resetsLeft: number;
  turns: number;
  log: string[];
  won: boolean;
};

function createGame(tier: SoloPracticeTier): State {
  const start = fixedCapitalStart(tier);
  const deck = shuffle(LEVEL1_CARDS);
  const { display, deck: rest } = drawDisplay(deck, 4);
  return {
    hand: {
      emerald: start.perColor,
      sapphire: start.perColor,
      ruby: start.perColor,
      diamond: start.perColor,
      onyx: start.perColor,
      gold: start.gold,
    },
    bonuses: emptyBonuses(),
    display,
    deck: rest,
    nobles: shuffle(noblesAll).slice(0, 3),
    initialResets: start.resets,
    resetsLeft: start.resets,
    turns: 0,
    log: [],
    won: false,
  };
}

function won(bonuses: Omit<GemCounts, 'gold'>) {
  return (['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'] as const).every(
    (c) => bonuses[c] >= 4,
  );
}

function readBest(): number | null {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function writeBest(turns: number) {
  try {
    const prev = readBest();
    if (prev === null || turns < prev) {
      localStorage.setItem(BEST_KEY, String(turns));
    }
  } catch {
    /* ignore */
  }
}

export function FixedCapitalPractice() {
  const { t } = useI18n();
  const labels = useGemLabels();
  const purchaseFx = usePurchaseFx();
  const bankFx = useBankTakeFx();
  const toast = useSoloToast();
  const { tier, setTier } = useSoloPracticeTier();
  const [state, setState] = useState<State>(() => createGame(tier));
  const [history, setHistory] = useState<State[]>([]);
  const [bestTurns, setBestTurns] = useState<number | null>(() => readBest());
  const tierBoot = useRef(true);

  useWinCelebrateOnce(state.won, true);
  useScrollLock(!state.won);

  useEffect(() => {
    if (tierBoot.current) {
      tierBoot.current = false;
      return;
    }
    setHistory([]);
    setState(createGame(tier));
  }, [tier]);

  useEffect(() => {
    if (!state.won) return;
    writeBest(state.turns);
    setBestTurns(readBest());
  }, [state.won, state.turns]);

  const pushHistory = (prev: State) => {
    setHistory((h) => pushCappedHistory(h, prev, (s) => s.turns));
  };

  const restart = useCallback(() => {
    setHistory([]);
    setState(createGame(tier));
  }, [tier]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setState(prev);
      return h.slice(0, -1);
    });
  }, []);

  const applyBuy = (s: State, card: SoloCard): State => {
    const paid = payForCard(s.hand, card.cost, s.bonuses);
    if (!paid) return s;
    const bonuses = { ...s.bonuses, [card.bonus]: s.bonuses[card.bonus] + 1 };
    let deck = s.deck;
    let display = s.display.filter((c) => c.id !== card.id);
    if (deck.length > 0) {
      display = [...display, deck[0]];
      deck = deck.slice(1);
    }
    const nextWon = won(bonuses);
    return {
      ...s,
      hand: paid,
      bonuses,
      display,
      deck,
      turns: s.turns + 1,
      won: nextWon,
      log: [
        t('soloLogBuy', {
          bonus: labels[card.bonus],
          points: card.points,
        }),
        ...s.log,
      ].slice(0, 12),
    };
  };

  const buy = (card: SoloCard) => {
    if (state.won || purchaseFx.isAnimating) return;
    const paidPreview = payForCard(state.hand, card.cost, state.bonuses);
    if (!paidPreview) return;
    bankFx.spendDiff(state.hand, paidPreview);

    purchaseFx.run(card.id, 'player', () => {
      setState((s) => {
        pushHistory(s);
        return applyBuy(s, card);
      });
    });
  };

  const resetRow = () => {
    setState((s) => {
      if (s.won || s.resetsLeft <= 0) return s;
      if (s.deck.length < 4) {
        toast.show(t('soloLogResetFail'));
        return {
          ...s,
          log: [t('soloLogResetFail'), ...s.log].slice(0, 12),
        };
      }
      pushHistory(s);
      const { display, deck } = drawDisplay(s.deck, 4);
      return {
        ...s,
        display,
        deck,
        resetsLeft: s.resetsLeft - 1,
        turns: s.turns + 1,
        log: [t('soloLogReset'), ...s.log].slice(0, 12),
      };
    });
  };

  const recordLine =
    bestTurns === null
      ? t('soloBestTurnsNone')
      : t('soloBestTurns', { turns: bestTurns });

  const colors = ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'] as const;
  const colorsAtFour = colors.filter((c) => state.bonuses[c] >= 4).length;
  const maxColorStack = Math.max(...colors.map((c) => state.bonuses[c]));

  return (
    <PracticeShell
      title={t('soloFixedTitle')}
      subtitle={t('soloFixedDesc')}
      onReset={restart}
      onUndo={undo}
      canUndo={history.length > 0 && !purchaseFx.isAnimating}
      focusBoard
      recordLine={recordLine}
      headerExtra={
        <SoloPracticeTierPicker value={tier} onChange={setTier} />
      }
    >
      {state.won && (
        <div className="panel p-4 border-gem-emerald/40 ring-1 ring-gem-emerald/30">
          <p className="font-serif text-splendor-velvet text-lg">
            {t('soloFixedWin', { turns: state.turns })}
          </p>
          <PracticeCoaching
            tips={buildFixedCoaching({
              turns: state.turns,
              resetsUsed: state.initialResets - state.resetsLeft,
              colorsAtFour,
              maxColorStack,
            })}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_16rem] gap-4 items-start">
        <BoardTable
          nobles={state.nobles}
          spentNobleCount={state.initialResets - state.resetsLeft}
          nobleSpendable={!state.won && state.resetsLeft > 0}
          onSpendNoble={resetRow}
          rows={[
            {
              level: 1,
              deckCount: state.deck.length,
              cards: state.display,
              renderCard: (card) => (
                <BuyableCard
                  card={card}
                  hand={state.hand}
                  bonuses={state.bonuses}
                  phaseLocked={state.won || purchaseFx.isAnimating}
                  onBuy={() => buy(card)}
                />
              ),
            },
          ]}
        />

        <aside className="space-y-3">
          <div className="panel p-3 space-y-3" data-hand-zone="" data-seat-target="player">
            <TokenRow values={state.hand} title={t('soloYourTokens')} />
            <TokenRow
              values={state.bonuses}
              showGold={false}
              title={t('soloYourBonuses')}
            />
            <p className="text-xs font-serif text-splendor-muted">
              {t('soloTurns')}: {state.turns} · {t('soloResetsLeft')}:{' '}
              {state.resetsLeft}
            </p>
            <p className="text-[11px] font-serif text-splendor-muted leading-relaxed">
              {t('soloFixedGoal')}
            </p>
            {!state.won && state.resetsLeft > 0 && (
              <p className="text-[11px] font-serif text-splendor-muted leading-relaxed">
                {t('soloFixedResetHint')}
              </p>
            )}
            {!state.won && (
              <p className="text-[11px] font-serif text-splendor-muted">
                {t('soloPickBuyHint')}
              </p>
            )}
          </div>
        </aside>
      </div>
    </PracticeShell>
  );
}
