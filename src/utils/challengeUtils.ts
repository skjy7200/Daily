// src/utils/challengeUtils.ts

import pokemonData from '../assets/pokemonData.json';

interface Pokemon {
  id: number;
  name: string;
}

const GYM_LEADERS = [
  "웅", "이슬", "마티스", "민화", "독수", "초련", "강연", "비주기"
];

const GYM_LEADER_TEAMS: Record<string, number[]> = {
  "웅": [74, 111, 95], // 꼬마돌, 뿔카노, 롱스톤
  "이슬": [54, 120, 121], // 고라파덕, 별가사리, 아쿠스타
  "마티스": [100, 25, 26], // 찌리리공, 피카츄, 라이츄
  "민화": [114, 71, 45], // 덩쿠리, 우츠보트, 라플레시아
  "독수": [109, 89, 110], // 또가스, 질뻐기, 또도가스
  "초련": [64, 122, 65], // 윤겔라, 마임맨, 후딘
  "강연": [78, 126, 59], // 날쌩마, 마그마, 윈디
  "비주기": [31, 34, 112] // 니드퀸, 니드킹, 코뿌리
};

const GYM_LEADER_SPRITES: Record<string, string> = {
  "웅": "https://play.pokemonshowdown.com/sprites/trainers/brock.png",
  "이슬": "https://play.pokemonshowdown.com/sprites/trainers/misty.png",
  "마티스": "https://play.pokemonshowdown.com/sprites/trainers/ltsurge.png",
  "민화": "https://play.pokemonshowdown.com/sprites/trainers/erika.png",
  "독수": "https://play.pokemonshowdown.com/sprites/trainers/koga.png",
  "초련": "https://play.pokemonshowdown.com/sprites/trainers/sabrina.png",
  "강연": "https://play.pokemonshowdown.com/sprites/trainers/blaine.png",
  "비주기": "https://play.pokemonshowdown.com/sprites/trainers/giovanni.png"
};

const getVirtualDate = (): Date => {
  const now = new Date();
  const offsetDays = parseInt(localStorage.getItem('debug_day_offset') || '0', 10);
  if (offsetDays > 0) {
    now.setDate(now.getDate() + offsetDays);
  }
  return now;
};

export const generateDailyChallenge = () => {
  const now = getVirtualDate(); 
  const offset = now.getTimezoneOffset() * 60 * 1000;
  const kstOffset = 9 * 60 * 60 * 1000;
  const nowKST = new Date(now.getTime() + offset + kstOffset);
  
  const seed = nowKST.getFullYear() * 10000 + (nowKST.getMonth() + 1) * 100 + nowKST.getDate();

  const mulberry32 = (a: number) => {
    return () => {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const random = mulberry32(seed);

  const leaderIndex = Math.floor(random() * GYM_LEADERS.length);
  const leader = GYM_LEADERS[leaderIndex];
  const leaderSprite = GYM_LEADER_SPRITES[leader];

  const leaderPokemonIds = GYM_LEADER_TEAMS[leader];
  const leaderPokemon = (pokemonData as Pokemon[]).filter(p => leaderPokemonIds.includes(p.id))
    .sort((a, b) => leaderPokemonIds.indexOf(a.id) - leaderPokemonIds.indexOf(b.id));

  const rentalPool = (pokemonData as Pokemon[]).filter(p => !leaderPokemonIds.includes(p.id));
  
  const rentalPokemon = [];
  for (let i = 0; i < 6; i++) {
    const index = Math.floor(random() * rentalPool.length);
    rentalPokemon.push(rentalPool[index]);
    rentalPool.splice(index, 1);
  }

  return { leader, leaderSprite, leaderPokemon, rentalPokemon };
};

export const getCountdownToMidnightKST = () => {
  const now = getVirtualDate(); 
  
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
