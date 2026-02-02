import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateDailyChallenge } from './challengeUtils';

describe('generateDailyChallenge', () => {

  // 각 테스트 전에 localStorage를 초기화합니다.
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers(); // 가짜 타이머 사용
  });

  // 각 테스트 후에 실제 타이머로 복원합니다.
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate the same challenge for the same date', () => {
    // 시간을 특정 날짜로 고정
    const testDate = new Date('2024-07-31T10:00:00Z');
    vi.setSystemTime(testDate);

    const challenge1 = generateDailyChallenge();
    const challenge2 = generateDailyChallenge();

    // 생성된 챌린지 객체가 깊은 수준까지 동일한지 확인
    expect(challenge1).toEqual(challenge2);
    // 리더, 리더 포켓몬, 렌탈 포켓몬 모두 동일해야 함
    expect(challenge1.leader).toBe(challenge2.leader);
    expect(challenge1.leaderPokemon.map(p => p.id)).toEqual(challenge2.leaderPokemon.map(p => p.id));
    expect(challenge1.rentalPokemon.map(p => p.id).sort()).toEqual(challenge2.rentalPokemon.map(p => p.id).sort());
  });

  it('should generate a different challenge for a different date', () => {
    // 첫 번째 날짜로 시간 고정
    const date1 = new Date('2024-07-31T10:00:00Z');
    vi.setSystemTime(date1);
    const challenge1 = generateDailyChallenge();

    // 다른 날짜로 시간 변경
    const date2 = new Date('2024-08-01T10:00:00Z');
    vi.setSystemTime(date2);
    const challenge2 = generateDailyChallenge();

    // 두 챌린지가 다른지 확인
    expect(challenge1).not.toEqual(challenge2);
    // 최소한 리더나 렌탈 포켓몬 구성이 달라야 함
    const isLeaderDifferent = challenge1.leader !== challenge2.leader;
    const isRentalsDifferent = challenge1.rentalPokemon.map(p => p.id).sort().join(',') !== challenge2.rentalPokemon.map(p => p.id).sort().join(',');
    
    expect(isLeaderDifferent || isRentalsDifferent).toBe(true);
  });

  it('should be affected by debug_day_offset in localStorage', () => {
    // 시간을 특정 날짜로 고정
    const testDate = new Date('2024-07-31T10:00:00Z');
    vi.setSystemTime(testDate);
    
    // localStorage 설정이 없을 때의 챌린지
    const challengeWithoutOffset = generateDailyChallenge();

    // localStorage에 offset 설정
    localStorage.setItem('debug_day_offset', '1');
    const challengeWithOffset = generateDailyChallenge();

    // 두 챌린지가 다른지 확인
    expect(challengeWithoutOffset).not.toEqual(challengeWithOffset);
    
    // offset을 적용한 챌린지가 다음 날의 챌린지와 동일한지 확인
    vi.setSystemTime(new Date('2024-08-01T10:00:00Z'));
    localStorage.clear(); // offset 제거
    const nextDayChallenge = generateDailyChallenge();

    expect(challengeWithOffset).toEqual(nextDayChallenge);
  });
});
