import type { GemCounts } from '@/types';
import { EMPTY_GEMS } from '@/lib/gems';

const COLOR_KEYS = [
  'emerald',
  'sapphire',
  'ruby',
  'diamond',
  'onyx',
  'gold',
] as const;

type ColorKey = (typeof COLOR_KEYS)[number];

const ALIASES: Record<string, ColorKey> = {
  emerald: 'emerald',
  e: 'emerald',
  green: 'emerald',
  sapphire: 'sapphire',
  s: 'sapphire',
  blue: 'sapphire',
  ruby: 'ruby',
  r: 'ruby',
  red: 'ruby',
  diamond: 'diamond',
  d: 'diamond',
  white: 'diamond',
  onyx: 'onyx',
  o: 'onyx',
  black: 'onyx',
  gold: 'gold',
  g: 'gold',
};

function clampGem(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10, Math.floor(n)));
}

/** Parse "emerald:2,sapphire:1" or "e2s1" into gem counts. */
export function parseGemList(
  raw: string | null | undefined,
  allowGold = false,
): GemCounts {
  const out: GemCounts = { ...EMPTY_GEMS };
  if (!raw?.trim()) return out;

  const named = raw.matchAll(/([a-zA-Z]+)\s*[:=]\s*(\d+)/g);
  let matched = false;
  for (const m of named) {
    const key = ALIASES[m[1].toLowerCase()];
    if (!key) continue;
    if (key === 'gold' && !allowGold) continue;
    out[key] = clampGem(Number(m[2]));
    matched = true;
  }
  if (matched) return out;

  const compact = raw.matchAll(/([a-zA-Z])(\d+)/g);
  for (const m of compact) {
    const key = ALIASES[m[1].toLowerCase()];
    if (!key) continue;
    if (key === 'gold' && !allowGold) continue;
    out[key] = clampGem(Number(m[2]));
  }
  return out;
}

/** Read top-level color params (?emerald=2&sapphire=1). */
export function gemsFromColorParams(
  params: URLSearchParams,
  allowGold = false,
): GemCounts {
  const out: GemCounts = { ...EMPTY_GEMS };
  for (const key of COLOR_KEYS) {
    if (key === 'gold' && !allowGold) continue;
    const v = params.get(key);
    if (v != null && v !== '') out[key] = clampGem(Number(v));
  }
  return out;
}

export function readBonusParams(params: URLSearchParams): GemCounts {
  const fromList = parseGemList(params.get('bonus') ?? params.get('b'), false);
  const fromColors = gemsFromColorParams(params, false);
  const merged: GemCounts = { ...EMPTY_GEMS };
  for (const key of COLOR_KEYS) {
    if (key === 'gold') continue;
    merged[key] = Math.max(fromList[key], fromColors[key]);
  }
  return merged;
}

export function readHandParams(params: URLSearchParams): GemCounts {
  return parseGemList(params.get('hand') ?? params.get('h'), true);
}

export function readCostParams(
  params: URLSearchParams,
): Omit<GemCounts, 'gold'> {
  const g = parseGemList(params.get('cost') ?? params.get('c'), false);
  return {
    emerald: g.emerald,
    sapphire: g.sapphire,
    ruby: g.ruby,
    diamond: g.diamond,
    onyx: g.onyx,
  };
}

export function readWeightParam(
  params: URLSearchParams,
  key: string,
  fallback: number,
): number {
  const v = params.get(key);
  if (v == null || v === '') return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(3, n));
}

export function hasAnyGem(counts: GemCounts): boolean {
  return COLOR_KEYS.some((k) => counts[k] > 0);
}
