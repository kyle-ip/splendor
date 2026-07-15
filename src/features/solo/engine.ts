import type { GemCounts, NobleRequirement } from '@/types';

export const COLORS = [
  'emerald',
  'sapphire',
  'ruby',
  'diamond',
  'onyx',
] as const;

export type TakeColor = (typeof COLORS)[number];

export type TakeRejectKey =
  | 'soloTakeRejectEmpty'
  | 'soloTakeRejectPair'
  | 'soloTakeRejectThirdDup'
  | 'soloTakeRejectFull'
  | 'soloDragIllegal';

export function getTakeRejectionReason(
  pending: TakeColor[],
  color: TakeColor,
  bank: GemCounts,
): TakeRejectKey | null {
  const already = pending.filter((c) => c === color).length;
  if (bank[color] - already < 1) return 'soloTakeRejectEmpty';

  if (pending.length === 0) return null;

  if (pending.length === 1) {
    if (color === pending[0]) return bank[color] >= 4 ? null : 'soloTakeRejectPair';
    return null;
  }

  if (pending.length === 2) {
    if (pending[0] === pending[1]) return 'soloTakeRejectFull';
    if (color === pending[0] || color === pending[1]) return 'soloTakeRejectThirdDup';
    return null;
  }

  return 'soloTakeRejectFull';
}

export function canAddTakeGem(
  pending: TakeColor[],
  color: TakeColor,
  bank: GemCounts,
): boolean {
  return getTakeRejectionReason(pending, color, bank) === null;
}

export function isTakeComplete(pending: TakeColor[]): boolean {
  if (pending.length === 2 && pending[0] === pending[1]) return true;
  if (pending.length === 3) {
    return new Set(pending).size === 3;
  }
  return false;
}

export function eligibleNobles(
  bonuses: Omit<GemCounts, 'gold'>,
  nobles: NobleRequirement[],
): NobleRequirement[] {
  return nobles.filter((n) =>
    COLORS.every((c) => bonuses[c] >= n.requirements[c]),
  );
}

export function tokenCount(g: GemCounts): number {
  return g.emerald + g.sapphire + g.ruby + g.diamond + g.onyx + g.gold;
}

export { refill } from '@/features/standard/engine';
