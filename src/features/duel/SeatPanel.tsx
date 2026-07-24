import type { ReactNode } from 'react';
import { gems, playerPortraitUrl } from '@/lib/assets';
import { useI18n } from '@/i18n/I18nProvider';
import type { MessageKey } from '@/i18n/messages';
import type { DuelToken } from '@/data/duel-cards';
import type { DuelSeat, SeatNameKey } from './types';
import { OwnedCardsStrip } from './Board';

const NAME_KEYS: Record<SeatNameKey, MessageKey> = {
  you: 'stdName_you',
  marco: 'stdName_marco',
  lucrezia: 'stdName_lucrezia',
};

const TOKEN_ORDER: DuelToken[] = [
  'emerald',
  'sapphire',
  'ruby',
  'diamond',
  'onyx',
  'pearl',
  'gold',
];

const TOKEN_IMG: Record<DuelToken, string> = {
  emerald: gems.emerald,
  sapphire: gems.sapphire,
  ruby: gems.ruby,
  diamond: gems.diamond,
  onyx: gems.onyx,
  gold: gems.gold,
  pearl: gems.pearl,
};

export function duelSeatName(
  seat: DuelSeat,
  t: (key: MessageKey) => string,
): string {
  return t(NAME_KEYS[seat.nameKey]);
}

export function DuelSeatPanel({
  seat,
  active,
  hideReserved,
  onDiscard,
  discardMode,
  onUsePrivilege,
  privilegeArmed,
  footer,
}: {
  seat: DuelSeat;
  active: boolean;
  hideReserved?: boolean;
  onDiscard?: (token: DuelToken) => void;
  discardMode?: boolean;
  onUsePrivilege?: () => void;
  privilegeArmed?: boolean;
  /** Extra controls under this seat (chrome toggle, clear selection, …). */
  footer?: ReactNode;
}) {
  const { t } = useI18n();
  const portraitKey =
    seat.nameKey === 'you'
      ? 'you'
      : seat.nameKey === 'marco'
        ? 'marco'
        : 'lucrezia';

  return (
    <div
      className={`panel p-3 sm:p-4 space-y-2 border ${
        active
          ? 'border-splendor-gold/70 shadow-[0_0_0_1px_rgba(154,123,50,0.25)]'
          : 'border-splendor-line/50'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <img
          src={playerPortraitUrl(portraitKey)}
          alt=""
          className="w-9 h-9 object-cover rounded-sm border border-splendor-line/50"
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-splendor-velvet truncate">
            {duelSeatName(seat, t)}
            {active && (
              <span className="ml-1.5 text-[10px] font-serif text-splendor-gold">
                {t('duelYourTurn')}
              </span>
            )}
          </p>
          <p className="text-xs font-serif text-splendor-muted tabular-nums">
            {t('duelPrestige')}: {seat.prestige} · {t('duelCrowns')}:{' '}
            {seat.crowns} · P×{seat.privileges}
          </p>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-serif text-splendor-muted mb-1">
          {t('duelTokens')}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TOKEN_ORDER.map((tok) => {
            const n = seat.hand[tok];
            return (
              <button
                key={tok}
                type="button"
                disabled={!discardMode || n <= 0 || !onDiscard}
                onClick={() => onDiscard?.(tok)}
                className={`inline-flex items-center gap-1 px-1.5 py-1 border text-sm font-serif tabular-nums ${
                  n === 0 ? 'opacity-35' : ''
                } ${
                  discardMode && n > 0
                    ? 'border-splendor-velvet/50 cursor-pointer'
                    : 'border-splendor-line/40'
                }`}
              >
                <img
                  src={TOKEN_IMG[tok]}
                  alt=""
                  className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                />
                {n}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-serif text-splendor-muted mb-1">
          {t('duelBonuses')}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {(
            ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'] as const
          ).map((g) => (
            <span
              key={g}
              className={`inline-flex items-center gap-1 text-sm font-serif tabular-nums ${
                seat.bonuses[g] === 0 ? 'opacity-35' : ''
              }`}
            >
              <img
                src={TOKEN_IMG[g]}
                alt=""
                className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
              />
              {seat.bonuses[g]}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-serif text-splendor-muted mb-1">
          {t('duelPurchased')}
        </p>
        <OwnedCardsStrip cards={seat.purchased} />
      </div>

      {!hideReserved && seat.reserved.length > 0 && (
        <div>
          <p className="text-[11px] font-serif text-splendor-muted mb-1">
            {t('duelReserved')} ({seat.reserved.length})
          </p>
          <ul className="space-y-1">
            {seat.reserved.map((c) => (
              <li
                key={c.id}
                className="text-[11px] font-serif border border-splendor-line/40 px-1.5 py-1 bg-white/70"
              >
                L{c.level} · {c.prestige}pt
                {c.crowns > 0 ? ` · ♛${c.crowns}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {active && seat.privileges > 0 && onUsePrivilege && (
        <button
          type="button"
          onClick={onUsePrivilege}
          className={`btn-outline text-xs w-full ${
            privilegeArmed ? 'border-splendor-gold/70 bg-splendor-gold/10' : ''
          }`}
        >
          {privilegeArmed
            ? t('duelPrivilegePickToken')
            : t('duelUsePrivilege')}
        </button>
      )}

      {footer}
    </div>
  );
}
