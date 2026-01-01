// src/utils/challengeUtils.js

import pokemonData from '../assets/pokemonData.json';

const GYM_LEADERS = [
  "웅", "이슬", "마티스", "민화", "독수", "초련", "강연", "비주기"
];

const GYM_LEADER_TEAMS = {
  "웅": [74, 111, 95], // 꼬마돌, 뿔카노, 롱스톤
  "이슬": [54, 120, 121], // 고라파덕, 별가사리, 아쿠스타
  "마티스": [100, 25, 26], // 찌리리공, 피카츄, 라이츄
  "민화": [114, 71, 45], // 덩쿠리, 우츠보트, 라플레시아
  "독수": [109, 89, 110], // 또가스, 질뻐기, 또도가스
  "초련": [64, 122, 65], // 윤겔라, 마임맨, 후딘
  "강연": [78, 126, 59], // 날쌩마, 마그마, 윈디
  "비주기": [31, 34, 112] // 니드퀸, 니드킹, 코뿌리
};

/**
 * [DevMode] 가상 날짜를 반환합니다.
 * localStorage의 'debug_day_offset' 값을 읽어 현재 시간에 더합니다.
 */
const getVirtualDate = () => {
  const now = new Date();
  const offsetDays = parseInt(localStorage.getItem('debug_day_offset') || '0', 10);
  if (offsetDays > 0) {
    now.setDate(now.getDate() + offsetDays);
  }
  return now;
};

/**
 * 오늘의 챌린지를 생성합니다.
 * KST 날짜를 기반으로 시드를 생성하여 모든 유저에게 동일한 결과를 제공합니다.
 * @returns {{leader: string, leaderPokemon: Array, rentalPokemon: Array}} 오늘의 챌린지 상세 정보.
 */
export const generateDailyChallenge = () => {
  const now = getVirtualDate(); // Use Virtual Date
  const offset = now.getTimezoneOffset() * 60 * 1000;
  const kstOffset = 9 * 60 * 60 * 1000;
  const nowKST = new Date(now.getTime() + offset + kstOffset);
  
  // YYYYMMDD 형식의 숫자를 시드로 사용
  const seed = nowKST.getFullYear() * 10000 + (nowKST.getMonth() + 1) * 100 + nowKST.getDate();

  // Mulberry32 알고리즘: 더 고품질의 난수 생성기
  const mulberry32 = (a) => {
    return () => {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // 시드 기반 난수 생성기 초기화
  const random = mulberry32(seed);

  // 체육관 관장 선택
  const leaderIndex = Math.floor(random() * GYM_LEADERS.length);
  const leader = GYM_LEADERS[leaderIndex];

  // 관장 전용 포켓몬 가져오기
  const leaderPokemonIds = GYM_LEADER_TEAMS[leader];
  const leaderPokemon = pokemonData.filter(p => leaderPokemonIds.includes(p.id))
    .sort((a, b) => leaderPokemonIds.indexOf(a.id) - leaderPokemonIds.indexOf(b.id));

  // 유저 렌탈 포켓몬을 위해 관장 포켓몬을 제외한 풀 생성
  const rentalPool = pokemonData.filter(p => !leaderPokemonIds.includes(p.id));
  
  // 유저를 위한 6마리 렌탈 포켓몬 선택
  const rentalPokemon = [];
  for (let i = 0; i < 6; i++) {
    const index = Math.floor(random() * rentalPool.length);
    rentalPokemon.push(rentalPool[index]);
    rentalPool.splice(index, 1);
  }

  return { leader, leaderPokemon, rentalPokemon };
};

/**
 * 다음 자정(KST)까지 남은 시간을 계산합니다.
 * @returns {{hours: number, minutes: number, seconds: number}} 남은 시간.
 */
export const getCountdownToMidnightKST = () => {
  const now = getVirtualDate(); // Use Virtual Date
  
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
