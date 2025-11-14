// src/utils/challengeUtils.js

import pokemonData from '../assets/pokemonData.json';

const GYM_LEADERS = [
  "웅", "이슬", "마티스", "민화", "독수", "초련", "강연", "비주기"
];

/**
 * 오늘의 챌린지를 생성합니다.
 * 현재는 제한된 pokemonData.json을 사용합니다.
 * 정식 버전에서는 151마리의 포켓몬 중에서 선택해야 합니다.
 * @returns {{leader: string, pokemon: Array}} 오늘의 챌린지 상세 정보.
 */
export const generateDailyChallenge = () => {
  // 개발자 테스트를 위해, 날짜 기반 시드 대신 랜덤 시드를 사용합니다.
  // 이렇게 하면 새로고침할 때마다 관장과 포켓몬이 변경됩니다.
  const seed = Date.now() + Math.random();

  // 간단한 의사 난수 생성기
  const pseudoRandom = (s) => {
    let x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  // 체육관 관장 선택
  const leaderIndex = Math.floor(pseudoRandom(seed) * GYM_LEADERS.length);
  const leader = GYM_LEADERS[leaderIndex];

  // 관장을 위한 3마리의 고유 포켓몬 선택
  const selectedPokemon = [];
  const availablePokemon = [...pokemonData]; // 원본 배열 수정을 피하기 위해 복사본 사용
  
  for (let i = 0; i < 3; i++) {
    if (availablePokemon.length === 0) {
      // 사용 가능한 고유 포켓몬이 부족할 경우 대비 (예: 제한된 데이터로 테스트 시)
      selectedPokemon.push(pokemonData[Math.floor(pseudoRandom(seed + i) * pokemonData.length)]);
      continue;
    }
    const pokemonIndex = Math.floor(pseudoRandom(seed + i + 1) * availablePokemon.length);
    selectedPokemon.push(availablePokemon[pokemonIndex]);
    availablePokemon.splice(pokemonIndex, 1); // 고유성을 보장하기 위해 제거
  }

  return { leader, pokemon: selectedPokemon };
};

/**
 * 다음 자정(KST)까지 남은 시간을 계산합니다.
 * @returns {{hours: number, minutes: number, seconds: number}} 남은 시간.
 */
export const getCountdownToMidnightKST = () => {
  const now = new Date();
  
  // 현재 시간을 KST로 변환
  const offset = now.getTimezoneOffset() * 60 * 1000; // 로컬 시간대의 오프셋(밀리초)
  const kstOffset = 9 * 60 * 60 * 1000; // KST는 UTC+9
  const nowKST = new Date(now.getTime() + offset + kstOffset);

  const midnightKST = new Date(nowKST);
  midnightKST.setDate(nowKST.getDate() + 1);
  midnightKST.setHours(0, 0, 0, 0);

  const remainingTimeMs = midnightKST.getTime() - nowKST.getTime();

  const hours = Math.floor(remainingTimeMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingTimeMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingTimeMs % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
};
