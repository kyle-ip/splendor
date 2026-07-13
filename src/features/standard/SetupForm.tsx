import type { MessageKey } from '@/i18n/messages';
import type { Difficulty } from './types';

export type SetupValues = {
  playerCount: 2 | 3 | 4;
  /** 0-based human seat index */
  humanSeat: number;
  difficulty: Difficulty;
};

const SEAT_PRESETS: Record<
  2 | 3 | 4,
  { labelKey: MessageKey; index: number }[]
> = {
  2: [
    { labelKey: 'stdSeatFirst', index: 0 },
    { labelKey: 'stdSeatLast', index: 1 },
  ],
  3: [
    { labelKey: 'stdSeatFirst', index: 0 },
    { labelKey: 'stdSeatMiddle', index: 1 },
    { labelKey: 'stdSeatLast', index: 2 },
  ],
  4: [
    { labelKey: 'stdSeatFirst', index: 0 },
    { labelKey: 'stdSeatSecond', index: 1 },
    { labelKey: 'stdSeatThird', index: 2 },
    { labelKey: 'stdSeatLast', index: 3 },
  ],
};

export function SetupForm({
  value,
  onChange,
  onStart,
  t,
}: {
  value: SetupValues;
  onChange: (next: SetupValues) => void;
  onStart: () => void;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
}) {
  const seats = SEAT_PRESETS[value.playerCount];
  const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];

  return (
    <div className="panel p-5 sm:p-6 space-y-6 max-w-xl">
      <div>
        <p className="text-xs font-serif text-splendor-muted tracking-wide mb-3">
          {t('stdSetupPlayers')}
        </p>
        <div className="flex flex-wrap gap-2">
          {([2, 3, 4] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                const nextSeats = SEAT_PRESETS[n];
                const clamped = Math.min(value.humanSeat, n - 1);
                const stillValid = nextSeats.some((s) => s.index === clamped);
                onChange({
                  ...value,
                  playerCount: n,
                  humanSeat: stillValid ? clamped : 0,
                });
              }}
              className={`btn-outline text-sm ${
                value.playerCount === n
                  ? 'border-splendor-gold/70 bg-splendor-gold/10 text-splendor-velvet'
                  : ''
              }`}
            >
              {t('playersButton', { n })}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-serif text-splendor-muted tracking-wide mb-3">
          {t('stdSetupSeat')}
        </p>
        <div className="flex flex-wrap gap-2">
          {seats.map((s) => (
            <button
              key={s.index}
              type="button"
              onClick={() => onChange({ ...value, humanSeat: s.index })}
              className={`btn-outline text-sm ${
                value.humanSeat === s.index
                  ? 'border-splendor-gold/70 bg-splendor-gold/10 text-splendor-velvet'
                  : ''
              }`}
            >
              {t(s.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-serif text-splendor-muted tracking-wide mb-3">
          {t('stdSetupDifficulty')}
        </p>
        <div className="flex flex-wrap gap-2">
          {difficulties.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onChange({ ...value, difficulty: d })}
              className={`btn-outline text-sm ${
                value.difficulty === d
                  ? 'border-splendor-gold/70 bg-splendor-gold/10 text-splendor-velvet'
                  : ''
              }`}
            >
              {t(
                d === 'easy'
                  ? 'stdDiff_easy'
                  : d === 'normal'
                    ? 'stdDiff_normal'
                    : 'stdDiff_hard',
              )}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm font-serif text-splendor-muted leading-relaxed">
          {t(
            value.difficulty === 'easy'
              ? 'stdDiffHint_easy'
              : value.difficulty === 'normal'
                ? 'stdDiffHint_normal'
                : 'stdDiffHint_hard',
          )}
        </p>
      </div>

      <button type="button" onClick={onStart} className="btn-gilt text-sm">
        {t('stdStart')}
      </button>
    </div>
  );
}
