/** Solo Mode 3 Automa action cards (simplified digital encoding of print AI-1–AI-12). */

export type AutomaBand =
  | { kind: 'take'; nums: number[] }
  | { kind: 'gain'; discard: number; level: 1 | 2 | 3; slot: number };

export type AutomaCardDef = {
  id: number;
  star: boolean;
  top: AutomaBand;
  middle: AutomaBand;
  bottom: AutomaBand;
};

/** Numbers map: 1 onyx, 2 emerald, 3 sapphire, 4 ruby, 5 diamond */
export const AUTOMA_CARDS: AutomaCardDef[] = [
  {
    id: 1,
    star: false,
    top: { kind: 'take', nums: [5, 1, 4] },
    middle: { kind: 'gain', discard: 2, level: 1, slot: 0 },
    bottom: { kind: 'take', nums: [2, 3] },
  },
  {
    id: 2,
    star: false,
    top: { kind: 'gain', discard: 2, level: 1, slot: 1 },
    middle: { kind: 'take', nums: [1, 2, 3] },
    bottom: { kind: 'gain', discard: 3, level: 2, slot: 0 },
  },
  {
    id: 3,
    star: false,
    top: { kind: 'take', nums: [2, 4, 5] },
    middle: { kind: 'gain', discard: 3, level: 1, slot: 2 },
    bottom: { kind: 'take', nums: [1, 3, 5] },
  },
  {
    id: 4,
    star: false,
    top: { kind: 'gain', discard: 2, level: 1, slot: 3 },
    middle: { kind: 'take', nums: [4, 5] },
    bottom: { kind: 'gain', discard: 3, level: 2, slot: 1 },
  },
  {
    id: 5,
    star: false,
    top: { kind: 'take', nums: [1, 3] },
    middle: { kind: 'gain', discard: 2, level: 2, slot: 2 },
    bottom: { kind: 'take', nums: [2, 4, 5] },
  },
  {
    id: 6,
    star: false,
    top: { kind: 'gain', discard: 3, level: 1, slot: 0 },
    middle: { kind: 'take', nums: [3, 4, 5] },
    bottom: { kind: 'gain', discard: 4, level: 2, slot: 3 },
  },
  {
    id: 7,
    star: false,
    top: { kind: 'take', nums: [1, 2, 5] },
    middle: { kind: 'gain', discard: 3, level: 2, slot: 0 },
    bottom: { kind: 'take', nums: [3, 4] },
  },
  {
    id: 8,
    star: false,
    top: { kind: 'gain', discard: 2, level: 2, slot: 1 },
    middle: { kind: 'take', nums: [1, 4] },
    bottom: { kind: 'gain', discard: 4, level: 3, slot: 0 },
  },
  {
    id: 9,
    star: true,
    top: { kind: 'take', nums: [1, 2, 3, 4] },
    middle: { kind: 'gain', discard: 3, level: 3, slot: 1 },
    bottom: { kind: 'gain', discard: 4, level: 3, slot: 2 },
  },
  {
    id: 10,
    star: true,
    top: { kind: 'gain', discard: 3, level: 2, slot: 2 },
    middle: { kind: 'take', nums: [2, 3, 4, 5] },
    bottom: { kind: 'gain', discard: 4, level: 3, slot: 3 },
  },
  {
    id: 11,
    star: true,
    top: { kind: 'take', nums: [1, 5] },
    middle: { kind: 'gain', discard: 4, level: 2, slot: 3 },
    bottom: { kind: 'take', nums: [1, 2, 3, 4, 5] },
  },
  {
    id: 12,
    star: true,
    top: { kind: 'gain', discard: 4, level: 3, slot: 0 },
    middle: { kind: 'take', nums: [1, 3, 5] },
    bottom: { kind: 'gain', discard: 3, level: 1, slot: 1 },
  },
];

export const NUM_TO_COLOR = {
  1: 'onyx',
  2: 'emerald',
  3: 'sapphire',
  4: 'ruby',
  5: 'diamond',
} as const;

export type BoardNum = keyof typeof NUM_TO_COLOR;
