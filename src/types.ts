export type LessonLevel =
  | 'intro'
  | 'basics'
  | 'intermediate'
  | 'advanced'
  | 'duel'
  | 'reference';

export interface LessonMeta {
  id: string;
  title: string;
  level: LessonLevel;
  order: number;
  duration: string;
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
  name: { en: string; zh: string };
  requirements: Omit<GemCounts, 'gold'>;
}

export interface SetupConfig {
  players: number;
  gemsPerColor: number;
  nobles: number;
  gold: number;
}

export interface CardExample {
  id: string;
  name: { en: string; zh: string };
  points: number;
  bonus: keyof Omit<GemCounts, 'gold'>;
  cost: Omit<GemCounts, 'gold'>;
}
