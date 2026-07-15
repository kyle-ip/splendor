export type SoloPracticeTier = 'easy' | 'normal' | 'hard';

const STORAGE_KEY = 'splendor-solo-practice-tier';

export function readSoloPracticeTier(): SoloPracticeTier {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'easy' || raw === 'normal' || raw === 'hard') return raw;
  } catch {
    /* ignore */
  }
  return 'normal';
}

export function writeSoloPracticeTier(tier: SoloPracticeTier): void {
  try {
    localStorage.setItem(STORAGE_KEY, tier);
  } catch {
    /* ignore */
  }
}

/** Mode 3: how many ★ cards enter the automa deck. Official = 2. */
export function starCountForTier(tier: SoloPracticeTier): number {
  if (tier === 'easy') return 1;
  if (tier === 'hard') return 4;
  return 2;
}

/**
 * Mode 2 die bias for practice.
 * - easy: 50% chance to reroll 5–6 (weaker gold/free-skew)
 * - hard: if 1–4 would miss empty slot, reroll once
 * - normal: fair d6
 */
export function rollPracticeDie(
  tier: SoloPracticeTier,
  level1Occupied: boolean[],
  rng: () => number = Math.random,
): number {
  let dice = 1 + Math.floor(rng() * 6);

  if (tier === 'easy' && dice >= 5 && rng() < 0.5) {
    dice = 1 + Math.floor(rng() * 4);
  }

  if (tier === 'hard' && dice <= 4) {
    const idx = dice - 1;
    if (!level1Occupied[idx]) {
      dice = 1 + Math.floor(rng() * 6);
    }
  }

  return dice;
}
