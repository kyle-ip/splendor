export type LessonLevel = 'intro' | 'basics' | 'intermediate' | 'advanced' | 'reference';

export interface LessonMeta {
  id: string;
  title: string;
  level: LessonLevel;
  order: number;
  duration: string;
  quizIds?: string[];
}

export interface Lesson extends LessonMeta {
  content: string;
}

export type GemColor = 'emerald' | 'sapphire' | 'ruby' | 'diamond' | 'onyx' | 'gold';

export interface GemCounts {
  emerald: number;
  sapphire: number;
  ruby: number;
  diamond: number;
  onyx: number;
  gold: number;
}

export interface NobleRequirement {
  id: number;
  name: string;
  requirements: Omit<GemCounts, 'gold'>;
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  level: LessonLevel;
  title: string;
  scenario: string;
  options: QuizOption[];
  correctOptionId: string;
  casualAdvice: string;
  competitiveAdvice: string;
}

export interface SetupConfig {
  players: number;
  gemsPerColor: number;
  nobles: number;
  gold: number;
}

export interface CardExample {
  id: string;
  name: string;
  points: number;
  bonus: keyof Omit<GemCounts, 'gold'>;
  cost: Omit<GemCounts, 'gold'>;
}
