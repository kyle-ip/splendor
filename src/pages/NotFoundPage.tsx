import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <div className="py-16 text-center animate-fade-up">
      <p className="font-serif text-[11px] tracking-[0.28em] uppercase text-splendor-muted mb-3">
        404
      </p>
      <h1 className="page-title mb-4">{t('notFoundPage')}</h1>
      <div className="ornament-line mx-auto my-6 max-w-xs" />
      <Link to="/" className="btn-gilt inline-flex">
        {t('backHome')}
      </Link>
    </div>
  );
}
