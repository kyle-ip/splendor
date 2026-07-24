import type { ReactNode } from 'react';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { GemCounts } from '@/types';
import type { SoloCard } from '@/data/solo-cards';
import { gems } from '@/lib/assets';
import { useGemLabels } from '@/i18n/useGemLabels';
import { useI18n } from '@/i18n/I18nProvider';
import { payForCard } from '@/data/solo-cards';
import { getLessonById } from '@/lib/lessons';
import { InkRule } from '@/components/manuscript/WoodcutFrame';
import { useSoloHintsOptional } from './SoloHints';

const COLORS = ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'] as const;

type PracticeChromeApi = {
  chromeOpen: boolean;
  toggleChrome: () => void;
  /** Compact title line when chrome is collapsed (for inline toolbars). */
  collapsedLabel: string | null;
};

const PracticeChromeContext = createContext<PracticeChromeApi | null>(null);

export function usePracticeChromeOptional(): PracticeChromeApi | null {
  return useContext(PracticeChromeContext);
}

export function TokenRow({
  values,
  showGold = true,
  title,
  inline = false,
  dense = false,
}: {
  values: GemCounts | Omit<GemCounts, 'gold'>;
  showGold?: boolean;
  title?: string;
  /** Title and chips on one horizontal band */
  inline?: boolean;
  /** Smaller chips for side seats */
  dense?: boolean;
}) {
  const labels = useGemLabels();
  const keys = showGold
    ? ([...COLORS, 'gold'] as const)
    : COLORS;

  const chip = dense
    ? 'inline-flex items-center gap-1 px-1.5 py-1 border border-splendor-line/50 bg-white text-sm font-serif tabular-nums'
    : 'inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-splendor-line/50 bg-white text-base font-serif tabular-nums';
  const img = dense ? 'w-6 h-6 object-contain' : 'w-8 h-8 object-contain';

  return (
    <div className={inline ? 'flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0' : ''}>
      {title && (
        <p
          className={`text-xs font-serif text-splendor-muted tracking-wide ${
            inline ? 'mb-0 shrink-0' : 'mb-2'
          }`}
        >
          {title}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {keys.map((k) => {
          const count = (values as GemCounts)[k] ?? 0;
          return (
            <span
              key={k}
              className={`${chip} ${
                count === 0 && k === 'gold' ? 'opacity-45' : ''
              }`}
            >
              <img src={gems[k]} alt={labels[k]} className={img} />
              {count}
            </span>
          );
        })}
      </div>
    </div>
  );
}

const LEVEL_BAND: Record<1 | 2 | 3, string> = {
  1: 'bg-[#6b8f78]',
  2: 'bg-[#c4a96a]',
  3: 'bg-[#6a8098]',
};

export function SoloCardTile({
  card,
  onClick,
  affordable,
  contested,
  suggested,
  badge,
  bonuses,
}: {
  card: SoloCard;
  onClick?: () => void;
  /** Ring highlight when the player can afford this card now */
  affordable?: boolean;
  /** Opponent can currently afford this card (distinct from buyable gold ring) */
  contested?: boolean;
  /** Practice AI recommends this card */
  suggested?: boolean;
  badge?: string;
  /** Permanent gem bonuses — show (-N) on costs covered by owned cards */
  bonuses?: Omit<GemCounts, 'gold'>;
}) {
  const labels = useGemLabels();
  const { t } = useI18n();
  const costBits = COLORS.filter((c) => card.cost[c] > 0);

  const clickable = Boolean(onClick);

  const ringClass = [
    suggested
      ? 'border-gem-emerald/70 shadow-[0_2px_10px_rgba(60,120,80,0.22),0_0_0_1px_rgba(60,120,80,0.4)]'
      : affordable
        ? 'border-splendor-gold/80 shadow-[0_2px_8px_rgba(154,123,50,0.2),0_0_0_1px_rgba(154,123,50,0.35)] hover:scale-[1.01]'
      : contested
        ? 'border-splendor-velvet/55 shadow-[0_2px_8px_rgba(90,40,50,0.14),0_0_0_1px_rgba(90,40,50,0.28)]'
        : '',
    affordable && contested && !suggested
      ? 'ring-1 ring-offset-1 ring-splendor-velvet/45'
      : '',
    suggested ? 'ring-1 ring-offset-1 ring-gem-emerald/50' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      onMouseDown={(e) => {
        if (onClick) e.preventDefault();
      }}
      className={`solo-card-tile solo-card-face relative text-left pt-3.5 p-2 sm:pt-4 sm:p-2.5 bg-[var(--board-ivory)] flex flex-col overflow-hidden rounded-sm transition-[border-color,box-shadow,transform] border border-splendor-ink/30 shadow-[0_1px_4px_rgba(44,36,28,0.08)] ${ringClass} ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span
        className={`absolute inset-x-0 top-0 h-2.5 ${LEVEL_BAND[card.level]}`}
        aria-hidden
      />
      {(suggested || contested) && (
        <span className="absolute right-1.5 top-1/2 z-[1] -translate-y-1/2 flex flex-col items-center gap-1.5 pointer-events-none">
          {suggested && (
            <svg
              viewBox="0 0 12 11"
              className="w-3 h-[0.6875rem]"
              role="img"
              aria-label={t('hintDotSuggested')}
            >
              <title>{t('hintDotSuggested')}</title>
              <polygon
                points="6,0.75 11.25,10.25 0.75,10.25"
                fill="var(--gem-emerald)"
                stroke="#fff"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
          )}
          {contested && (
            <svg
              viewBox="0 0 12 11"
              className="w-3 h-[0.6875rem]"
              role="img"
              aria-label={t('hintDotContested')}
            >
              <title>{t('hintDotContested')}</title>
              <polygon
                points="0.75,0.75 11.25,0.75 6,10.25"
                fill="var(--velvet)"
                stroke="#fff"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      )}
      <div className="flex justify-between items-start gap-1 mb-1 min-h-0 shrink">
        <span className="font-display text-lg sm:text-xl text-splendor-velvet leading-none tabular-nums font-semibold tracking-woodcut">
          {card.points || '\u00a0'}
        </span>
        <span className="inline-flex items-center shrink-0">
          <img
            data-solo-card-bonus
            src={gems[card.bonus]}
            alt={labels[card.bonus]}
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-[0_1px_2px_rgba(44,36,28,0.28)]"
          />
        </span>
      </div>
      {badge && (
        <p className="text-[9px] uppercase tracking-wider text-splendor-accent mb-1 font-serif">
          {badge}
        </p>
      )}
      <div className="mt-auto pt-1 flex flex-col gap-0.5 shrink-0 min-h-0">
        {costBits.map((c) => {
          const base = card.cost[c];
          const covered =
            bonuses && base > 0 ? Math.min(bonuses[c], base) : 0;
          const remaining = Math.max(0, base - covered);
          return (
            <span
              key={c}
              className="inline-flex items-center gap-0.5 text-xs sm:text-sm font-serif font-medium tabular-nums leading-none"
            >
              <img
                src={gems[c]}
                alt=""
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 object-contain shrink-0"
              />
              {covered > 0 ? (
                <>
                  <span className="text-splendor-ink tabular-nums">{remaining}</span>
                  <span
                    className="text-[10px] sm:text-[11px] font-serif font-semibold text-gem-emerald leading-none whitespace-nowrap"
                    title={`${base}−${covered}`}
                  >
                    (−{covered})
                  </span>
                </>
              ) : (
                <span>{base}</span>
              )}
            </span>
          );
        })}
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

/** Compact reserved-card strip (not full tiles) for the side panel. */
export function ReservedHand({
  cards,
  hand,
  bonuses,
  showHints,
  onBuy,
  isExiting,
}: {
  cards: SoloCard[];
  hand: GemCounts;
  bonuses: Omit<GemCounts, 'gold'>;
  showHints?: boolean;
  onBuy?: (card: SoloCard) => void;
  isExiting?: (cardId: string) => boolean;
}) {
  const labels = useGemLabels();
  const { t } = useI18n();

  if (cards.length === 0) return null;

  return (
    <ul className="space-y-1.5">
      {cards.map((card) => {
        const affordable = canBuy(card, hand, bonuses);
        const canBuyNow = affordable && Boolean(onBuy);
        const costBits = COLORS.filter((c) => card.cost[c] > 0);
        const exiting = isExiting?.(card.id);
        return (
          <li
            key={card.id}
            data-solo-card={card.id}
            className={
              exiting ? 'card-purchase-exit card-purchase-exit--player' : ''
            }
          >
            <button
              type="button"
              disabled={!canBuyNow}
              onClick={() => canBuyNow && onBuy?.(card)}
              title={
                canBuyNow
                  ? t('soloCanBuy')
                  : `${labels[card.bonus]}${card.points ? ` · ${card.points}` : ''}`
              }
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-lg border border-splendor-ink/15 bg-white shadow-[0_1px_4px_rgba(44,36,28,0.06)] transition-colors ${
                showHints && canBuyNow
                  ? 'border-splendor-gold/80 cursor-pointer hover:bg-splendor-gold/10'
                  : canBuyNow
                    ? 'cursor-pointer hover:border-splendor-gold/50'
                    : 'opacity-90 cursor-default'
              }`}
            >
              <img
                src={gems[card.bonus]}
                alt={labels[card.bonus]}
                className="w-6 h-6 object-contain shrink-0"
              />
              <span className="font-display text-sm text-splendor-velvet tabular-nums w-4 shrink-0">
                {card.points || '·'}
              </span>
              <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0 flex-1">
                {costBits.map((c) => {
                  const base = card.cost[c];
                  const covered =
                    showHints && base > 0
                      ? Math.min(bonuses[c], base)
                      : 0;
                  const remaining = Math.max(0, base - covered);
                  return (
                    <span
                      key={c}
                      className="inline-flex items-center gap-0.5 text-xs font-serif tabular-nums text-splendor-ink/85"
                    >
                      <img
                        src={gems[c]}
                        alt=""
                        className="w-3.5 h-3.5 object-contain"
                      />
                      {covered > 0 ? (
                        <>
                          <span>{remaining}</span>
                          <span
                            className="text-[10px] font-semibold text-gem-emerald whitespace-nowrap"
                            title={`${base}−${covered}`}
                          >
                            (−{covered})
                          </span>
                        </>
                      ) : (
                        base
                      )}
                    </span>
                  );
                })}
              </span>
              {canBuyNow && (
                <span className="text-[10px] font-serif tracking-wide text-splendor-velvet shrink-0">
                  {t('soloCanBuy')}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function PracticeShell({
  title,
  subtitle,
  onReset,
  onUndo,
  canUndo,
  recordLine,
  eyebrow,
  headerExtra,
  focusBoard = false,
  /** Put chrome toggle in children via usePracticeChromeOptional (no top bar). */
  inlineChromeToggle = false,
  children,
}: {
  title: string;
  subtitle: string;
  onReset: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  recordLine?: string;
  /** Defaults to solo practice label */
  eyebrow?: string;
  /** Rendered after the hints toggle (e.g. AI speed) */
  headerExtra?: ReactNode;
  /** Collapse chrome and enlarge the board while a game is in progress. */
  focusBoard?: boolean;
  inlineChromeToggle?: boolean;
  children: ReactNode;
}) {
  const { locale, t } = useI18n();
  const hints = useSoloHintsOptional();
  const [searchParams] = useSearchParams();
  const fromLessonId = searchParams.get('from');
  const fromLesson = fromLessonId
    ? getLessonById(locale, fromLessonId)
    : undefined;
  const [chromeOpen, setChromeOpen] = useState(!focusBoard);

  useEffect(() => {
    if (!focusBoard) {
      setChromeOpen(true);
      return;
    }
    setChromeOpen(false);
    document.documentElement.setAttribute('data-practice-focus', '1');
    return () => {
      document.documentElement.removeAttribute('data-practice-focus');
    };
  }, [focusBoard]);

  const chromeApi = useMemo<PracticeChromeApi>(
    () => ({
      chromeOpen,
      toggleChrome: () => setChromeOpen((o) => !o),
      collapsedLabel: !chromeOpen
        ? `${title}${recordLine ? ` · ${recordLine}` : ''}`
        : null,
    }),
    [chromeOpen, title, recordLine],
  );

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={onReset} className="btn-outline text-sm">
        {t('soloRestart')}
      </button>
      {onUndo && (
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="btn-outline text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          title={t('soloUndoCapHint')}
        >
          {t('soloUndo')}
        </button>
      )}
      {onUndo && !focusBoard && (
        <span className="text-xs font-serif text-splendor-muted">
          {t('soloUndoCapHint')}
        </span>
      )}
      {hints && (
        <button
          type="button"
          onClick={hints.toggle}
          aria-pressed={hints.enabled}
          className={`btn-outline text-sm ${
            hints.enabled
              ? 'border-splendor-gold/70 bg-splendor-gold/10 text-splendor-velvet'
              : ''
          }`}
        >
          {hints.enabled ? t('soloHintsOn') : t('soloHintsOff')}
        </button>
      )}
      {headerExtra}
    </div>
  );

  const titleBlock = (
    <>
      <p className="font-serif text-[11px] tracking-[0.22em] uppercase text-splendor-muted mb-2">
        {eyebrow ?? t('soloPractice')}
      </p>
      <h1 className="page-title">{title}</h1>
      <InkRule className="my-4" />
      <p className="font-serif text-splendor-muted leading-relaxed">{subtitle}</p>
      {fromLesson && (
        <p className="mt-2">
          <Link
            to={`/learn/${fromLesson.level}/${fromLesson.id}`}
            className="text-sm font-serif text-splendor-velvet underline decoration-splendor-ink/25 hover:decoration-splendor-velvet"
          >
            ← {t('practiceBackToLesson')}: {fromLesson.title}
          </Link>
        </p>
      )}
      {recordLine && (
        <p className="mt-2 text-sm font-serif text-splendor-ink/70">{recordLine}</p>
      )}
    </>
  );

  if (focusBoard) {
    const board = (
      <div className="space-y-1.5">
        {!inlineChromeToggle && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setChromeOpen((o) => !o)}
              aria-expanded={chromeOpen}
              className="btn-outline text-sm"
            >
              {chromeOpen ? t('practiceHideChrome') : t('practiceShowChrome')}
            </button>
            {!chromeOpen && (
              <p className="text-xs font-serif text-splendor-muted truncate min-w-0">
                {title}
                {recordLine ? ` · ${recordLine}` : ''}
              </p>
            )}
          </div>
        )}
        {chromeOpen && (
          <header className="panel-soft p-3 sm:p-4 space-y-3">
            {titleBlock}
            {controls}
          </header>
        )}
        <div className="ledger-sheet p-1 sm:p-2 space-y-2">{children}</div>
      </div>
    );

    if (inlineChromeToggle) {
      return (
        <PracticeChromeContext.Provider value={chromeApi}>
          {board}
        </PracticeChromeContext.Provider>
      );
    }
    return board;
  }

  return (
    <div className="space-y-6">
      <header>
        {titleBlock}
        <div className="mt-4">{controls}</div>
      </header>
      <div className="ledger-sheet p-3 sm:p-5 space-y-4">{children}</div>
    </div>
  );
}
