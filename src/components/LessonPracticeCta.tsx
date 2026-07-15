import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { practiceForLesson } from '@/lib/lessonPractice';
import { InkRule } from '@/components/manuscript/WoodcutFrame';

export function LessonPracticeCta({ lessonId }: { lessonId: string }) {
  const { t } = useI18n();
  const practice = practiceForLesson(lessonId);
  if (!practice) return null;

  return (
    <aside className="mt-8 border-t-2 border-splendor-line/40 pt-6 text-center">
      <p className="font-serif text-[11px] tracking-[0.22em] uppercase text-splendor-muted mb-2">
        {t('practiceCtaTitle')}
      </p>
      <InkRule className="mx-auto mb-4 max-w-[8rem]" />
      <Link
        to={`${practice.path}?from=${encodeURIComponent(lessonId)}`}
        className="btn-gilt inline-flex"
      >
        {t(practice.labelKey ?? 'practiceCtaGo')}
      </Link>
    </aside>
  );
}
