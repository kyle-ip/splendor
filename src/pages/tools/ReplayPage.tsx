import { Link, useSearchParams } from 'react-router-dom';
import { ReplayTemplate } from '@/features/tools/ReplayTemplate';
import { useI18n } from '@/i18n/I18nProvider';
import { getLessonById } from '@/lib/lessons';

export function ReplayPage() {
  const { locale, t } = useI18n();
  const [searchParams] = useSearchParams();
  const fromLessonId = searchParams.get('from');
  const fromLesson = fromLessonId
    ? getLessonById(locale, fromLessonId)
    : undefined;

  return (
    <div>
      <header className="mb-8 animate-fade-up">
        <p className="font-display text-[10px] tracking-[0.35em] uppercase text-splendor-accent/80 mb-2">
          {t('ledgerTool')}
        </p>
        <h1 className="page-title">{t('replayTitle')}</h1>
        <div className="ornament-line my-4 max-w-sm" />
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
      </header>
      <ReplayTemplate />
    </div>
  );
}
