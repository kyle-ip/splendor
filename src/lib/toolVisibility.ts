/** Toggle tool nav / homepage entries. Routes stay registered for deep links. */
export const TOOL_VISIBILITY = {
  replay: true,
  solo: true,
  standard: true,
  duel: true,
} as const;

export type ToolVisibilityKey = keyof typeof TOOL_VISIBILITY;

/** First visible tools-index destination (homepage CTA). */
export function firstVisibleToolsPath(): string {
  if (TOOL_VISIBILITY.solo) return '/tools/solo';
  if (TOOL_VISIBILITY.standard) return '/tools/standard';
  if (TOOL_VISIBILITY.duel) return '/tools/duel';
  if (TOOL_VISIBILITY.replay) return '/tools/replay';
  return '/tools/solo';
}
