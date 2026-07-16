/** Maps lesson IDs to interactive practice entry points. */
export const LESSON_PRACTICE: Record<string, { path: string; labelKey?: 'practiceCtaGo' }> = {
  'part0-intro-00-overview': { path: '/tools/solo' },
  'part0-intro-01-setup': { path: '/tools/standard' },
  'part1-basics-01-turn-actions': { path: '/tools/solo/dice' },
  'part1-basics-02-buying-discounts': { path: '/tools/solo/fixed' },
  'part1-basics-03-nobles': { path: '/tools/solo/dice' },
  'part1-basics-04-reserving': { path: '/tools/standard' },
  'part1-basics-05-endgame': { path: '/tools/standard' },
  'part1-basics-06-common-mistakes': { path: '/tools/replay' },
  'part1-basics-07-first-game-review': { path: '/tools/replay' },
  'part2-intermediate-01-engine': { path: '/tools/solo/fixed' },
  'part2-intermediate-02-noble-planning': { path: '/tools/standard' },
  'part2-intermediate-03-gem-economy': { path: '/tools/solo/dice' },
  'part2-intermediate-04-reservation-tactics': { path: '/tools/standard' },
  'part2-intermediate-05-player-count': { path: '/tools/standard' },
  'part2-intermediate-06-endgame-calc': { path: '/tools/standard' },
  'part2-intermediate-07-level-economy': { path: '/tools/solo/card' },
  'part3-advanced-01-card-evaluation': { path: '/tools/solo/fixed' },
  'part3-advanced-02-reading-the-table': { path: '/tools/standard' },
  'part3-advanced-03-tempo': { path: '/tools/standard' },
  'part3-advanced-04-denial': { path: '/tools/solo/card' },
  'part3-advanced-05-openings': { path: '/tools/standard' },
  'part3-advanced-06-sample-game-3p': { path: '/tools/standard' },
  'part3-advanced-07-sample-game-2p': { path: '/tools/standard' },
  'part3-advanced-08-sample-game-4p': { path: '/tools/standard' },
  'part4-duel-00-overview': { path: '/tools/replay' },
  'part4-duel-01-setup': { path: '/tools/replay' },
  'part4-duel-02-turn-actions': { path: '/tools/standard' },
  'part4-duel-03-abilities-royals': { path: '/tools/replay' },
  'part4-duel-04-pearl-privilege': { path: '/tools/replay' },
  'part4-duel-04-strategy': { path: '/tools/standard' },
  'part4-duel-05-sample-game': { path: '/tools/replay' },
  'appendix-orient-module': { path: '/tools/replay' },
};

export function practiceForLesson(lessonId: string) {
  return LESSON_PRACTICE[lessonId];
}
