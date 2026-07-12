import type { GemCounts } from '@/types';
import { GEM_LABEL_KEYS } from '@/lib/gems';
import { useI18n } from '@/i18n/I18nProvider';

export function useGemLabels(): Record<keyof GemCounts, string> {
  const { t } = useI18n();
  return {
    emerald: t(GEM_LABEL_KEYS.emerald),
    sapphire: t(GEM_LABEL_KEYS.sapphire),
    ruby: t(GEM_LABEL_KEYS.ruby),
    diamond: t(GEM_LABEL_KEYS.diamond),
    onyx: t(GEM_LABEL_KEYS.onyx),
    gold: t(GEM_LABEL_KEYS.gold),
  };
}
