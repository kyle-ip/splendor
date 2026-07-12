import { useCallback, useState } from 'react';
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
import { PracticeShell, SoloCardTile, TokenRow, canBuy } from './shared';
import {
  BoardTable,
  BuyableCard,
  HandDropZone,
  ReserveDropZone,
  canAddTakeGem,
  isTakeComplete,
  type TakeColor,
} from './Board';

const COLORS = ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'] as const;
const noblesAll = noblesData as NobleRequirement[];

type Phase = 'player' | 'done';

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
  flash: string | null;
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
    flash: null,
  };
}

function tokenCount(g: GemCounts) {
  return g.emerald + g.sapphire + g.ruby + g.diamond + g.onyx + g.gold;
}

function trimToTen(hand: GemCounts): GemCounts {
  const next = { ...hand };
  let total = tokenCount(next);
  const order: (keyof GemCounts)[] = [
    'diamond',
    'sapphire',
    'emerald',
    'ruby',
    'onyx',
    'gold',
  ];
  while (total > 10) {
    for (const c of order) {
      if (next[c] > 0 && total > 10) {
        next[c] -= 1;
        total -= 1;
      }
    }
  }
  return next;
}

function claimNoble(
  bonuses: Omit<GemCounts, 'gold'>,
  nobles: NobleRequirement[],
): { noble: NobleRequirement | null; rest: NobleRequirement[] } {
  const match = nobles.find((n) =>
    COLORS.every((c) => bonuses[c] >= n.requirements[c]),
  );
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
  const trimmed = trimToTen(hand);
  for (const c of [...COLORS, 'gold'] as const) {
    bank[c] += hand[c] - trimmed[c];
  }
  return {
    ...s,
    hand: trimmed,
    bank,
    pending: [],
    flash: null,
    log: [logLine, ...s.log].slice(0, 14),
  };
}

