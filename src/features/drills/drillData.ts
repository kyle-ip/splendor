import type { DrillSet } from './types';

/** Interactive micro-drills keyed by lesson id. */
export const DRILL_SETS: DrillSet[] = [
  {
    lessonId: 'part3-advanced-02-reading-the-table',
    titleKey: 'drillSetReading',
    items: [
      {
        id: 'read-a',
        promptKey: 'drillReadA_prompt',
        choices: [
          { id: 'contest', labelKey: 'drillReadA_contest' },
          { id: 'ignore', labelKey: 'drillReadA_ignore' },
          { id: 'stockpile', labelKey: 'drillReadA_stockpile' },
        ],
        correctId: 'contest',
        explainKey: 'drillReadA_explain',
      },
      {
        id: 'read-b',
        promptKey: 'drillReadB_prompt',
        choices: [
          { id: 'sure', labelKey: 'drillReadB_sure' },
          { id: 'setup5', labelKey: 'drillReadB_setup5' },
          { id: 'engine0', labelKey: 'drillReadB_engine0' },
        ],
        correctId: 'sure',
        explainKey: 'drillReadB_explain',
      },
      {
        id: 'read-c',
        promptKey: 'drillReadC_prompt',
        choices: [
          { id: 'ruby', labelKey: 'drillReadC_ruby' },
          { id: 'ignore', labelKey: 'drillReadC_ignore' },
          { id: 'gold', labelKey: 'drillReadC_gold' },
        ],
        correctId: 'ruby',
        explainKey: 'drillReadC_explain',
      },
    ],
  },
  {
    lessonId: 'part3-advanced-01-card-evaluation',
    titleKey: 'drillSetEval',
    items: [
      {
        id: 'eval-1',
        promptKey: 'drillEval1_prompt',
        choices: [
          { id: 'a', labelKey: 'drillEval1_a' },
          { id: 'b', labelKey: 'drillEval1_b' },
        ],
        correctId: 'a',
        explainKey: 'drillEval1_explain',
      },
      {
        id: 'eval-2',
        promptKey: 'drillEval2_prompt',
        choices: [
          { id: 'c', labelKey: 'drillEval2_c' },
          { id: 'd', labelKey: 'drillEval2_d' },
        ],
        correctId: 'c',
        explainKey: 'drillEval2_explain',
      },
      {
        id: 'eval-3',
        promptKey: 'drillEval3_prompt',
        choices: [
          { id: 'e', labelKey: 'drillEval3_e' },
          { id: 'f', labelKey: 'drillEval3_f' },
        ],
        correctId: 'e',
        explainKey: 'drillEval3_explain',
      },
    ],
  },
  {
    lessonId: 'part3-advanced-03-tempo',
    titleKey: 'drillSetTempo',
    items: [
      {
        id: 'tempo-1',
        promptKey: 'drillTempo1_prompt',
        choices: [
          { id: 'cash', labelKey: 'drillTempo1_cash' },
          { id: 'stockpile', labelKey: 'drillTempo1_stockpile' },
        ],
        correctId: 'cash',
        explainKey: 'drillTempo1_explain',
      },
      {
        id: 'tempo-2',
        promptKey: 'drillTempo2_prompt',
        choices: [
          { id: 'slow', labelKey: 'drillTempo2_slow' },
          { id: 'force', labelKey: 'drillTempo2_force' },
        ],
        correctId: 'slow',
        explainKey: 'drillTempo2_explain',
      },
    ],
  },
  {
    lessonId: 'part2-intermediate-01-engine',
    titleKey: 'drillSetEngine',
    items: [
      {
        id: 'eng-1',
        promptKey: 'drillEng1_prompt',
        choices: [
          { id: 'bonus', labelKey: 'drillEng1_bonus' },
          { id: 'points', labelKey: 'drillEng1_points' },
        ],
        correctId: 'bonus',
        explainKey: 'drillEng1_explain',
      },
      {
        id: 'eng-2',
        promptKey: 'drillEng2_prompt',
        choices: [
          { id: 'axis', labelKey: 'drillEng2_axis' },
          { id: 'spray', labelKey: 'drillEng2_spray' },
        ],
        correctId: 'axis',
        explainKey: 'drillEng2_explain',
      },
    ],
  },
  {
    lessonId: 'part2-intermediate-06-endgame-calc',
    titleKey: 'drillSetEndgame',
    items: [
      {
        id: 'end-1',
        promptKey: 'drillEnd1_prompt',
        choices: [
          { id: 'delay', labelKey: 'drillEnd1_delay' },
          { id: 'trigger', labelKey: 'drillEnd1_trigger' },
        ],
        correctId: 'delay',
        explainKey: 'drillEnd1_explain',
      },
      {
        id: 'end-2',
        promptKey: 'drillEnd2_prompt',
        choices: [
          { id: 'safe', labelKey: 'drillEnd2_safe' },
          { id: 'wait', labelKey: 'drillEnd2_wait' },
        ],
        correctId: 'safe',
        explainKey: 'drillEnd2_explain',
      },
    ],
  },
  {
    lessonId: 'part3-advanced-04-denial',
    titleKey: 'drillSetDenial',
    items: [
      {
        id: 'den-1',
        promptKey: 'drillDen1_prompt',
        choices: [
          { id: 'reserve', labelKey: 'drillDen1_reserve' },
          { id: 'self', labelKey: 'drillDen1_self' },
        ],
        correctId: 'reserve',
        explainKey: 'drillDen1_explain',
      },
    ],
  },
  {
    lessonId: 'part3-advanced-05-openings',
    titleKey: 'drillSetOpenings',
    items: [
      {
        id: 'op-1',
        promptKey: 'drillOp1_prompt',
        choices: [
          { id: 'width', labelKey: 'drillOp1_width' },
          { id: 'mono', labelKey: 'drillOp1_mono' },
        ],
        correctId: 'width',
        explainKey: 'drillOp1_explain',
      },
    ],
  },
  {
    lessonId: 'part2-intermediate-03-gem-economy',
    titleKey: 'drillSetGems',
    items: [
      {
        id: 'gem-1',
        promptKey: 'drillGem1_prompt',
        choices: [
          { id: 'three', labelKey: 'drillGem1_three' },
          { id: 'pair', labelKey: 'drillGem1_pair' },
        ],
        correctId: 'three',
        explainKey: 'drillGem1_explain',
      },
    ],
  },
];

export function drillsForLesson(lessonId: string): DrillSet | undefined {
  return DRILL_SETS.find((s) => s.lessonId === lessonId);
}
