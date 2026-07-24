import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { getLessonById, getLevelInfo } from '@/lib/lessons';
import type { LessonLevel } from '@/types';

const LEVELS: LessonLevel[] = [
  'intro',
  'basics',
  'intermediate',
  'advanced',
  'duel',
  'reference',
];

function isLessonLevel(value: string | undefined): value is LessonLevel {
  return !!value && (LEVELS as string[]).includes(value);
}

/** Sets document.title from route + locale. */
export function DocumentTitle() {
  const { pathname } = useLocation();
  const { level, lessonId } = useParams<{ level?: string; lessonId?: string }>();
  const { t, locale } = useI18n();

  useEffect(() => {
    const brand = locale === 'zh' ? '璀璨宝石指南' : 'Splendor Guide';
    let page = '';

    if (pathname === '/' || pathname === '') {
      page = '';
    } else if (pathname.startsWith('/learn/') && lessonId) {
      const lesson = getLessonById(locale, lessonId);
      page = lesson?.title ?? t('navTutorial');
    } else if (pathname.startsWith('/learn/') && isLessonLevel(level)) {
      page = getLevelInfo(locale, t)[level].title;
    } else if (pathname.startsWith('/reference/glossary')) {
      page = t('navGlossary');
    } else if (pathname.startsWith('/reference/rules')) {
      page = t('navRules');
    } else if (pathname.startsWith('/reference/solo')) {
      page = t('navSolo');
    } else if (pathname.startsWith('/reference/expansions')) {
      page = t('navExpansions');
    } else if (pathname.startsWith('/tools/replay')) {
      page = t('navReplay');
    } else if (pathname.startsWith('/tools/solo/fixed')) {
      page = t('soloFixedTitle');
    } else if (pathname.startsWith('/tools/solo/dice')) {
      page = t('soloDiceTitle');
    } else if (pathname.startsWith('/tools/solo/card')) {
      page = t('solo3Title');
    } else if (pathname.startsWith('/tools/solo')) {
      page = t('navSoloPractice');
    } else if (pathname.startsWith('/tools/standard')) {
      page = t('navStandardPractice');
    } else if (pathname.startsWith('/tools/duel')) {
      page = t('navDuelPractice');
    } else {
      page = t('notFoundPage');
    }

    document.title = page ? `${page} · ${brand}` : brand;
  }, [pathname, level, lessonId, locale, t]);

  return null;
}