export function DiceAutomaPractice() {
  const { t } = useI18n();
  const labels = useGemLabels();
  const [state, setState] = useState<State>(createGame);
  const restart = useCallback(() => setState(createGame()), []);

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

  const runAutoma = (s: State): State => {
    let {
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
      log,
    } = s;

    const rows: { level: 1 | 2 | 3; cards: SoloCard[] }[] = [
      { level: 3, cards: l3 },
      { level: 2, cards: l2 },
      { level: 1, cards: l1 },
    ];

    let bought: SoloCard | null = null;
    let buyLevel: 1 | 2 | 3 | null = null;

    for (const row of rows) {
      for (const card of row.cards) {
        if (automaAfford(card, autoBonuses, autoGold)) {
          bought = card;
          buyLevel = row.level;
          break;
        }
      }
      if (bought) break;
    }

    if (bought && buyLevel) {
      const leftGold = automaPay(bought, autoBonuses, autoGold);
      if (leftGold !== null) {
        const spentGold = autoGold - leftGold;
        autoGold = leftGold;
        bank = { ...bank, gold: bank.gold + spentGold };
        autoBonuses = {
          ...autoBonuses,
          [bought.bonus]: autoBonuses[bought.bonus] + 1,
        };
        autoPrestige += bought.points;
        if (buyLevel === 1) {
          l1 = l1.filter((c) => c.id !== bought!.id);
          ({ row: l1, deck: d1 } = refill(l1, d1));
        } else if (buyLevel === 2) {
          l2 = l2.filter((c) => c.id !== bought!.id);
          ({ row: l2, deck: d2 } = refill(l2, d2));
        } else {
          l3 = l3.filter((c) => c.id !== bought!.id);
          ({ row: l3, deck: d3 } = refill(l3, d3));
        }
        log = [
          t('soloLogAutoBuy', { level: buyLevel, points: bought.points }),
          ...log,
        ];

        const claimed = claimNoble(autoBonuses, nobles);
        if (claimed.noble) {
          nobles = claimed.rest;
          autoPrestige += 3;
          log = [t('soloLogAutoNoble'), ...log];
        }

        const next: State = {
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
          flash: null,
          turn: s.turn + 1,
          phase: 'player',
        };
        return { ...next, ...finishIfNeeded(next, false) };
      }
    }

    const dice = 1 + Math.floor(Math.random() * 6);
    log = [t('soloLogDice', { n: dice }), ...log];

    if (dice <= 4) {
      const idx = dice - 1;
      if (l1[idx]) {
        const card = l1[idx];
        autoBonuses = {
          ...autoBonuses,
          [card.bonus]: autoBonuses[card.bonus] + 1,
        };
        autoPrestige += card.points;
        l1 = l1.filter((c) => c.id !== card.id);
        ({ row: l1, deck: d1 } = refill(l1, d1));
        log = [t('soloLogAutoFree', { slot: dice }), ...log];
      } else {
        log = [t('soloLogDiceMiss'), ...log];
      }
    } else if (bank.gold > 0) {
      bank = { ...bank, gold: bank.gold - 1 };
      autoGold += 1;
      log = [t('soloLogAutoGold'), ...log];
    } else {
      log = [t('soloLogNoGold'), ...log];
    }

    const claimed = claimNoble(autoBonuses, nobles);
    if (claimed.noble) {
      nobles = claimed.rest;
      autoPrestige += 3;
      log = [t('soloLogAutoNoble'), ...log];
    }

    const next: State = {
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
      lastDice: dice,
      pending: [],
      flash: null,
      turn: s.turn + 1,
      phase: 'player',
    };
    return { ...next, ...finishIfNeeded(next, false) };
  };

  const afterPlayer = (s: State): State => {
    const claimed = claimNoble(s.bonuses, s.nobles);
    let next = s;
    if (claimed.noble) {
      next = {
        ...s,
        nobles: claimed.rest,
        prestige: s.prestige + 3,
        log: [t('soloLogPlayerNoble'), ...s.log].slice(0, 14),
      };
    }
    const end = finishIfNeeded(next, true);
    if (end.phase === 'done') return { ...next, ...end };
    return runAutoma(next);
  };

  const pickGem = (color: TakeColor) => {
    setState((s) => {
      if (s.phase !== 'player' || s.winner) return s;
      if (!canAddTakeGem(s.pending, color, s.bank)) {
        return { ...s, flash: t('soloDragIllegal') };
      }
      const pending = [...s.pending, color];
      if (!isTakeComplete(pending)) {
        return { ...s, pending, flash: null };
      }
      const logLine =
        pending.length === 2
          ? t('soloLogTake2', { color: labels[pending[0]] })
          : t('soloLogTake3');
      return afterPlayer(applyTake({ ...s, pending: [] }, pending, logLine));
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
      }
      const trimmed = trimToTen(hand);
      bank = {
        ...bank,
        gold: bank.gold + (hand.gold - trimmed.gold),
      };
      return afterPlayer({
        ...s,
        l1,
        l2,
        l3,
        d1,
        d2,
        d3,
        bank,
        hand: trimmed,
        reserved: [...s.reserved, card],
        pending: [],
        flash: null,
        log: [t('soloLogReserve'), ...s.log].slice(0, 14),
      });
    });
  };

  const buy = (
    card: SoloCard,
    from: 'display' | 'reserved',
    level?: 1 | 2 | 3,
  ) => {
    setState((s) => {
      if (s.phase !== 'player' || s.winner) return s;
      if (s.pending.length > 0) return s;
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

      return afterPlayer({
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
        flash: null,
        log: [
          t('soloLogBuy', {
            bonus: labels[card.bonus],
            points: card.points,
          }),
          ...s.log,
        ].slice(0, 14),
      });
    });
  };

  const playerActive = state.phase === 'player' && !state.winner;

  return (
    <PracticeShell
      title={t('soloDiceTitle')}
      subtitle={t('soloDiceDesc')}
      onReset={restart}
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
        </div>
      )}

      {state.flash && (
        <p className="text-sm font-serif text-gem-ruby">{state.flash}</p>
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
                  disabled={!playerActive || state.pending.length > 0}
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
                  disabled={!playerActive || state.pending.length > 0}
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
                  disabled={!playerActive || state.pending.length > 0}
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
              setState((s) => ({ ...s, pending: [], flash: null }))
            }
          />

          <ReserveDropZone
            active={playerActive && state.reserved.length < 3}
            title={t('soloReserved')}
            emptyHint={t('soloReserveDrop')}
            onDropCard={reserve}
          >
            {state.reserved.length > 0 ? (
              <div className="grid gap-2">
                {state.reserved.map((card) => (
                  <SoloCardTile
                    key={card.id}
                    card={card}
                    disabled={
                      !playerActive ||
                      state.pending.length > 0 ||
                      !canBuy(card, state.hand, state.bonuses)
                    }
                    onClick={() => buy(card, 'reserved')}
                    badge={
                      canBuy(card, state.hand, state.bonuses)
                        ? t('soloCanBuy')
                        : undefined
                    }
                  />
                ))}
              </div>
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
            <p className="text-xs font-serif text-splendor-muted">
              {t('gemGold')}: {state.autoGold}
              {state.lastDice != null && (
                <> · {t('soloLastDice')}: {state.lastDice}</>
              )}
            </p>
          </div>
        </aside>
      </div>

      {state.log.length > 0 && (
        <section className="panel-soft p-4">
          <p className="text-xs font-serif text-splendor-muted mb-2">
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
