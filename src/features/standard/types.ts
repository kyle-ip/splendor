import type { GemCounts, NobleRequirement } from '@/types';
import type { SoloCard } from '@/data/solo-cards';

export type Difficulty = 'easy' | 'normal' | 'hard';

/** Teaching focus layered on top of difficulty weights. */
export type AiStyle = 'balanced' | 'engine' | 'deny' | 'noble';

export type Color = 'emerald' | 'sapphire' | 'ruby' | 'diamond' | 'onyx';

export type GemKey = Color | 'gold';

export type Phase =
  | 'human'
  | 'aiBusy'
  | 'chooseNoble'
  | 'discardGems'
  | 'done';

export type SeatNameKey =
  | 'you'
  | 'marco'
  | 'lucrezia'
  | 'cosimo'
  | 'isabella';

export type Seat = {
  id: number;
  isHuman: boolean;
  nameKey: SeatNameKey;
  hand: GemCounts;
  bonuses: Omit<GemCounts, 'gold'>;
  prestige: number;
  reserved: SoloCard[];
  /** Purchased development cards (for endgame tiebreak) */
  cardCount: number;
};

export type GameAction =
  | { type: 'take'; colors: Color[] }
  | {
      type: 'buy';
      cardId: string;
      from: 'display' | 'reserved';
      level?: 1 | 2 | 3;
    }
  | { type: 'reserve'; cardId: string; level: 1 | 2 | 3 }
  | { type: 'claimNoble'; nobleId: number }
  | { type: 'discard'; gems: GemKey[] };

export type LogEntry =
  | { kind: 'take3'; seat: number }
  | { kind: 'take2'; seat: number; color: Color }
  | { kind: 'buy'; seat: number; points: number; bonus: Color }
  | { kind: 'reserve'; seat: number }
  | { kind: 'noble'; seat: number }
  | { kind: 'discard'; seat: number }
  | { kind: 'gameOver' };

export type GameState = {
  seats: Seat[];
  bank: GemCounts;
  l1: SoloCard[];
  l2: SoloCard[];
  l3: SoloCard[];
  d1: SoloCard[];
  d2: SoloCard[];
  d3: SoloCard[];
  nobles: NobleRequirement[];
  currentSeat: number;
  phase: Phase;
  /** Eligible nobles when phase === 'chooseNoble' */
  pendingNobles: NobleRequirement[];
  /** How many gems still need returning when phase === 'discardGems' */
  discardNeeded: number;
  endingRound: boolean;
  winnerIds: number[];
  log: LogEntry[];
  turn: number;
  busyNonce: number;
  difficulty: Difficulty;
  /** Teaching persona overlay; defaults to balanced when missing (old sessions). */
  aiStyle: AiStyle;
  pendingTake: Color[];
};

export type CreateGameOptions = {
  playerCount: 2 | 3 | 4;
  /** 0-based index of the human seat */
  humanSeat: number;
  difficulty: Difficulty;
  aiStyle?: AiStyle;
  /** Optional RNG for deterministic deck/noble shuffle (sims / tests) */
  rng?: () => number;
};
