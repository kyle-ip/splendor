import type { ReactNode, DragEvent } from 'react';
import { useRef, useState } from 'react';
import type { GemCounts, NobleRequirement } from '@/types';
import type { SoloCard } from '@/data/solo-cards';
import { gems, promo, noblePortraitUrl } from '@/lib/assets';
import { useGemLabels } from '@/i18n/useGemLabels';
import { useI18n } from '@/i18n/I18nProvider';
import { canBuy, SoloCardTile } from './shared';
import { useDragFxOptional } from './DragFx';
import { usePurchaseFxOptional } from './PurchaseFx';
import { useSoloHintsOptional } from './SoloHints';
import { useBankTakeFxOptional } from './BankTakeFx';

export const BANK_ORDER = [
  'emerald',
  'diamond',
  'sapphire',
  'onyx',
  'ruby',
  'gold',
] as const;

export type GemColor = (typeof BANK_ORDER)[number];
export type TakeColor = Exclude<GemColor, 'gold'>;

const TAKE_COLORS: TakeColor[] = [
  'emerald',
  'diamond',
  'sapphire',
  'onyx',
  'ruby',
];

const DECK_STYLE: Record<1 | 2 | 3, { bg: string; border: string }> = {
  1: { bg: 'bg-[#6b8f78]', border: 'border-[#5a7a66]' },
  2: { bg: 'bg-[#c4a96a]', border: 'border-[#a89055]' },
  3: { bg: 'bg-[#6a8098]', border: 'border-[#5a6e84]' },
};

export function canAddTakeGem(
  pending: TakeColor[],
  color: TakeColor,
  bank: GemCounts,
): boolean {
  return getTakeRejectionReason(pending, color, bank) === null;
}

export type TakeRejectKey =
  | 'soloTakeRejectEmpty'
  | 'soloTakeRejectPair'
  | 'soloTakeRejectThirdDup'
  | 'soloTakeRejectFull'
  | 'soloDragIllegal';

export function getTakeRejectionReason(
  pending: TakeColor[],
  color: TakeColor,
  bank: GemCounts,
): TakeRejectKey | null {
  const already = pending.filter((c) => c === color).length;
  if (bank[color] - already < 1) return 'soloTakeRejectEmpty';

  if (pending.length === 0) return null;

  if (pending.length === 1) {
    if (color === pending[0]) return bank[color] >= 4 ? null : 'soloTakeRejectPair';
    return null;
  }

  if (pending.length === 2) {
    if (pending[0] === pending[1]) return 'soloTakeRejectFull';
    if (color === pending[0] || color === pending[1]) return 'soloTakeRejectThirdDup';
    return null;
  }

  return 'soloTakeRejectFull';
}

export function isTakeComplete(pending: TakeColor[]): boolean {
  if (pending.length === 2 && pending[0] === pending[1]) return true;
  if (pending.length === 3) {
    return new Set(pending).size === 3;
  }
  return false;
}

export function DeckBack({
  level,
  count,
}: {
  level: 1 | 2 | 3;
  count: number;
}) {
  const style = DECK_STYLE[level];
  return (
    <div
      className={`relative aspect-[63/88] w-full max-h-[11.5rem] rounded-sm border border-splendor-ink/30 ${style.bg} shadow-[0_1px_4px_rgba(44,36,28,0.1),inset_0_1px_0_rgba(255,255,255,0.15)] flex flex-col items-center justify-end pb-2 select-none overflow-hidden`}
      title={`${count}`}
    >
      <div className="mb-auto mt-2.5 px-1.5 w-[88%] flex justify-center">
        <img
          src={promo.title}
          alt="Splendor"
          className="w-full h-auto object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
          draggable={false}
        />
      </div>
      <div className="flex gap-1 mb-1">
        {Array.from({ length: level }).map((_, i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/90 border border-black/15"
          />
        ))}
      </div>
      <span className="text-[10px] font-serif text-white/80 tabular-nums">{count}</span>
    </div>
  );
}

