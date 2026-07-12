import { describe, expect, it } from 'vitest';
import {
  parseGemList,
  readBonusParams,
  readCostParams,
  readHandParams,
} from './toolQuery';

describe('parseGemList', () => {
  it('parses named pairs', () => {
    expect(parseGemList('ruby:1,onyx:2')).toMatchObject({
      ruby: 1,
      onyx: 2,
      emerald: 0,
    });
  });

  it('parses compact form', () => {
    expect(parseGemList('e2s1g1', true)).toMatchObject({
      emerald: 2,
      sapphire: 1,
      gold: 1,
    });
  });

  it('ignores gold when not allowed', () => {
    expect(parseGemList('gold:3', false).gold).toBe(0);
  });
});

describe('search param readers', () => {
  it('reads calculator triplet', () => {
    const p = new URLSearchParams(
      'bonus=ruby:1&hand=ruby:1,onyx:2,gold:1&cost=ruby:2,onyx:2',
    );
    expect(readBonusParams(p).ruby).toBe(1);
    expect(readHandParams(p)).toMatchObject({ ruby: 1, onyx: 2, gold: 1 });
    expect(readCostParams(p)).toMatchObject({ ruby: 2, onyx: 2 });
  });

  it('reads bare noble colors', () => {
    const p = new URLSearchParams('emerald=2&sapphire=2&onyx=1');
    expect(readBonusParams(p)).toMatchObject({
      emerald: 2,
      sapphire: 2,
      onyx: 1,
    });
  });
});
