import axios from 'axios';

// PokeAPI 기본 URL
const BASE_URL = 'https://pokeapi.co/api/v2';

// 메모리 캐싱을 위한 객체
const cache = {
  stats: {},
  moves: {},
};

/**
 * 포켓몬의 상세 정보(종족값)를 가져와 레벨 50 기준 실능으로 변환합니다.
 * @param {number|string} idOrName 포켓몬 ID 또는 영문 이름
 * @returns {Promise<Object>} 실능 객체 (hp, attack, defense, speed, spAttack, spDefense)
 */
export const getPokemonStats = async (idOrName) => {
  if (cache.stats[idOrName]) return cache.stats[idOrName];

  try {
    const response = await axios.get(`${BASE_URL}/pokemon/${idOrName}`);
    const baseStats = {};
    
    response.data.stats.forEach(stat => {
      switch(stat.stat.name) {
        case 'hp': baseStats.hp = stat.base_stat; break;
        case 'attack': baseStats.attack = stat.base_stat; break;
        case 'defense': baseStats.defense = stat.base_stat; break;
        case 'speed': baseStats.speed = stat.base_stat; break;
        case 'special-attack': baseStats.spAttack = stat.base_stat; break;
        case 'special-defense': baseStats.spDefense = stat.base_stat; break;
      }
    });

    // 레벨 50 실능 계산 (개체값 31, 노력값 0, 성격 보정 없음 가정)
    const level = 50;
    const iv = 31;
    const ev = 0;

    const stats = {
      hp: Math.floor((baseStats.hp * 2 + iv + Math.floor(ev / 4)) * level / 100) + level + 10,
      attack: Math.floor((baseStats.attack * 2 + iv + Math.floor(ev / 4)) * level / 100) + 5,
      defense: Math.floor((baseStats.defense * 2 + iv + Math.floor(ev / 4)) * level / 100) + 5,
      spAttack: Math.floor((baseStats.spAttack * 2 + iv + Math.floor(ev / 4)) * level / 100) + 5,
      spDefense: Math.floor((baseStats.spDefense * 2 + iv + Math.floor(ev / 4)) * level / 100) + 5,
      speed: Math.floor((baseStats.speed * 2 + iv + Math.floor(ev / 4)) * level / 100) + 5,
    };

    cache.stats[idOrName] = stats;
    return stats;
  } catch (error) {
    console.error(`Error fetching stats for ${idOrName}:`, error);
    return { hp: 120, attack: 70, defense: 70, speed: 70, spAttack: 70, spDefense: 70 };
  }
};

/**
 * 기술의 상세 정보(위력, 타입, 한글 이름)를 가져옵니다.
 * @param {string} url 기술 상세 정보 URL (PokeAPI)
 * @returns {Promise<Object>} 기술 정보 객체 (power, type, nameKo, accuracy, pp)
 */
export const getMoveDetails = async (url) => {
  if (cache.moves[url]) return cache.moves[url];

  try {
    const response = await axios.get(url);
    const data = response.data;

    // 한글 이름 찾기
    const nameEntry = data.names.find(n => n.language.name === 'ko');
    const nameKo = nameEntry ? nameEntry.name : data.name;

    const moveDetails = {
      name: data.name,
      nameKo: nameKo,
      power: data.power || 0, // 위력이 없는 기술(변화기 등)은 0 처리
      accuracy: data.accuracy || 100,
      pp: data.pp,
      type: data.type.name,
      damageClass: data.damage_class.name // physical, special, status
    };

    cache.moves[url] = moveDetails;
    return moveDetails;
  } catch (error) {
    console.error(`Error fetching move details for ${url}:`, error);
    return { nameKo: '몸통박치기', power: 40, accuracy: 100, type: 'normal', damageClass: 'physical' };
  }
};

/**
 * 포켓몬 객체의 moves 배열(URL 포함)을 받아 상세 정보를 모두 채워 반환합니다.
 * @param {Array} moves 포켓몬의 기술 목록 [{name, url}, ...]
 * @returns {Promise<Array>} 상세 정보가 포함된 기술 목록
 */
export const fetchMoveDetailsForPokemon = async (moves) => {
  // 4개 기술만 가져오기 (이미 4개로 잘려있다고 가정하거나 여기서 자름)
  const targetMoves = moves.slice(0, 4);
  
  const movePromises = targetMoves.map(move => getMoveDetails(move.url));
  const moveDetails = await Promise.all(movePromises);

  // 기술이 4개보다 적을 경우 '몸통박치기'로 채움 (방어 로직)
  while (moveDetails.length < 4) {
    moveDetails.push({ 
      name: 'tackle',
      nameKo: '몸통박치기', 
      power: 40, 
      accuracy: 100, 
      type: 'normal', 
      damageClass: 'physical' 
    });
  }
  
  return moveDetails;
};