export function NobleTile({
  noble,
  spent,
  spendable,
  onSpend,
}: {
  noble: NobleRequirement;
  spent?: boolean;
  /** Unspent noble that can be clicked to spend (fixed-capital reset) */
  spendable?: boolean;
  onSpend?: () => void;
}) {
  const reqs = (
    ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'] as const
  ).filter((c) => noble.requirements[c] > 0);

  const portrait = noblePortraitUrl(noble.id);
  const interactive = Boolean(!spent && spendable && onSpend);
  const className = `relative aspect-square w-[5.75rem] sm:w-[6.75rem] rounded-sm overflow-hidden border-2 border-splendor-ink/35 shadow-[0_1px_6px_rgba(44,36,28,0.12),inset_0_0_0_1px_rgba(232,223,200,0.35)] ${
    portrait
      ? 'bg-[#3a322c]'
      : 'bg-gradient-to-br from-[#6a584e] via-[#4a3d36] to-[#322a26]'
  } ${spent ? 'opacity-40' : ''} ${
    interactive
      ? 'cursor-pointer transition-[transform,box-shadow] hover:scale-[1.02] hover:border-splendor-gold/70 hover:shadow-[0_2px_10px_rgba(154,123,50,0.25)]'
      : ''
  }`;

  const inner = (
    <>
      {portrait && (
        <img
          src={portrait}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover object-[center_20%] sepia-[0.35] contrast-[1.05] ${
            spent ? 'grayscale' : ''
          }`}
          draggable={false}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 pointer-events-none" />
      <div className="relative z-[1] h-full p-1.5 sm:p-2 flex flex-col justify-between">
        <span className="font-display text-base sm:text-lg text-[#faf4e8] leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
          3
        </span>
        <div className="flex flex-row flex-wrap items-center justify-center gap-x-1 gap-y-0.5">
          {reqs.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-0.5 text-xs sm:text-sm font-serif font-medium tabular-nums text-[#f5efe6] drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
            >
              <img
                src={gems[c]}
                alt=""
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain shrink-0 drop-shadow-sm"
              />
              {noble.requirements[c]}
            </span>
          ))}
        </div>
      </div>
    </>
  );

  if (interactive) {
    return (
      <button type="button" className={`${className} text-left`} onClick={onSpend}>
        {inner}
      </button>
    );
  }

  return <div className={className}>{inner}</div>;
}

export function BankStack({
  color,
  count,
  draggable,
  dimmed,
  onDragStart,
  onClick,
}: {
  color: GemColor;
  count: number;
  draggable?: boolean;
  dimmed?: boolean;
  onDragStart?: (e: DragEvent) => void;
  onClick?: () => void;
}) {
  const labels = useGemLabels();
  const fx = useDragFxOptional();
  const bankFx = useBankTakeFxOptional();
  const [dragging, setDragging] = useState(false);
  const canInteract = Boolean(draggable && count > 0 && !dimmed);
  const popping = Boolean(bankFx?.isPopping(color));

  return (
    <button
      type="button"
      data-bank-gem={color}
      disabled={!canInteract && !onClick}
      draggable={canInteract}
      onDragStart={
        canInteract
          ? (e) => {
              setDragging(true);
              if (color !== 'gold') {
                fx?.beginGemDrag(e, color as TakeColor);
              }
              onDragStart?.(e);
            }
          : undefined
      }
      onDragEnd={() => {
        setDragging(false);
        fx?.endDrag();
      }}
      onClick={onClick}
      className={`bank-stack-lift relative flex flex-col items-center gap-1.5 p-1 rounded-md ${
        canInteract
          ? 'cursor-grab active:cursor-grabbing'
          : 'cursor-default'
      } ${dimmed || count <= 0 ? 'opacity-35' : ''} ${
        dragging ? 'is-dragging' : ''
      } ${popping ? 'is-taken' : ''}`}
      aria-label={labels[color]}
    >
      <div className="relative w-12 h-12 sm:w-14 sm:h-14">
        {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
          <img
            key={i}
            src={gems[color]}
            alt=""
            className="absolute w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow"
            style={{
              left: i * 3,
              top: (2 - i) * 3,
              zIndex: i,
            }}
            draggable={false}
          />
        ))}
        {count === 0 && (
          <img
            src={gems[color]}
            alt=""
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain opacity-30"
            draggable={false}
          />
        )}
      </div>
      <span className="bank-stack-count">{count}</span>
    </button>
  );
}

export function HandDropZone({
  hand,
  pending,
  bank,
  active,
  onDropGem,
  onCancelPending,
  children,
  hideHandDisplay = false,
}: {
  hand: GemCounts;
  pending: TakeColor[];
  bank?: GemCounts;
  active?: boolean;
  onDropGem: (color: TakeColor) => void;
  onCancelPending?: () => void;
  children?: ReactNode;
  /** When stats are shown elsewhere — only pending / drop target */
  hideHandDisplay?: boolean;
}) {
  const { t } = useI18n();
  const labels = useGemLabels();
  const fx = useDragFxOptional();
  const zoneRef = useRef<HTMLDivElement>(null);
  const [landKey, setLandKey] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);

  const onDragOver = (e: DragEvent) => {
    if (!active) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDragEnter = (e: DragEvent) => {
    if (!active) return;
    if (e.dataTransfer.types.includes('application/x-splendor-gem')) {
      fx?.setOverHand(true);
    }
  };

  const onDragLeave = (e: DragEvent) => {
    if (!zoneRef.current?.contains(e.relatedTarget as Node)) {
      fx?.setOverHand(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    if (!active) return;
    e.preventDefault();
    fx?.setOverHand(false);
    const color = e.dataTransfer.getData('application/x-splendor-gem') as TakeColor;
    if (TAKE_COLORS.includes(color)) {
      const legal = !bank || canAddTakeGem(pending, color, bank);
      if (legal) {
        onDropGem(color);
        setLandKey((k) => k + 1);
        fx?.sparkleAt(zoneRef.current, gems[color]);
      } else {
        onDropGem(color);
        setShakeKey(0);
        requestAnimationFrame(() => setShakeKey(1));
      }
    }
    fx?.endDrag();
  };

  const armed = Boolean(fx?.state.active && fx.state.kind === 'gem' && fx.state.overHand);
  const showPendingChrome = pending.length > 0;
  const showHandHeader = !hideHandDisplay || showPendingChrome;

  return (
    <div
      ref={zoneRef}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`drop-zone-live ${
        hideHandDisplay && !showPendingChrome
          ? `min-h-[2.5rem] rounded-md border border-dashed border-splendor-line/50 ${
              active ? 'bg-white/30' : 'bg-transparent'
            }`
          : `panel-soft p-3 ${
              hideHandDisplay ? 'min-h-[3.5rem]' : 'min-h-[7rem] sm:p-4'
            }`
      } ${
        !hideHandDisplay || showPendingChrome
          ? `${active ? 'ring-1 ring-splendor-line/80' : ''} `
          : ''
      }${armed ? 'is-armed' : ''} ${shakeKey > 0 ? 'shake-illegal' : ''}`}
      onAnimationEnd={(e) => {
        if (e.animationName === 'shake-illegal') setShakeKey(0);
      }}
      aria-label={hideHandDisplay ? t('soloPendingTake') : t('soloYourTokens')}
    >
      {showHandHeader && (
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs font-serif text-splendor-muted tracking-wide">
            {hideHandDisplay ? t('soloPendingTake') : t('soloYourTokens')}
          </p>
          {pending.length > 0 && onCancelPending && (
            <button
              type="button"
              className="text-[11px] font-serif text-splendor-accent hover:underline"
              onClick={onCancelPending}
            >
              {t('soloCancelPick')}
            </button>
          )}
        </div>
      )}

      {pending.length > 0 && (
        <div key={landKey} className="flex flex-wrap items-center gap-2 mb-3">
          {pending.map((c, i) => (
            <img
              key={`${c}-${i}-${landKey}`}
              src={gems[c]}
              alt={labels[c]}
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain gem-land"
            />
          ))}
          <span className="text-sm sm:text-base font-display tabular-nums text-splendor-ink">
            ({pending.length}/3)
          </span>
        </div>
      )}

      {!hideHandDisplay && (
        <div className="flex flex-wrap gap-2">
          {BANK_ORDER.map((c) => {
            const count = hand[c];
            if (count === 0 && c !== 'gold') return null;
            return (
              <span
                key={c}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-splendor-line bg-white/90 text-base font-serif tabular-nums ${
                  count === 0 ? 'opacity-45' : ''
                }`}
              >
                <img
                  src={gems[c]}
                  alt={labels[c]}
                  className="w-8 h-8 object-contain"
                />
                {count}
              </span>
            );
          })}
          {tokenSum(hand) === 0 && pending.length === 0 && !active && (
            <p className="text-xs font-serif text-splendor-muted/80">—</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function tokenSum(g: GemCounts) {
  return g.emerald + g.sapphire + g.ruby + g.diamond + g.onyx + g.gold;
}

export function CardRow({
  level,
  deckCount,
  cards,
  renderCard,
}: {
  level: 1 | 2 | 3;
  deckCount: number;
  cards: SoloCard[];
  renderCard: (card: SoloCard, index: number) => ReactNode;
}) {
  const purchaseFx = usePurchaseFxOptional();

  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3 items-start">
      <div className="min-w-0">
        <DeckBack level={level} count={deckCount} />
      </div>
      {Array.from({ length: 4 }).map((_, i) => {
        const card = cards[i];
        const exiting = card && purchaseFx?.isExiting(card.id);
        const exitBuyer = purchaseFx?.exitBuyer;
        return (
          <div key={card?.id ?? `empty-${level}-${i}`} className="min-w-0">
            {card ? (
              <div
                data-solo-card={card.id}
                className={`relative transition-none ${
                  exiting && exitBuyer
                    ? `card-purchase-exit card-purchase-exit--${exitBuyer}`
                    : ''
                }`}
              >
                {renderCard(card, i)}
              </div>
            ) : (
              <div className="aspect-[63/88] max-h-[11.5rem] w-full rounded-sm border border-dashed border-splendor-line/35 bg-white/50 card-slot-refill" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function BoardTable({
  nobles,
  spentNobleCount = 0,
  nobleSpendable,
  onSpendNoble,
  rows,
  bank,
  bankInteractive,
  onBankGem,
  children,
}: {
  nobles: NobleRequirement[];
  spentNobleCount?: number;
  nobleSpendable?: boolean;
  onSpendNoble?: () => void;
  rows: {
    level: 1 | 2 | 3;
    deckCount: number;
    cards: SoloCard[];
    renderCard: (card: SoloCard, index: number) => ReactNode;
  }[];
  bank?: GemCounts;
  bankInteractive?: boolean;
  onBankGem?: (color: TakeColor) => void;
  children?: ReactNode;
}) {
  return (
    <div className="practice-board p-3 sm:p-5 space-y-4 sm:space-y-5">
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {nobles.map((n, i) => (
          <NobleTile
            key={n.id}
            noble={n}
            spent={i < spentNobleCount}
            spendable={nobleSpendable && i >= spentNobleCount}
            onSpend={onSpendNoble}
          />
        ))}
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {rows.map((row) => (
          <CardRow
            key={row.level}
            level={row.level}
            deckCount={row.deckCount}
            cards={row.cards}
            renderCard={row.renderCard}
          />
        ))}
      </div>

      {bank && (
        <div className="pt-2 border-t border-splendor-line/25">
          <div className="flex flex-wrap justify-center items-end gap-1 sm:gap-3">
            {BANK_ORDER.map((color) => {
              const isGold = color === 'gold';
              const interactive =
                Boolean(bankInteractive) && !isGold && bank[color] > 0;
              return (
                <BankStack
                  key={color}
                  color={color}
                  count={bank[color]}
                  draggable={interactive}
                  dimmed={bank[color] <= 0}
                  onClick={
                    interactive && onBankGem
                      ? () => onBankGem(color as TakeColor)
                      : undefined
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

export function BuyableCard({
  card,
  hand,
  bonuses,
  phaseLocked,
  contested,
  onBuy,
  onReserve,
  reservable,
}: {
  card: SoloCard;
  hand: GemCounts;
  bonuses: Omit<GemCounts, 'gold'>;
  /** Not player's turn or mid take — no buy/reserve actions */
  phaseLocked?: boolean;
  /** Opponent can afford this card (shown only when hints are on) */
  contested?: boolean;
  onBuy?: () => void;
  onReserve?: () => void;
  reservable?: boolean;
}) {
  const fx = useDragFxOptional();
  const hints = useSoloHintsOptional();
  const [dragging, setDragging] = useState(false);
  const affordable = canBuy(card, hand, bonuses);
  const canBuyNow = affordable && !phaseLocked && Boolean(onBuy);
  const canDrag = Boolean(reservable && onReserve && !phaseLocked);
  const showHints = Boolean(hints?.enabled);

  return (
    <div
      draggable={canDrag}
      onDragStart={
        canDrag
          ? (e) => {
              setDragging(true);
              fx?.beginCardDrag(e, card.id, gems[card.bonus]);
            }
          : undefined
      }
      onDragEnd={() => {
        setDragging(false);
        fx?.endDrag();
      }}
      className={`relative ${
        canDrag ? 'card-drag-source cursor-grab active:cursor-grabbing' : ''
      } ${dragging ? 'is-dragging' : ''}`}
    >
      <SoloCardTile
        card={card}
        bonuses={showHints ? bonuses : undefined}
        affordable={showHints && canBuyNow}
        contested={showHints && contested}
        onClick={canBuyNow ? onBuy : undefined}
      />
    </div>
  );
}

export function ReserveDropZone({
  active,
  children,
  emptyHint,
  title,
  onDropCard,
}: {
  active: boolean;
  title: string;
  emptyHint: string;
  children?: ReactNode;
  onDropCard: (cardId: string) => void;
}) {
  const fx = useDragFxOptional();
  const zoneRef = useRef<HTMLDivElement>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [landKey, setLandKey] = useState(0);

  const onDragOver = (e: DragEvent) => {
    if (!active) return;
    if (e.dataTransfer.types.includes('application/x-splendor-card')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const onDragEnter = (e: DragEvent) => {
    if (!active) return;
    if (e.dataTransfer.types.includes('application/x-splendor-card')) {
      fx?.setOverReserve(true);
    }
  };

  const onDragLeave = (e: DragEvent) => {
    if (!zoneRef.current?.contains(e.relatedTarget as Node)) {
      fx?.setOverReserve(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    fx?.setOverReserve(false);
    if (!active) {
      setShakeKey(0);
      requestAnimationFrame(() => setShakeKey(1));
      fx?.endDrag();
      return;
    }
    const id = e.dataTransfer.getData('application/x-splendor-card');
    if (id) {
      onDropCard(id);
      setLandKey((k) => k + 1);
      fx?.sparkleAt(zoneRef.current, gems.gold);
    }
    fx?.endDrag();
  };

  const armed = Boolean(
    fx?.state.active && fx.state.kind === 'card' && fx.state.overReserve,
  );

  return (
    <div
      ref={zoneRef}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`drop-zone-live panel-soft p-3 min-h-[5.5rem] ${
        active ? 'ring-1 ring-dashed ring-splendor-line' : ''
      } ${armed ? 'is-armed' : ''} ${shakeKey > 0 ? 'shake-illegal' : ''}`}
      onAnimationEnd={(e) => {
        if (e.animationName === 'shake-illegal') setShakeKey(0);
      }}
    >
      <p className="text-xs font-serif text-splendor-muted mb-2">{title}</p>
      <div key={landKey} className={landKey > 0 ? 'card-land' : undefined}>
        {children ?? (
          <p className="text-[11px] font-serif text-splendor-muted/80">
            {emptyHint}
          </p>
        )}
      </div>
    </div>
  );
}
