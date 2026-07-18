import type { MessageKey } from '@/i18n/messages';
import { findCard } from './engine';
import {
  buyQuality,
  derivePhase,
  getPersona,
  opponentAffordable,
  rankLegalActions,
} from './ai';
import type { GameAction, GameState } from './types';

export type MoveHint = {
  action: GameAction;
  actionKey: MessageKey;
  actionParams?: Record<string, string | number>;
  reasonKey: MessageKey;
  /** Card to highlight on the board when buy/reserve */
  highlightCardId?: string;
};

function reasonForAction(
  state: GameState,
  action: GameAction,
): MessageKey {
  const me = state.seats[state.currentSeat];
  const persona = getPersona(state.difficulty, state.aiStyle);
  const phase = derivePhase(me);
  const contested = new Set(
    opponentAffordable(state, me.id).map((c) => c.id),
  );

  if (action.type === 'buy') {
    const found = findCard(state, action.cardId);
    if (!found) return 'hintReasonGeneric';
    const bonusesAfter = {
      ...me.bonuses,
      [found.card.bonus]: me.bonuses[found.card.bonus] + 1,
    };
    const finishesNoble = state.nobles.some((n) => {
      const before = (['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'] as const).reduce(
        (sum, c) => sum + Math.max(0, n.requirements[c] - me.bonuses[c]),
        0,
      );
      const after = (['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'] as const).reduce(
        (sum, c) => sum + Math.max(0, n.requirements[c] - bonusesAfter[c]),
        0,
      );
      return before > 0 && after === 0;
    });
    if (finishesNoble) return 'hintReasonNoble';
    if (contested.has(found.card.id)) return 'hintReasonDeny';
    if (phase === 'finish' || found.card.points >= 3) return 'hintReasonPoints';
    if (phase === 'engine' || buyQuality(state, me, found.card, persona) > 4) {
      return 'hintReasonEngine';
    }
    return 'hintReasonPoints';
  }

  if (action.type === 'reserve') {
    if (contested.has(action.cardId)) return 'hintReasonDeny';
    return 'hintReasonReserve';
  }

  if (action.type === 'take') return 'hintReasonTake';
  return 'hintReasonGeneric';
}

/** Best legal action + short reason template for teaching hints. */
export function recommendHumanMove(state: GameState): MoveHint | null {
  if (state.phase !== 'human') return null;
  const me = state.seats[state.currentSeat];
  if (!me?.isHuman) return null;

  const ranked = rankLegalActions(state, () => 0.5);
  if (ranked.length === 0) return null;
  const { action } = ranked[0];

  if (action.type === 'buy') {
    return {
      action,
      actionKey: 'hintActionBuy',
      reasonKey: reasonForAction(state, action),
      highlightCardId: action.cardId,
    };
  }
  if (action.type === 'reserve') {
    return {
      action,
      actionKey: 'hintActionReserve',
      reasonKey: reasonForAction(state, action),
      highlightCardId: action.cardId,
    };
  }
  if (action.type === 'take') {
    return {
      action,
      actionKey: 'hintActionTake',
      reasonKey: reasonForAction(state, action),
    };
  }
  return null;
}
