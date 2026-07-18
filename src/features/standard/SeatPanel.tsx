import type { ReactNode } from 'react';
import type { GemCounts } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import { useGemLabels } from '@/i18n/useGemLabels';
import { gems, playerPortraitUrl } from '@/lib/assets';
import type { Seat, SeatNameKey } from './types';

const COLORS = ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'] as const;

const NAME_KEYS: Record<SeatNameKey, MessageKey> = {
  you: 'stdName_you',
  marco: 'stdName_marco',
  lucrezia: 'stdName_lucrezia',
  cosimo: 'stdName_cosimo',
  isabella: 'stdName_isabella',
};

export function seatDisplayName(
  seat: Seat,
  t: (key: MessageKey, vars?: Record<string, string | number>) => string,
): string {
  return t(NAME_KEYS[seat.nameKey]);
}

/**
 * Split seats onto West / East columns (up to 2 each).
 * Human always on West (bottom when West has two). Others follow turn order.
 * 2p: W[you] E[ai]
 * 3p: W[ai, you] E[ai]
 * 4p: W[ai, you] E[ai, ai]
 */
export function seatsToSides(
  seats: Seat[],
  humanId: number,
): { west: Seat[]; east: Seat[] } {
  const n = seats.length;
  const start = seats.findIndex((s) => s.id === humanId);
  const human = seats[start] ?? seats.find((s) => s.isHuman)!;
  const after: Seat[] = [];
  for (let i = 1; i < n; i++) {
    after.push(seats[(start + i) % n]);
  }

  if (n <= 2) {
    return { west: [human], east: after.slice(0, 1) };
  }
  if (n === 3) {
    return { west: [after[0], human], east: [after[1]] };
  }
  return { west: [after[0], human], east: [after[1], after[2]] };
}

function IconCountRow({
  label,
  values,
  showGold = false,
  stacked = false,
}: {
  label: string;
  values: GemCounts | Omit<GemCounts, 'gold'>;
  showGold?: boolean;
  stacked?: boolean;
}) {
  const labels = useGemLabels();
  const keys = showGold
    ? ([...COLORS, 'gold'] as const)
    : COLORS;

  const chips = (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 min-w-0">
      {keys.map((k) => {
        const count = (values as GemCounts)[k] ?? 0;
        return (
          <span
            key={k}
            className={`inline-flex items-center gap-0.5 tabular-nums text-xs font-serif shrink-0 ${
              count === 0 ? 'opacity-35' : ''
            }`}
            title={labels[k]}
          >
            <img
              src={gems[k]}
              alt={labels[k]}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain"
            />
            {count}
          </span>
        );
      })}
    </div>
  );

  if (stacked) {
    return (
      <div className="min-w-0 space-y-0.5">
        <span className="block text-[11px] font-serif text-splendor-muted tracking-wide">
          {label}
        </span>
        {chips}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
      <span className="text-xs font-serif text-splendor-muted shrink-0 tracking-wide">
        {label}
      </span>
      {chips}
    </div>
  );
}

export function SeatStatLines({
  prestige,
  bonuses,
  hand,
  showHand = true,
  reservedCount,
  stackedRows = false,
  prestigeTarget,
  prestigeSeatId,
}: {
  prestige: number;
  bonuses: Omit<GemCounts, 'gold'>;
  hand?: GemCounts;
  showHand?: boolean;
  reservedCount?: number;
  stackedRows?: boolean;
  prestigeTarget?: 'player' | 'opponent';
  prestigeSeatId?: number;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-1 min-w-0">
      <p className="font-serif text-sm text-splendor-ink/90 flex flex-wrap items-baseline gap-x-2">
        <span className="text-xs text-splendor-muted tracking-wide">
          {t('soloPrestige')}
        </span>
        <span
          className="tabular-nums font-display text-base text-splendor-velvet"
          {...(prestigeTarget ? { 'data-prestige': prestigeTarget } : {})}
          {...(prestigeSeatId != null
            ? { 'data-prestige-seat': prestigeSeatId }
            : {})}
        >
          {prestige}
        </span>
        {reservedCount != null && reservedCount > 0 && (
          <span className="text-xs text-splendor-muted">
            · {t('soloReserved')} {reservedCount}
          </span>
        )}
      </p>
      <IconCountRow
        label={t('soloYourBonuses')}
        values={bonuses}
        stacked={stackedRows}
      />
      {showHand && hand && (
        <IconCountRow
          label={t('soloYourTokens')}
          values={hand}
          showGold
          stacked={stackedRows}
        />
      )}
    </div>
  );
}

export function SeatPanel({
  seat,
  isCurrent,
  compact,
  showTokens,
  children,
}: {
  seat: Seat;
  isCurrent: boolean;
  compact?: boolean;
  showTokens?: boolean;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  const name = seatDisplayName(seat, t);
  const avatar = playerPortraitUrl(seat.nameKey);

  return (
    <div
      className={`std-seat relative p-2 sm:p-2.5 space-y-1.5 min-w-0 ${
        seat.isHuman ? 'std-seat--human' : 'std-seat--ai'
      } ${isCurrent ? 'std-seat--current' : ''} ${compact ? 'w-full' : ''}`}
      data-seat-id={seat.id}
      data-seat-target={seat.isHuman ? 'player' : 'opponent'}
    >
      <div className="flex items-center gap-2 min-w-0">
        <img
          src={avatar}
          alt=""
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-sm object-cover object-top shrink-0 border border-splendor-ink/20 shadow-[0_1px_4px_rgba(44,36,28,0.1)] sepia-[0.2] ${
            seat.isHuman
              ? 'border-[#7a3a28]/70'
              : 'border-[var(--lapis)]/70'
          }`}
          draggable={false}
        />
        <div className="min-w-0 flex-1">
          <p className="font-serif text-splendor-ink text-sm leading-snug truncate">
            {name}
          </p>
          <p
            className={`text-[11px] font-serif leading-none mt-0.5 ${
              isCurrent ? 'text-splendor-velvet' : 'invisible'
            }`}
          >
            {t('stdActing')}
          </p>
        </div>
      </div>
      <SeatStatLines
        prestige={seat.prestige}
        bonuses={seat.bonuses}
        hand={seat.hand}
        showHand={showTokens}
        stackedRows={compact}
        prestigeTarget={seat.isHuman ? 'player' : 'opponent'}
        prestigeSeatId={seat.id}
        reservedCount={
          !seat.isHuman && seat.reserved.length > 0
            ? seat.reserved.length
            : undefined
        }
      />
      {children}
    </div>
  );
}

/** Wide board center with player columns on East / West only. */
export function SideTable({
  west,
  east,
  center,
  footer,
}: {
  west: ReactNode;
  east: ReactNode;
  center: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="std-sides space-y-2">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(9.5rem,11.5rem)_minmax(0,1fr)_minmax(9.5rem,11.5rem)] gap-2 items-start">
        <div className="std-sides__west order-2 lg:order-1 flex flex-col gap-1.5 min-w-0">
          {west}
        </div>
        <div className="std-sides__center order-1 lg:order-2 min-w-0">
          {center}
        </div>
        <div className="std-sides__east order-3 flex flex-col gap-1.5 min-w-0">
          {east}
        </div>
      </div>
      {footer ? <div className="std-sides__footer">{footer}</div> : null}
    </div>
  );
}
