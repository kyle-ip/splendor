import type { CardExample } from '@/types';

export const cardExamples: CardExample[] = [
  {
    id: 'c1',
    name: '翡翠矿脉',
    points: 0,
    bonus: 'emerald',
    cost: { emerald: 0, sapphire: 0, ruby: 2, diamond: 1, onyx: 0 },
  },
  {
    id: 'c2',
    name: '蓝宝石港',
    points: 1,
    bonus: 'sapphire',
    cost: { emerald: 1, sapphire: 0, ruby: 0, diamond: 0, onyx: 2 },
  },
  {
    id: 'c3',
    name: '红宝石庄园',
    points: 3,
    bonus: 'ruby',
    cost: { emerald: 0, sapphire: 3, ruby: 0, diamond: 2, onyx: 2 },
  },
  {
    id: 'c4',
    name: '钻石殿堂',
    points: 5,
    bonus: 'diamond',
    cost: { emerald: 3, sapphire: 0, ruby: 3, diamond: 0, onyx: 3 },
  },
];
