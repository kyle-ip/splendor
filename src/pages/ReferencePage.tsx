import { getLessonById } from '@/lib/lessons';
import { MarkdownContent } from '@/components/MarkdownContent';
import { PageToc } from '@/components/PageToc';
import { RulebookPages } from '@/features/reference/RulebookPages';
import { useI18n } from '@/i18n/I18nProvider';
import { extractToc } from '@/lib/toc';

export function ReferencePage({ lessonId }: { lessonId: string }) {
  const { locale, t } = useI18n();
  const lesson = getLessonById(locale, lessonId);

  if (!lesson) {
    return <p className="text-splendor-muted font-serif">{t('notFoundPage')}</p>;
  }

  const showToc = extractToc(lesson.content).length >= 3;
  const showRulebookPages = lessonId === 'appendix-rules-reference';

  return (
    <article className="animate-fade-up">
      <div
        className={
          showToc
            ? 'xl:grid xl:grid-cols-[minmax(0,1fr)_12rem] xl:gap-8 xl:items-start'
            : undefined
        }
      >
        <div className="panel p-6 md:p-10 lg:p-12 min-w-0">
          <header className="mb-8 text-center">
            <p className="font-display text-[10px] tracking-[0.35em] uppercase text-splendor-brass mb-2">
              {t('appendix')}
            </p>
            <h1 className="font-display text-3xl text-splendor-velvet tracking-wide">
              {lesson.title}
            </h1>
            <div className="ornament-line my-5 mx-auto max-w-xs" />
          </header>

          <div className="mb-6 xl:hidden">
            <PageToc markdown={lesson.content} minItems={3} />
          </div>
          <MarkdownContent content={lesson.content} />
          {showRulebookPages && <RulebookPages />}
        </div>

        {showToc && (
          <aside className="hidden xl:block">
            <PageToc markdown={lesson.content} minItems={3} />
          </aside>
        )}
      </div>
    </article>
  );
}
