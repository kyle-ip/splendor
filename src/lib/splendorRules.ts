import type { GemCounts } from '@/types';

/** Shared hand-limit helpers used by practice modes. */
export function tokenCount(g: GemCounts): number {
  return g.emerald + g.sapphire + g.ruby + g.diamond + g.onyx + g.gold;
}

/** How many tokens must be returned to reach the 10-token hand limit. */
export function discardNeeded(hand: GemCounts): number {
  return Math.max(0, tokenCount(hand) - 10);
}
