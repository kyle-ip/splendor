import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import type { StandardTip } from './practiceTips';

export function StandardTipBanner({
  tip,
  onDismiss,
}: {
  tip: StandardTip;
  onDismiss: (id: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-start gap-x-3 gap-y-1 border-b border-splendor-line/30 pb-3">
      <p className="flex-1 min-w-[12rem] text-sm font-serif text-splendor-ink/90 leading-relaxed">
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
        className="shrink-0 text-xs font-serif text-splendor-muted hover:text-splendor-velvet underline underline-offset-2"
      >
        {t('stdTipDismiss')}
      </button>
    </div>
  );
}
