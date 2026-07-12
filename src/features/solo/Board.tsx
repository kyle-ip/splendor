import type { ReactNode, DragEvent } from 'react';
import { useRef, useState } from 'react';
import type { GemCounts, NobleRequirement } from '@/types';
import type { SoloCard } from '@/data/solo-cards';
import { gems } from '@/lib/assets';
import { useGemLabels } from '@/i18n/useGemLabels';
import { useI18n } from '@/i18n/I18nProvider';
import { canBuy, SoloCardTile } from './shared';
import { useDragFxOptional } from './DragFx';

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
  1: { bg: 'bg-[#2f5d3a]', border: 'border-[#1e3d26]' },
  2: { bg: 'bg-[#b08a2e]', border: 'border-[#7a5e1a]' },
  3: { bg: 'bg-[#2a4a7a]', border: 'border-[#1a2f52]' },
};

export function canAddTakeGem(
  pending: TakeColor[],
  color: TakeColor,
  bank: GemCounts,
): boolean {
  const already = pending.filter((c) => c === color).length;
  if (bank[color] - already < 1) return false;

  if (pending.length === 0) return true;

  if (pending.length === 1) {
    if (color === pending[0]) return bank[color] >= 4;
    return true;
  }

  if (pending.length === 2) {
    if (pending[0] === pending[1]) return false;
    return color !== pending[0] && color !== pending[1];
  }

  return false;
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
      className={`relative aspect-[2/3] w-full max-w-[5.5rem] rounded-md border-2 ${style.border} ${style.bg} shadow-sm flex flex-col items-center justify-end pb-2 select-none`}
      title={`${count}`}
    >
      <span className="font-display text-white/90 text-xs tracking-widest mb-auto mt-3">
        Splendor
      </span>
      <div className="flex gap-1 mb-1">
        {Array.from({ length: level }).map((_, i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/90 shadow-sm"
          />
        ))}
      </div>
      <span className="text-[10px] font-serif text-white/70">{count}</span>
    </div>
  );
}

