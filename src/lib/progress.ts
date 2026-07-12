const STORAGE_KEY = 'splendor-guide-progress';

export function getCompletedLessons(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function markLessonComplete(lessonId: string): void {
  const completed = getCompletedLessons();
  if (!completed.includes(lessonId)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed, lessonId]));
  }
}

export function isLessonComplete(lessonId: string): boolean {
  return getCompletedLessons().includes(lessonId);
}

export function getProgressPercent(total: number): number {
  if (total === 0) return 0;
  return Math.round((getCompletedLessons().length / total) * 100);
}
