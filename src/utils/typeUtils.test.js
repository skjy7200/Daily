import { describe, it, expect } from 'vitest';
import { getTypeMultiplier } from './typeUtils';

describe('getTypeMultiplier', () => {

  it('should return 2 for a super-effective matchup', () => {
    // 불꽃 -> 풀
    const multiplier = getTypeMultiplier('fire', ['풀']);
    expect(multiplier).toBe(2);
  });

  it('should return 0.5 for a not-very-effective matchup', () => {
    // 불꽃 -> 물
    const multiplier = getTypeMultiplier('fire', ['물']);
    expect(multiplier).toBe(0.5);
  });

  it('should return 0 for an immune matchup', () => {
    // 노말 -> 고스트
    const multiplier = getTypeMultiplier('normal', ['고스트']);
    expect(multiplier).toBe(0);
  });

  it('should return 4 for a double super-effective matchup (dual type)', () => {
    // 얼음 -> 풀/비행
    const multiplier = getTypeMultiplier('ice', ['풀', '비행']);
    expect(multiplier).toBe(4); // 2 * 2
  });

  it('should return 0.25 for a double not-very-effective matchup (dual type)', () => {
    // 불꽃 -> 물/바위
    const multiplier = getTypeMultiplier('fire', ['물', '바위']);
    expect(multiplier).toBe(0.25); // 0.5 * 0.5
  });

  it('should return 1 for a mixed effectiveness matchup (dual type)', () => {
    // 땅 -> 불꽃/비행
    // 불꽃에는 2배, 비행에는 0배
    const multiplier = getTypeMultiplier('ground', ['불꽃', '비행']);
    expect(multiplier).toBe(0); // 2 * 0 = 0
  });

  it('should return 1 for a neutral matchup', () => {
    const multiplier = getTypeMultiplier('normal', ['물']);
    expect(multiplier).toBe(1);
  });

  it('should handle single type defenders correctly', () => {
    const multiplier = getTypeMultiplier('electric', ['물']);
    expect(multiplier).toBe(2);
  });

  it('should handle unknown move types gracefully', () => {
    const multiplier = getTypeMultiplier('unknown-type', ['물']);
    expect(multiplier).toBe(1);
  });

  it('should handle unknown defender types gracefully', () => {
    const multiplier = getTypeMultiplier('fire', ['알수없는타입']);
    expect(multiplier).toBe(1);
  });
});