export function NobleTile({
  noble,
  spent,
}: {
  noble: NobleRequirement;
  spent?: boolean;
}) {
  const reqs = (
    ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'] as const
  ).filter((c) => noble.requirements[c] > 0);

  return (
    <div
      className={`w-[4.5rem] h-[4.5rem] sm:w-[5.25rem] sm:h-[5.25rem] border border-splendor-line bg-[#f3ebe0] p-1.5 flex flex-col ${
        spent ? 'opacity-35 line-through' : ''
      }`}
    >
      <div className="flex items-start gap-1">
        <span className="font-display text-sm text-splendor-velvet leading-none">
          3
        </span>
        <div className="flex flex-col gap-0.5 ml-auto">
          {reqs.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-0.5 text-[10px] font-serif"
            >
              <img src={gems[c]} alt="" className="w-3.5 h-3.5 object-contain" />
              {noble.requirements[c]}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-auto text-[9px] font-serif text-splendor-muted truncate">
        {noble.name}
      </p>
    </div>
  );
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
  const [dragging, setDragging] = useState(false);
  const canInteract = Boolean(draggable && count > 0 && !dimmed);

  return (
    <button
      type="button"
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
      className={`bank-stack-lift relative flex flex-col items-center gap-1 p-1 rounded-md ${
        canInteract
          ? 'cursor-grab active:cursor-grabbing'
          : 'cursor-default'
      } ${dimmed || count <= 0 ? 'opacity-35' : ''} ${
        dragging ? 'is-dragging' : ''
      }`}
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
      <span className="text-xs font-serif text-splendor-ink tabular-nums">
        {count}
      </span>
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
}: {
  hand: GemCounts;
  pending: TakeColor[];
  bank?: GemCounts;
  active?: boolean;
  onDropGem: (color: TakeColor) => void;
  onCancelPending?: () => void;
  children?: ReactNode;
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
      onDropGem(color);
      if (legal) {
        setLandKey((k) => k + 1);
        fx?.sparkleAt(zoneRef.current, gems[color]);
      } else {
        setShakeKey(0);
        requestAnimationFrame(() => setShakeKey(1));
      }
    }
    fx?.endDrag();
  };

  const armed = Boolean(fx?.state.active && fx.state.kind === 'gem' && fx.state.overHand);

  return (
    <div
      ref={zoneRef}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`drop-zone-live panel p-3 sm:p-4 min-h-[7rem] ${
        active ? 'ring-1 ring-splendor-line/80' : ''
      } ${armed ? 'is-armed' : ''} ${shakeKey > 0 ? 'shake-illegal' : ''}`}
      onAnimationEnd={(e) => {
        if (e.animationName === 'shake-illegal') setShakeKey(0);
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs font-serif text-splendor-muted tracking-wide">
          {t('soloYourTokens')}
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

      {pending.length > 0 && (
        <div key={landKey} className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-[11px] font-serif text-splendor-muted">
            {t('soloPendingTake')}:
          </span>
          {pending.map((c, i) => (
            <img
              key={`${c}-${i}-${landKey}`}
              src={gems[c]}
              alt={labels[c]}
              className="w-7 h-7 object-contain gem-land"
            />
          ))}
          <span className="text-[11px] font-serif text-splendor-muted">
            ({pending.length}/3)
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {BANK_ORDER.map((c) =>
          hand[c] > 0 ? (
            <span
              key={c}
              className="inline-flex items-center gap-1 px-2 py-1 border border-splendor-line bg-white/80 text-sm font-serif"
            >
              <img src={gems[c]} alt={labels[c]} className="w-6 h-6 object-contain" />
              {hand[c]}
            </span>
          ) : null,
        )}
        {tokenSum(hand) === 0 && pending.length === 0 && (
          <p className="text-xs font-serif text-splendor-muted/80">
            {active ? t('soloDragHint') : '—'}
          </p>
        )}
      </div>
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
  return (
    <div className="grid grid-cols-[auto_repeat(4,minmax(0,1fr))] gap-2 sm:gap-3 items-stretch">
      <div className="flex items-center">
        <DeckBack level={level} count={deckCount} />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={cards[i]?.id ?? `empty-${level}-${i}`} className="min-w-0">
          {cards[i] ? renderCard(cards[i], i) : (
            <div className="aspect-[2/3] max-h-[9rem] border border-dashed border-splendor-line/40 rounded-sm" />
          )}
        </div>
      ))}
    </div>
  );
}

export function BoardTable({
  nobles,
  spentNobleCount = 0,
  rows,
  bank,
  bankInteractive,
  onBankGem,
  children,
}: {
  nobles: NobleRequirement[];
  spentNobleCount?: number;
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
  const { t } = useI18n();

  return (
    <div className="panel p-3 sm:p-5 space-y-4 sm:space-y-5 bg-[#1a1612]/[0.04]">
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {nobles.map((n, i) => (
          <NobleTile key={n.id} noble={n} spent={i < spentNobleCount} />
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
        <div className="pt-2 border-t border-splendor-line/60">
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
          {bankInteractive && (
            <p className="text-center text-[11px] font-serif text-splendor-muted mt-2">
              {t('soloDragHint')}
            </p>
          )}
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
  disabled,
  onBuy,
  onReserve,
  reservable,
}: {
  card: SoloCard;
  hand: GemCounts;
  bonuses: Omit<GemCounts, 'gold'>;
  disabled?: boolean;
  onBuy?: () => void;
  onReserve?: () => void;
  reservable?: boolean;
}) {
  const { t } = useI18n();
  const fx = useDragFxOptional();
  const [dragging, setDragging] = useState(false);
  const affordable = canBuy(card, hand, bonuses);
  const canDrag = Boolean(reservable && onReserve);

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
      className={`${
        canDrag ? 'card-drag-source cursor-grab active:cursor-grabbing' : ''
      } ${dragging ? 'is-dragging' : ''}`}
    >
      <SoloCardTile
        card={card}
        disabled={disabled || !affordable || !onBuy}
        onClick={affordable && onBuy ? onBuy : undefined}
        badge={affordable && !disabled ? t('soloCanBuy') : undefined}
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
