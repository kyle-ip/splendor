import type { Lesson, LessonLevel } from '@/types';
import { parseFrontmatter } from '@/lib/parseFrontmatter';
import type { Locale } from '@/i18n/messages';

const modules = import.meta.glob('../../content/{en,zh}/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function parseLesson(path: string, raw: string, locale: Locale): Lesson | null {
  const prefix = `../../content/${locale}/`;
  if (!path.startsWith(prefix)) return null;

  const { data, content } = parseFrontmatter(raw);
  const id = path
    .slice(prefix.length)
    .replace('.md', '')
    .replace(/\//g, '-');

  return {
    id,
    title: data.title as string,
    level: data.level as LessonLevel,
    order: data.order as number,
    duration: (data.duration as string) ?? '5 min',
    content,
  };
}

const lessonsByLocale: Record<Locale, Lesson[]> = {
  en: [],
  zh: [],
};

for (const [path, raw] of Object.entries(modules)) {
  for (const locale of ['en', 'zh'] as Locale[]) {
    const lesson = parseLesson(path, raw, locale);
    if (lesson) lessonsByLocale[locale].push(lesson);
  }
}

for (const locale of ['en', 'zh'] as Locale[]) {
  lessonsByLocale[locale].sort((a, b) => a.order - b.order);
}

export function getLessons(locale: Locale): Lesson[] {
  return lessonsByLocale[locale];
}

export function getLessonsByLevel(
  locale: Locale,
  level: LessonLevel,
): Lesson[] {
  return getLessons(locale).filter((l) => l.level === level);
}

export function getLessonById(
  locale: Locale,
  id: string,
): Lesson | undefined {
  return getLessons(locale).find((l) => l.id === id);
}

export function getAdjacentLessons(
  locale: Locale,
  id: string,
): { prev?: Lesson; next?: Lesson } {
  const list = getLessons(locale);
  const index = list.findIndex((l) => l.id === id);
  if (index === -1) return {};
  return {
    prev: index > 0 ? list[index - 1] : undefined,
    next: index < list.length - 1 ? list[index + 1] : undefined,
  };
}

export function getLevelInfo(
  locale: Locale,
  t: (key: import('@/i18n/messages').MessageKey) => string,
): Record<
  LessonLevel,
  { title: string; description: string; path: string; duration: string }
> {
  void locale;
  return {
    intro: {
      title: t('levelIntroTitle'),
      description: t('levelIntroDesc'),
      path: '/learn/intro',
      duration: t('levelIntroDuration'),
    },
    basics: {
      title: t('levelBasicsTitle'),
      description: t('levelBasicsDesc'),
      path: '/learn/basics',
      duration: t('levelBasicsDuration'),
    },
    intermediate: {
      title: t('levelInterTitle'),
      description: t('levelInterDesc'),
      path: '/learn/intermediate',
      duration: t('levelInterDuration'),
    },
    advanced: {
      title: t('levelAdvTitle'),
      description: t('levelAdvDesc'),
      path: '/learn/advanced',
      duration: t('levelAdvDuration'),
    },
    duel: {
      title: t('levelDuelTitle'),
      description: t('levelDuelDesc'),
      path: '/learn/duel',
      duration: t('levelDuelDuration'),
    },
    reference: {
      title: t('levelRefTitle'),
      description: t('levelRefDesc'),
      path: '/reference/rules',
      duration: t('levelRefDuration'),
    },
  };
}
