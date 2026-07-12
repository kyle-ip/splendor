import { Link, useParams } from 'react-router-dom';
import { LevelHeader } from '@/components/Layout';
import { MarkdownContent } from '@/components/MarkdownContent';
import { PageToc } from '@/components/PageToc';
import {
  getAdjacentLessons,
  getLessonById,
  getLessonsByLevel,
  getLevelInfo,
} from '@/lib/lessons';
import { SetupWizard } from '@/features/tools/SetupWizard';
import { promo } from '@/lib/assets';
import { useI18n } from '@/i18n/I18nProvider';
import { extractToc } from '@/lib/toc';
import type { LessonLevel } from '@/types';

export function LevelPage() {
  const { level } = useParams<{ level: string }>();
  const { locale, t } = useI18n();
  const lessonLevel = level as LessonLevel;
  const levelInfo = getLevelInfo(locale, t);

  if (!levelInfo[lessonLevel]) {
    return <p className="text-splendor-muted font-serif">{t('notFoundLevel')}</p>;
  }

  const levelLessons = getLessonsByLevel(locale, lessonLevel);

  return (
    <div>
      <LevelHeader level={lessonLevel} />
      {lessonLevel === 'intro' && (
        <div className="mb-10 animate-fade-up space-y-4">
          <h2 className="section-title mb-4">{t('setupWizard')}</h2>
          <div className="panel overflow-hidden">
            <div className="bg-[#1a120e] p-3 md:p-4">
              <img
                src={promo.setup}
                alt="Setup"
                className="w-full h-auto object-contain mx-auto"
              />
            </div>
          </div>
          <SetupWizard />
        </div>
      )}
      <div className="space-y-3 animate-fade-up stagger-1">
        {levelLessons.map((lesson) => (
          <Link
            key={lesson.id}
            to={`/learn/${lessonLevel}/${lesson.id}`}
            className="flex justify-between items-center px-4 py-4 panel-soft hover:border-splendor-accent transition-all duration-300 hover:translate-x-1"
          >
            <div>
              <p className="font-serif text-splendor-ink">{lesson.title}</p>
              <p className="text-xs text-splendor-muted mt-1 font-body">
                {lesson.duration}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function LessonPage() {
  const { level, lessonId } = useParams<{ level: string; lessonId: string }>();
  const { locale, t } = useI18n();
  const levelInfo = getLevelInfo(locale, t);

  const lesson = lessonId ? getLessonById(locale, lessonId) : undefined;

  if (!lesson) {
    return <p className="text-splendor-muted font-serif">{t('notFoundLesson')}</p>;
  }

  const { prev, next } = getAdjacentLessons(locale, lesson.id);
  const showToc = extractToc(lesson.content).length >= 4;

  return (
    <article className="animate-fade-up">
      <nav className="text-sm text-splendor-muted mb-4 font-serif">
        <Link
          to={`/learn/${level}`}
          className="hover:text-splendor-velvet transition-colors"
        >
          {levelInfo[lesson.level]?.title}
        </Link>
        <span className="mx-2 text-splendor-accent">/</span>
        <span>{lesson.title}</span>
      </nav>

      <div
        className={
          showToc
            ? 'xl:grid xl:grid-cols-[minmax(0,1fr)_12rem] xl:gap-8 xl:items-start'
            : undefined
        }
      >
        <div className="panel p-6 md:p-10 lg:p-12 min-w-0">
          <header className="mb-8 text-center">
            <p className="font-display text-[10px] tracking-[0.35em] uppercase text-splendor-accent mb-2">
              {t('manuscript')}
            </p>
            <h1 className="font-display text-3xl text-splendor-velvet tracking-wide">
              {lesson.title}
            </h1>
            <p className="text-sm text-splendor-muted mt-2 font-serif">
              {lesson.duration}
            </p>
            <div className="ornament-line my-5 mx-auto max-w-xs" />
          </header>

          <div className="mb-6 xl:hidden">
            <PageToc markdown={lesson.content} minItems={4} />
          </div>
          <MarkdownContent content={lesson.content} />
        </div>

        {showToc && (
          <aside className="hidden xl:block">
            <PageToc markdown={lesson.content} minItems={4} />
          </aside>
        )}
      </div>

      <nav className="mt-8 flex justify-between font-serif text-sm">
        {prev ? (
          <Link
            to={`/learn/${prev.level}/${prev.id}`}
            className="text-splendor-velvet hover:underline underline-offset-4"
          >
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={`/learn/${next.level}/${next.id}`}
            className="text-splendor-velvet hover:underline underline-offset-4"
          >
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
