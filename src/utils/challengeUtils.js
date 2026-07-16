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

const GYM_LEADER_SPRITES = {
  "웅": "https://play.pokemonshowdown.com/sprites/trainers/brock.png",
  "이슬": "https://play.pokemonshowdown.com/sprites/trainers/misty.png",
  "마티스": "https://play.pokemonshowdown.com/sprites/trainers/ltsurge.png",
  "민화": "https://play.pokemonshowdown.com/sprites/trainers/erika.png",
  "독수": "https://play.pokemonshowdown.com/sprites/trainers/koga.png",
  "초련": "https://play.pokemonshowdown.com/sprites/trainers/sabrina.png",
  "강연": "https://play.pokemonshowdown.com/sprites/trainers/blaine.png",
  "비주기": "https://play.pokemonshowdown.com/sprites/trainers/giovanni.png"
};

/**
 * [DevMode] 가상 날짜 반환.
 * localStorage의 'debug_day_offset' 값을 현재 시간에 반영.
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
 * 오늘의 챌린지 생성.
 * KST 기준 날짜 시드로 일관된 결과 제공.
 * @returns {{leader: string, leaderSprite: string, leaderPokemon: Array, rentalPokemon: Array}} 챌린지 상세 정보
 */
export const generateDailyChallenge = () => {
  const now = getVirtualDate(); // 가상 날짜 적용
  const offset = now.getTimezoneOffset() * 60 * 1000;
  const kstOffset = 9 * 60 * 60 * 1000;
  const nowKST = new Date(now.getTime() + offset + kstOffset);
  
  // YYYYMMDD 형식 시드 생성
  const seed = nowKST.getFullYear() * 10000 + (nowKST.getMonth() + 1) * 100 + nowKST.getDate();

  // Mulberry32 난수 생성기
  const mulberry32 = (a) => {
    return () => {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // 난수 생성기 초기화
  const random = mulberry32(seed);

  // 체육관 관장 선택
  const leaderIndex = Math.floor(random() * GYM_LEADERS.length);
  const leader = GYM_LEADERS[leaderIndex];
  const leaderSprite = GYM_LEADER_SPRITES[leader];

  // 관장 포켓몬 선정
  const leaderPokemonIds = GYM_LEADER_TEAMS[leader];
  const leaderPokemon = pokemonData.filter(p => leaderPokemonIds.includes(p.id))
    .sort((a, b) => leaderPokemonIds.indexOf(a.id) - leaderPokemonIds.indexOf(b.id));

  // 관장 포켓몬 제외 렌탈 풀 생성
  const rentalPool = pokemonData.filter(p => !leaderPokemonIds.includes(p.id));
  
  // 렌탈 포켓몬 6마리 선정
  const rentalPokemon = [];
  for (let i = 0; i < 6; i++) {
    const index = Math.floor(random() * rentalPool.length);
    rentalPokemon.push(rentalPool[index]);
    rentalPool.splice(index, 1);
  }

  return { leader, leaderSprite, leaderPokemon, rentalPokemon };
};

/**
 * 자정(KST)까지 남은 시간 계산.
 * @returns {{hours: number, minutes: number, seconds: number}} 잔여 시간
 */
export const getCountdownToMidnightKST = () => {
  const now = getVirtualDate(); // 가상 날짜 적용
  
  // KST 변환
  const offset = now.getTimezoneOffset() * 60 * 1000; 
  const kstOffset = 9 * 60 * 60 * 1000;
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
