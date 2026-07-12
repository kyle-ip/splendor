import type { ReactNode } from 'react';
import type { GemCounts } from '@/types';
import type { SoloCard } from '@/data/solo-cards';
import { gems } from '@/lib/assets';
import { useGemLabels } from '@/i18n/useGemLabels';
import { useI18n } from '@/i18n/I18nProvider';
import { payForCard } from '@/data/solo-cards';

const COLORS = ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'] as const;

export function TokenRow({
  values,
  showGold = true,
  title,
}: {
  values: GemCounts | Omit<GemCounts, 'gold'>;
  showGold?: boolean;
  title?: string;
}) {
  const labels = useGemLabels();
  const keys = showGold
    ? ([...COLORS, 'gold'] as const)
    : COLORS;

  return (
    <div>
      {title && (
        <p className="text-xs font-serif text-splendor-muted mb-2 tracking-wide">
          {title}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {keys.map((k) => (
          <span
            key={k}
            className="inline-flex items-center gap-1 px-2 py-1 border border-splendor-line bg-white/70 text-sm font-serif"
          >
            <img src={gems[k]} alt={labels[k]} className="w-7 h-7 object-contain" />
            {(values as GemCounts)[k] ?? 0}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SoloCardTile({
  card,
  onClick,
  disabled,
  badge,
}: {
  card: SoloCard;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
}) {
  const labels = useGemLabels();
  const costBits = COLORS.filter((c) => card.cost[c] > 0);

  return (
    <button
      type="button"
      disabled={disabled || !onClick}
      onClick={onClick}
      className={`text-left p-2 sm:p-3 border bg-white/90 transition-colors w-full aspect-[2/3] max-h-[9.5rem] flex flex-col ${
        disabled
          ? 'border-splendor-line opacity-50 cursor-default'
          : 'border-splendor-line hover:border-splendor-gold cursor-pointer'
      }`}
    >
      <div className="flex justify-between items-start gap-1 mb-1">
        <span className="font-display text-base sm:text-lg text-splendor-velvet leading-none">
          {card.points || ''}
        </span>
        <span className="inline-flex items-center">
          <img
            src={gems[card.bonus]}
            alt={labels[card.bonus]}
            className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
          />
        </span>
      </div>
      {badge && (
        <p className="text-[9px] uppercase tracking-wider text-splendor-accent mb-1 font-serif">
          {badge}
        </p>
      )}
      <div className="mt-auto flex flex-col gap-0.5">
        {costBits.map((c) => (
          <span key={c} className="inline-flex items-center gap-0.5 text-xs font-serif">
            <img src={gems[c]} alt="" className="w-4 h-4 object-contain" />
            {card.cost[c]}
          </span>
        ))}
      </div>
    </button>
  );
}

export function canBuy(
  card: SoloCard,
  hand: GemCounts,
  bonuses: Omit<GemCounts, 'gold'>,
): boolean {
  return payForCard(hand, card.cost, bonuses) !== null;
}

export function LogLine({ children }: { children: ReactNode }) {
  return (
    <li className="text-sm text-splendor-ink/85 font-body leading-snug">{children}</li>
  );
}

export function PracticeShell({
  title,
  subtitle,
  onReset,
  children,
}: {
  title: string;
  subtitle: string;
  onReset: () => void;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <header>
        <p className="font-serif text-[11px] tracking-[0.22em] uppercase text-splendor-muted mb-2">
          {t('soloPractice')}
        </p>
        <h1 className="page-title">{title}</h1>
        <div className="ornament-line my-4" />
        <p className="font-serif text-splendor-muted leading-relaxed">{subtitle}</p>
        <button type="button" onClick={onReset} className="btn-outline mt-4 text-sm">
          {t('soloRestart')}
        </button>
      </header>
      {children}
    </div>
  );
}
