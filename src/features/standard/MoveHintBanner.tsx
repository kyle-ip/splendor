import { useGemLabels } from '@/i18n/useGemLabels';
import { useI18n } from '@/i18n/I18nProvider';
import type { MoveHint } from './moveHints';

export function MoveHintBanner({
  hint,
  compact,
}: {
  hint: MoveHint;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const labels = useGemLabels();

  const actionText =
    hint.action.type === 'take'
      ? t('hintActionTake', {
          colors: hint.action.colors.map((c) => labels[c]).join(' · '),
        })
      : t(hint.actionKey, hint.actionParams);

  return (
    <div
      className={`border border-splendor-gold/35 bg-splendor-gold/5 rounded-sm space-y-0.5 ${
        compact ? 'px-2 py-1.5' : 'px-3 py-2'
      }`}
    >
      <p
        className={`font-serif tracking-wide uppercase text-splendor-muted ${
          compact ? 'text-[9px]' : 'text-[10px]'
        }`}
      >
        {t('hintMoveTitle')}
      </p>
      <p
        className={`font-serif text-splendor-velvet ${
          compact ? 'text-xs leading-snug' : 'text-sm'
        }`}
      >
        {actionText}
      </p>
      <p
        className={`font-serif text-splendor-ink/80 leading-snug ${
          compact ? 'text-[11px]' : 'text-xs leading-relaxed'
        }`}
      >
        {t(hint.reasonKey)}
      </p>
    </div>
  );
}
