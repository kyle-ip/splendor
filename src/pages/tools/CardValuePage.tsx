import { CardEvaluator } from '@/features/tools/CardEvaluator';
import { useI18n } from '@/i18n/I18nProvider';

export function CardValuePage() {
  const { t } = useI18n();
  return (
    <div>
      <header className="mb-8 animate-fade-up">
        <p className="font-display text-[10px] tracking-[0.35em] uppercase text-splendor-accent/80 mb-2">
          {t('ledgerTool')}
        </p>
        <h1 className="page-title">{t('cardValueTitle')}</h1>
        <div className="ornament-line my-4 max-w-sm" />
      </header>
      <CardEvaluator />
    </div>
  );
}
