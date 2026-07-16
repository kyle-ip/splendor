import { describe, expect, it } from 'vitest';
import { createGame } from '@/features/standard/engine';
import { recommendHumanMove } from '@/features/standard/moveHints';
import { getPersona } from '@/features/standard/ai';
import { fixedCapitalStart } from '@/features/solo/practiceTier';

describe('fixedCapitalStart', () => {
  it('scales capital by tier', () => {
    expect(fixedCapitalStart('easy').perColor).toBe(4);
    expect(fixedCapitalStart('normal').resets).toBe(3);
    expect(fixedCapitalStart('hard').gold).toBe(2);
  });
});

describe('recommendHumanMove', () => {
  it('returns a hint on a fresh human turn', () => {
    const g = createGame({
      playerCount: 2,
      humanSeat: 0,
      difficulty: 'normal',
      aiStyle: 'balanced',
    });
    const hint = recommendHumanMove(g);
    expect(hint).not.toBeNull();
    expect(hint?.action.type).toMatch(/take|buy|reserve/);
    expect(hint?.reasonKey).toBeTruthy();
  });
});

describe('getPersona styles', () => {
  it('deny style raises leaveThreat vs balanced', () => {
    const bal = getPersona('normal', 'balanced');
    const deny = getPersona('normal', 'deny');
    expect(deny.weights.leaveThreat).toBeGreaterThan(bal.weights.leaveThreat);
    expect(deny.denyScale).toBeGreaterThan(bal.denyScale);
  });
});
