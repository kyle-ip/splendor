import type {
  DuelGem,
  DuelJewelCard,
  DuelRoyalCard,
  DuelToken,
  OwnedDuelCard,
} from '@/data/duel-cards';

export type DuelMode = 'ai' | 'hotseat';

export type DuelDifficulty = 'easy' | 'normal' | 'hard';

export type DuelPhase =
  | 'optional'
  | 'main'
  | 'chooseAssociate'
  | 'chooseSteal'
  | 'chooseTakeMatching'
  | 'chooseRoyal'
  | 'discardTokens'
  | 'aiBusy'
  | 'done';

export type SeatNameKey = 'you' | 'marco' | 'lucrezia';

export type DuelSeat = {
  id: number;
  isHuman: boolean;
  nameKey: SeatNameKey;
  hand: Record<DuelToken, number>;
  bonuses: Record<DuelGem, number>;
  prestige: number;
  crowns: number;
  privileges: number;
  reserved: DuelJewelCard[];
  purchased: OwnedDuelCard[];
  royals: DuelRoyalCard[];
};

export type DuelGameAction =
  | { type: 'usePrivilege'; boardIndex: number }
  | { type: 'replenish' }
  | { type: 'takeTokens'; indices: number[] }
  | {
      type: 'reserve';
      goldIndex: number;
      /** Face-up pyramid card, or blind from deck level */
      source:
        | { kind: 'pyramid'; cardId: string; level: 1 | 2 | 3 }
        | { kind: 'deck'; level: 1 | 2 | 3 };
    }
  | {
      type: 'buy';
      cardId: string;
      from: 'pyramid' | 'reserved';
      level?: 1 | 2 | 3;
    }
  | { type: 'chooseAssociate'; color: DuelGem }
  | { type: 'chooseSteal'; token: Exclude<DuelToken, 'gold'> }
  | { type: 'chooseTakeMatching'; boardIndex: number }
  | { type: 'skipTakeMatching' }
  | { type: 'claimRoyal'; royalId: string }
  | { type: 'discard'; tokens: DuelToken[] };

export type DuelLogEntry =
  | { kind: 'privilege'; seat: number }
  | { kind: 'replenish'; seat: number }
  | { kind: 'take'; seat: number; count: number }
  | { kind: 'reserve'; seat: number }
  | { kind: 'buy'; seat: number; prestige: number }
  | { kind: 'royal'; seat: number }
  | { kind: 'discard'; seat: number }
  | { kind: 'win'; seat: number; reason: 'prestige' | 'crowns' | 'color' }
  | { kind: 'gameOver' };

export type DuelGameState = {
  mode: DuelMode;
  seats: [DuelSeat, DuelSeat];
  /** 25 cells, row-major 5×5 */
  board: (DuelToken | null)[];
  bag: DuelToken[];
  privilegesSupply: number;
  l1: (DuelJewelCard | null)[];
  l2: (DuelJewelCard | null)[];
  l3: (DuelJewelCard | null)[];
  d1: DuelJewelCard[];
  d2: DuelJewelCard[];
  d3: DuelJewelCard[];
  royals: DuelRoyalCard[];
  currentSeat: number;
  phase: DuelPhase;
  /** Optional actions already used this turn */
  usedPrivilegeThisTurn: boolean;
  usedReplenishThisTurn: boolean;
  /** After main action, pending ability resolution */
  pendingAssociateCardId: string | null;
  pendingSteal: boolean;
  pendingTakeMatchingColor: DuelGem | null;
  pendingRoyalSlots: number;
  discardNeeded: number;
  /** Extra full turn after current turn ends */
  extraTurnPending: boolean;
  winnerId: number | null;
  winReason: 'prestige' | 'crowns' | 'color' | null;
  log: DuelLogEntry[];
  turn: number;
  busyNonce: number;
  difficulty: DuelDifficulty;
};

export type CreateDuelOptions = {
  mode: DuelMode;
  /** 0-based human seat when mode === 'ai' */
  humanSeat?: number;
  difficulty?: DuelDifficulty;
  rng?: () => number;
};
