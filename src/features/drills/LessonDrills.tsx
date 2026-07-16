import { drillsForLesson } from './drillData';
import { DrillQuiz } from './DrillQuiz';

export function LessonDrills({ lessonId }: { lessonId: string }) {
  const set = drillsForLesson(lessonId);
  if (!set) return null;
  return <DrillQuiz set={set} />;
}
