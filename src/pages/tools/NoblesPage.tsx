import { useSearchParams } from 'react-router-dom';
import { NobleTracker } from '@/features/tools/NobleTracker';
import { useI18n } from '@/i18n/I18nProvider';

export function NoblesPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  return (
    <div>
      <header className="mb-8 animate-fade-up">
        <p className="font-display text-[10px] tracking-[0.35em] uppercase text-splendor-accent/80 mb-2">
          {t('ledgerTool')}
        </p>
        <h1 className="page-title">{t('noblesTitle')}</h1>
        <div className="ornament-line my-4 max-w-sm" />
      </header>
      <NobleTracker key={searchParams.toString()} />
    </div>
  );
}
