import type { MessageKey } from '@/i18n/messages';
import type { DuelDifficulty, DuelMode } from './types';

export type DuelSetupValues = {
  mode: DuelMode;
  /** 0 = first player, 1 = second (starts with Privilege) */
  humanSeat: 0 | 1;
  difficulty: DuelDifficulty;
};

const DIFFICULTIES: DuelDifficulty[] = ['easy', 'normal', 'hard'];

function diffLabelKey(d: DuelDifficulty): MessageKey {
  if (d === 'easy') return 'stdDiff_easy';
  if (d === 'normal') return 'stdDiff_normal';
  return 'stdDiff_hard';
}

function diffHintKey(d: DuelDifficulty): MessageKey {
  if (d === 'easy') return 'duelDiffHint_easy';
  if (d === 'normal') return 'duelDiffHint_normal';
  return 'duelDiffHint_hard';
}

export function DuelSetupForm({
  value,
  onChange,
  onStart,
  t,
}: {
  value: DuelSetupValues;
  onChange: (next: DuelSetupValues) => void;
  onStart: () => void;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
}) {
  return (
    <div className="panel p-5 sm:p-6 space-y-6 max-w-xl">
      <div>
        <p className="text-xs font-serif text-splendor-muted tracking-wide mb-3">
          {t('duelSetupMode')}
        </p>
        <div className="flex flex-wrap gap-2">
          {([
            ['ai', 'duelModeAi'],
            ['hotseat', 'duelModeHotseat'],
          ] as const).map(([mode, key]) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChange({ ...value, mode })}
              className={`btn-outline text-sm ${
                value.mode === mode
                  ? 'border-splendor-gold/70 bg-splendor-gold/10 text-splendor-velvet'
                  : ''
              }`}
            >
              {t(key)}
            </button>
          ))}
        </div>
      </div>

      {value.mode === 'ai' && (
        <>
          <div>
            <p className="text-xs font-serif text-splendor-muted tracking-wide mb-3">
              {t('duelSetupSeat')}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...value, humanSeat: 0 })}
                className={`btn-outline text-sm ${
                  value.humanSeat === 0
                    ? 'border-splendor-gold/70 bg-splendor-gold/10 text-splendor-velvet'
                    : ''
                }`}
              >
                {t('duelSeatFirst')}
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...value, humanSeat: 1 })}
                className={`btn-outline text-sm ${
                  value.humanSeat === 1
                    ? 'border-splendor-gold/70 bg-splendor-gold/10 text-splendor-velvet'
                    : ''
                }`}
              >
                {t('duelSeatSecond')}
              </button>
            </div>
            <p className="mt-2 text-xs font-serif text-splendor-muted">
              {t('duelSeatSecondHint')}
            </p>
          </div>

          <div>
            <p className="text-xs font-serif text-splendor-muted tracking-wide mb-3">
              {t('duelSetupDifficulty')}
            </p>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((d) => (
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
                  {t(diffLabelKey(d))}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm font-serif text-splendor-muted leading-relaxed">
              {t(diffHintKey(value.difficulty))}
            </p>
          </div>
        </>
      )}

      <button type="button" onClick={onStart} className="btn-gilt text-sm">
        {t('duelStart')}
      </button>
    </div>
  );
}
