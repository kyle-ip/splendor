import type { GemCounts } from '@/types';
import { gems } from '@/lib/assets';
import { useGemLabels } from '@/i18n/useGemLabels';

type GemKey = keyof GemCounts;

interface GemCounterProps {
  values: GemCounts;
  onChange: (values: GemCounts) => void;
  showGold?: boolean;
  label?: string;
}

export function GemCounter({
  values,
  onChange,
  showGold = true,
  label,
}: GemCounterProps) {
  const labels = useGemLabels();
  const colors: GemKey[] = showGold
    ? ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx', 'gold']
    : ['emerald', 'sapphire', 'ruby', 'diamond', 'onyx'];

  const update = (key: GemKey, delta: number) => {
    const next = Math.max(0, Math.min(10, values[key] + delta));
    onChange({ ...values, [key]: next });
  };

  return (
    <div className="space-y-3">
      {label && (
        <p className="text-sm font-serif text-splendor-ink/80 tracking-wide">
          {label}
        </p>
      )}
      {colors.map((key) => (
        <div key={key} className="flex items-center gap-3">
          <img src={gems[key]} alt={labels[key]} className="gem-img" />
          <span className="w-16 text-sm font-serif text-splendor-ink">
            {labels[key]}
          </span>
          <button
            type="button"
            onClick={() => update(key, -1)}
            className="w-10 h-10 border border-splendor-line bg-white hover:border-splendor-accent text-lg text-splendor-ink transition-colors"
          >
            −
          </button>
          <span className="w-8 text-center font-display text-lg text-splendor-ink">
            {values[key]}
          </span>
          <button
            type="button"
            onClick={() => update(key, 1)}
            className="w-10 h-10 border border-splendor-line bg-white hover:border-splendor-accent text-lg text-splendor-ink transition-colors"
          >
            +
          </button>
        </div>
      ))}
    </div>
  );
}
