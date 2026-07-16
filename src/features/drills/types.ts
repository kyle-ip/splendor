import type { MessageKey } from '@/i18n/messages';

export type DrillChoice = {
  id: string;
  labelKey: MessageKey;
};

export type DrillItem = {
  id: string;
  promptKey: MessageKey;
  choices: DrillChoice[];
  correctId: string;
  explainKey: MessageKey;
};

export type DrillSet = {
  lessonId: string;
  titleKey: MessageKey;
  items: DrillItem[];
};
