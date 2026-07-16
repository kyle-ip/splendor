import { Link } from 'react-router-dom';
import type { MessageKey } from '@/i18n/messages';
import { useI18n } from '@/i18n/I18nProvider';

export type CoachingTip = {
  messageKey: MessageKey;
  lessonPath: string;
};

/** Heuristic tips from a finished dice / standard race. */
export function buildDiceCoaching(input: {
  playerPrestige: number;
  autoPrestige: number;
  playerWon: boolean;
  takeLogCount: number;
  buyLogCount: number;
  playerNobles: number;
  autoNobles: number;
  turns: number;
}): CoachingTip[] {
  const tips: CoachingTip[] = [];
  if (input.turns >= 5 && input.takeLogCount >= input.buyLogCount + 2) {
    tips.push({
      messageKey: 'coachTakeHeavy',
      lessonPath: '/learn/intermediate/part2-intermediate-03-gem-economy',
    });
  }
  if (input.playerNobles === 0 && input.autoNobles > 0) {
    tips.push({
      messageKey: 'coachNoNobles',
      lessonPath: '/learn/intermediate/part2-intermediate-02-noble-planning',
    });
  }
  if (!input.playerWon && input.autoPrestige - input.playerPrestige <= 3) {
    tips.push({
      messageKey: 'coachCardHeavy',
      lessonPath: '/learn/intermediate/part2-intermediate-06-endgame-calc',
    });
  }
  return tips.slice(0, 3);
}

export function buildStandardCoaching(input: {
  humanPrestige: number;
  humanCardCount: number;
  humanNoblesApprox: number;
  /** Human take / buy only (not full-table). */
  takeActions: number;
  buyActions: number;
  oppMaxPrestige: number;
  oppHasNobleLead: boolean;
  /** Opponent with max prestige — for card-count compare */
  oppCardCountAtLead: number;
  won: boolean;
  turns: number;
  missedDenials?: number;
}): CoachingTip[] {
  const tips: CoachingTip[] = [];
  if (input.turns >= 5 && input.takeActions >= input.buyActions + 2) {
    tips.push({
      messageKey: 'coachTakeHeavy',
      lessonPath: '/learn/intermediate/part2-intermediate-03-gem-economy',
    });
  }
  if (input.humanNoblesApprox === 0 && input.oppHasNobleLead) {
    tips.push({
      messageKey: 'coachNoNobles',
      lessonPath: '/learn/intermediate/part2-intermediate-02-noble-planning',
    });
  }
  const gap = input.oppMaxPrestige - input.humanPrestige;
  if (!input.won && gap <= 3) {
    tips.push({
      messageKey: 'coachCardHeavy',
      lessonPath: '/learn/intermediate/part2-intermediate-06-endgame-calc',
    });
    if (input.humanCardCount < input.oppCardCountAtLead) {
      tips.push({
        messageKey: 'coachLowCards',
        lessonPath: '/learn/intermediate/part2-intermediate-07-level-economy',
      });
    }
  }
  if ((input.missedDenials ?? 0) >= 2) {
    tips.push({
      messageKey: 'coachMissedDeny',
      lessonPath: '/learn/advanced/part3-advanced-04-denial',
    });
  }
  return tips.slice(0, 3);
}

/** Mode 1 Fixed Capital — color coverage / pace tips. */
export function buildFixedCoaching(input: {
  turns: number;
  resetsUsed: number;
  /** How many colors reached ≥4 at win */
  colorsAtFour: number;
  /** Max bonus count among the five colors */
  maxColorStack: number;
}): CoachingTip[] {
  const tips: CoachingTip[] = [];
  if (input.turns >= 14) {
    tips.push({
      messageKey: 'coachFixedSlow',
      lessonPath: '/learn/advanced/part3-advanced-01-card-evaluation',
    });
  }
  if (input.resetsUsed >= 2) {
    tips.push({
      messageKey: 'coachFixedResets',
      lessonPath: '/learn/intermediate/part2-intermediate-01-engine',
    });
  }
  if (input.maxColorStack >= 6 && input.colorsAtFour < 5) {
    tips.push({
      messageKey: 'coachFixedNarrow',
      lessonPath: '/learn/intermediate/part2-intermediate-07-level-economy',
    });
  }
  return tips.slice(0, 3);
}

/** Mode 3 card automa — reuse race heuristics. */
export function buildCardAutomaCoaching(input: {
  playerPrestige: number;
  autoPrestige: number;
  playerWon: boolean;
  takeLogCount: number;
  buyLogCount: number;
  playerNobles: number;
  turns: number;
}): CoachingTip[] {
  return buildDiceCoaching({
    ...input,
    autoNobles: 0,
  });
}

export function PracticeCoaching({ tips }: { tips: CoachingTip[] }) {
  const { t } = useI18n();
  if (tips.length === 0) return null;

  return (
    <div className="mt-3 space-y-2 border-t border-splendor-line/30 pt-3">
      <p className="text-xs font-serif tracking-wide uppercase text-splendor-muted">
        {t('coachTitle')}
      </p>
      <ul className="space-y-1.5">
        {tips.map((tip) => (
          <li key={tip.messageKey} className="text-sm font-serif text-splendor-ink/90">
            {t(tip.messageKey)}{' '}
            <Link
              to={tip.lessonPath}
              className="text-splendor-velvet underline underline-offset-2 hover:text-splendor-gold"
            >
              {t('coachReadLesson')}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
