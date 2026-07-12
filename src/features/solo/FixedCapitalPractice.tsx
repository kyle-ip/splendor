import { useCallback, useState } from 'react';
import noblesData from '@/data/nobles.json';
import type { GemCounts, NobleRequirement } from '@/types';
import {
  LEVEL1_CARDS,
  drawDisplay,
  emptyBonuses,
  payForCard,
  shuffle,
  type SoloCard,
} from '@/data/solo-cards';
import { useGemLabels } from '@/i18n/useGemLabels';
import { useI18n } from '@/i18n/I18nProvider';
import { PracticeShell, TokenRow } from './shared';
import { BoardTable, BuyableCard } from './Board';

const noblesAll = noblesData as NobleRequirement[];

type State = {
  hand: GemCounts;
  bonuses: Omit<GemCounts, 'gold'>;
  display: SoloCard[];
  deck: SoloCard[];
  nobles: NobleRequirement[];
  resetsLeft: number;
  turns: number;
  log: string[];
  won: boolean;
};

function createGame(): State {
  const deck = shuffle(LEVEL1_CARDS);
  const { display, deck: rest } = drawDisplay(deck, 4);
  return {
    hand: {
      emerald: 3,
      sapphire: 3,
      ruby: 3,
      diamond: 3,
      onyx: 3,
      gold: 3,
    },
    bonuses: emptyBonuses(),
    display,
    deck: rest,
    nobles: shuffle(noblesAll).slice(0, 3),
    resetsLeft: 3,
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

export function FixedCapitalPractice() {
  const { t } = useI18n();
  const labels = useGemLabels();
  const [state, setState] = useState<State>(createGame);

  const restart = useCallback(() => setState(createGame()), []);

  const buy = (card: SoloCard) => {
    setState((s) => {
      if (s.won) return s;
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
    });
  };

  const resetRow = () => {
    setState((s) => {
      if (s.won || s.resetsLeft <= 0) return s;
      if (s.deck.length < 4) {
        return {
          ...s,
          log: [t('soloLogResetFail'), ...s.log].slice(0, 12),
        };
      }
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

  return (
    <PracticeShell
      title={t('soloFixedTitle')}
      subtitle={t('soloFixedDesc')}
      onReset={restart}
    >
      {state.won && (
        <div className="panel p-4 border-gem-emerald/40 ring-1 ring-gem-emerald/30">
          <p className="font-serif text-splendor-velvet text-lg">
            {t('soloFixedWin', { turns: state.turns })}
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_16rem] gap-4 items-start">
        <BoardTable
          nobles={state.nobles}
          spentNobleCount={3 - state.resetsLeft}
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
                  disabled={state.won}
                  onBuy={() => buy(card)}
                />
              ),
            },
          ]}
        />

        <aside className="space-y-3">
          <div className="panel p-3 space-y-3">
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
            <button
              type="button"
              className="btn-outline w-full text-sm"
              disabled={state.won || state.resetsLeft <= 0}
              onClick={resetRow}
            >
              {t('soloResetAction')}
            </button>
            {!state.won && (
              <p className="text-[11px] font-serif text-splendor-muted">
                {t('soloPickBuyHint')}
              </p>
            )}
          </div>
        </aside>
      </div>

      {state.log.length > 0 && (
        <section className="panel-soft p-4">
          <p className="text-xs font-serif text-splendor-muted mb-2 tracking-wide">
            {t('soloLog')}
          </p>
          <ul className="space-y-1">
            {state.log.map((line, i) => (
              <li key={i} className="text-sm font-body text-splendor-ink/85">
                {line}
              </li>
            ))}
          </ul>
        </section>
      )}
    </PracticeShell>
  );
}
