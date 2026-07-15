import { Link, useParams } from 'react-router-dom';
import { LevelHeader } from '@/components/Layout';
import { LessonPracticeCta } from '@/components/LessonPracticeCta';
import { MarkdownContent } from '@/components/MarkdownContent';
import { PageToc } from '@/components/PageToc';
import {
  getAdjacentLessons,
  getLessonById,
  getLessonsByLevel,
  getLevelInfo,
} from '@/lib/lessons';
import { promo } from '@/lib/assets';
import { useI18n } from '@/i18n/I18nProvider';
import { extractToc } from '@/lib/toc';
import { InkRule } from '@/components/manuscript/WoodcutFrame';
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
          <h2 className="section-title-folio mb-2">{t('navIntro')}</h2>
          <InkRule className="mx-auto mb-4 max-w-[10rem]" />
          <figure>
            <div className="plate-window p-2 md:p-3">
              <img
                src={promo.setup}
                alt="Setup"
                className="w-full h-auto object-contain mx-auto"
              />
            </div>
          </figure>
        </div>
      )}
      <div className="mb-6 animate-fade-up">
        <h2 className="section-title-folio mb-2">{t('chapterIndex')}</h2>
        <InkRule className="mx-auto mb-4 max-w-[10rem]" />
      </div>
      <nav
        aria-label={t('chapterIndex')}
        className="border-y border-splendor-line/35 py-1 animate-fade-up stagger-1"
      >
        {levelLessons.map((lesson, i) => (
          <Link
            key={lesson.id}
            to={`/learn/${lessonLevel}/${lesson.id}`}
            className="toc-row"
          >
            <span className="toc-roman">{String(i + 1).padStart(2, '0')}</span>
            <span className="toc-title">{lesson.title}</span>
            <span className="toc-leader" aria-hidden />
            <span className="toc-meta">{lesson.duration}</span>
          </Link>
        ))}
      </nav>
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
            ? 'xl:grid xl:grid-cols-[minmax(0,1fr)_11rem] xl:gap-5 xl:items-start'
            : undefined
        }
      >
        <div className="panel p-5 md:p-7 lg:p-8 min-w-0">
          <header className="mb-8 text-center">
            <p className="font-display text-[10px] tracking-[0.35em] uppercase text-splendor-accent mb-2">
              {t('manuscript')}
            </p>
            <h1 className="font-display text-3xl text-splendor-velvet tracking-woodcut">
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
          <LessonPracticeCta lessonId={lesson.id} />
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
