import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import type { StandardTip } from './practiceTips';

export function StandardTipBanner({
  tip,
  onDismiss,
  compact,
}: {
  tip: StandardTip;
  onDismiss: (id: string) => void;
  compact?: boolean;
}) {
  const { t } = useI18n();

  return (
    <div
      className={`flex items-start gap-2 ${
        compact
          ? 'border border-splendor-line/35 bg-white/80 rounded-sm px-2 py-1.5'
          : 'flex-wrap gap-x-3 gap-y-1 border-b border-splendor-line/30 pb-3'
      }`}
    >
      <p
        className={`flex-1 min-w-0 font-serif text-splendor-ink/90 ${
          compact ? 'text-[11px] leading-snug' : 'text-sm leading-relaxed min-w-[12rem]'
        }`}
      >
        {t(tip.messageKey)}
        {tip.lessonPath && (
          <>
            {' '}
            <Link
              to={tip.lessonPath}
              className="text-splendor-velvet underline underline-offset-2 hover:text-splendor-gold"
            >
              {t('coachReadLesson')}
            </Link>
          </>
        )}
      </p>
      <button
        type="button"
        onClick={() => onDismiss(tip.id)}
        className="shrink-0 text-[10px] font-serif text-splendor-muted hover:text-splendor-velvet underline underline-offset-2"
      >
        {t('stdTipDismiss')}
      </button>
    </div>
  );
}
