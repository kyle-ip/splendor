import type { MessageKey } from '@/i18n/messages';
import { opponentAffordable } from './ai';
import { COLORS, tokenCount } from './engine';
import type { GameState, Seat } from './types';

export type StandardTipId =
  | 'ending'
  | 'deny'
  | 'nobleRace'
  | 'handLimit'
  | 'engine';

export type StandardTip = {
  id: StandardTipId;
  messageKey: MessageKey;
  lessonPath?: string;
};

const LESSON = {
  endgame: '/learn/intermediate/part2-intermediate-06-endgame-calc',
  reserve: '/learn/basics/part1-basics-04-reserving',
  nobles: '/learn/intermediate/part2-intermediate-02-noble-planning',
  gems: '/learn/intermediate/part2-intermediate-03-gem-economy',
} as const;

/** Display cards an opponent can currently afford. */
export function contestedCardIds(
  state: GameState,
  humanId: number,
): Set<string> {
  return new Set(
    opponentAffordable(state, humanId).map((c) => c.id),
  );
}

function seatDeficientColors(
  seat: Seat,
  requirements: Seat['bonuses'],
): number {
  return COLORS.reduce(
    (n, c) => n + Math.max(0, requirements[c] - seat.bonuses[c]),
    0,
  );
}

function humanCanReserveContested(
  state: GameState,
  human: Seat,
): boolean {
  if (human.reserved.length >= 3) return false;
  if (state.phase !== 'human') return false;
  if (state.pendingTake.length > 0) return false;
  const contested = opponentAffordable(state, human.id);
  return contested.length > 0;
}

function hasNobleRace(state: GameState, human: Seat): boolean {
  for (const noble of state.nobles) {
    const humanGap = seatDeficientColors(human, noble.requirements);
    if (humanGap > 1) continue;
    for (const opp of state.seats) {
      if (opp.id === human.id) continue;
      const oppGap = seatDeficientColors(opp, noble.requirements);
      // Opp is also close, or already matching / ahead of human on this noble
      if (oppGap <= 2 || oppGap <= humanGap) return true;
    }
  }
  return false;
}

function humanTakeBuyCounts(state: GameState, humanId: number): {
  takes: number;
  buys: number;
} {
  let takes = 0;
  let buys = 0;
  for (const e of state.log) {
    if (e.kind === 'gameOver') continue;
    if (e.seat !== humanId) continue;
    if (e.kind === 'take3' || e.kind === 'take2') takes += 1;
    if (e.kind === 'buy') buys += 1;
  }
  return { takes, buys };
}

/**
 * Pick at most one situational tip for the human main turn.
 * Priority: ending > deny > nobleRace > handLimit > engine.
 */
export function selectStandardTip(
  state: GameState,
  humanId: number,
  dismissed: ReadonlySet<string>,
): StandardTip | null {
  if (state.phase === 'done') return null;
  const human = state.seats.find((s) => s.id === humanId);
  if (!human) return null;

  const candidates: StandardTip[] = [];

  if (state.endingRound) {
    candidates.push({
      id: 'ending',
      messageKey: 'stdTipEnding',
      lessonPath: LESSON.endgame,
    });
  }

  if (humanCanReserveContested(state, human)) {
    candidates.push({
      id: 'deny',
      messageKey: 'stdTipDeny',
      lessonPath: LESSON.reserve,
    });
  }

  if (hasNobleRace(state, human)) {
    candidates.push({
      id: 'nobleRace',
      messageKey: 'stdTipNobleRace',
      lessonPath: LESSON.nobles,
    });
  }

  if (tokenCount(human.hand) >= 8) {
    candidates.push({
      id: 'handLimit',
      messageKey: 'stdTipHandLimit',
      lessonPath: LESSON.gems,
    });
  }

  if (state.turn <= 8) {
    const { takes, buys } = humanTakeBuyCounts(state, humanId);
    if (takes >= buys + 2) {
      candidates.push({
        id: 'engine',
        messageKey: 'stdTipEngine',
        lessonPath: LESSON.gems,
      });
    }
  }

  for (const tip of candidates) {
    if (!dismissed.has(tip.id)) return tip;
  }
  return null;
}
