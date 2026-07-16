import { useI18n } from '@/i18n/I18nProvider';
import type { MoveHint } from './moveHints';

export function MoveHintBanner({ hint }: { hint: MoveHint }) {
  const { t } = useI18n();

  return (
    <div className="border border-splendor-gold/35 bg-splendor-gold/5 rounded-sm px-3 py-2 space-y-0.5">
      <p className="text-[10px] font-serif tracking-wide uppercase text-splendor-muted">
        {t('hintMoveTitle')}
      </p>
      <p className="text-sm font-serif text-splendor-velvet">
        {t(hint.actionKey, hint.actionParams)}
      </p>
      <p className="text-xs font-serif text-splendor-ink/80 leading-relaxed">
        {t(hint.reasonKey)}
      </p>
    </div>
  );
}
