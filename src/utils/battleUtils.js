// src/utils/battleUtils.js
import { getTypeMultiplier } from './typeUtils';

export const calculateDamage = (attacker, defender, move) => {
  // 화상 상태일 경우 물리 공격력 절반 감소
  const attackStat = move.damageClass === 'special' 
    ? attacker.stats.spAttack
    : (attacker.status === 'burn' ? Math.floor(attacker.stats.attack / 2) : attacker.stats.attack);
    
  const defenseStat = move.damageClass === 'special' ? defender.stats.spDefense : defender.stats.defense;
  
  const baseDamage = Math.floor((( (2 * 50 / 5 + 2) * move.power * (attackStat / defenseStat) ) / 50) + 2);
  
  const multiplier = getTypeMultiplier(move.type, defender.types);
  
  const stab = attacker.typesEn.includes(move.type) ? 1.5 : 1;
  
  const finalDamage = Math.floor(baseDamage * multiplier * stab * (0.85 + Math.random() * 0.15));
  
  return { damage: finalDamage, multiplier };
};

export const canAttack = (pokemon, addLog) => {
  if (pokemon.status === 'sleep') {
    if (pokemon.statusTurns > 0) {
      addLog(`${pokemon.name}은(는) 잠들어있다...`);
      pokemon.statusTurns -= 1;
      return false;
    } else {
      addLog(`${pokemon.name}이(가) 잠에서 깨어났다!`);
      pokemon.status = null;
    }
  }
  if (pokemon.status === 'freeze') {
    if (Math.random() > 0.2) { // 20% 해동 확률
      addLog(`${pokemon.name}이(가) 꽁꽁 얼어있다!`);
      return false;
    } else {
      addLog(`${pokemon.name}의 얼음이 녹았다!`);
      pokemon.status = null;
    }
  }
  if (pokemon.status === 'paralysis') {
    if (Math.random() < 0.25) { // 25% 확률로 행동 불가
      addLog(`${pokemon.name}은(는) 몸이 저려 움직일 수 없다!`);
      return false;
    }
  }
  return true;
};

export const processEndOfTurnStatus = (pokemon, setPokemonState, addLog) => {
  if (!pokemon || !pokemon.status || pokemon.currentHp <= 0) return;

  let damage = 0;
  let message = '';

  switch (pokemon.status) {
    case 'poison':
      damage = Math.max(1, Math.floor(pokemon.maxHp / 8));
      message = `${pokemon.name}은(는) 독 데미지를 입었다! (${damage})`;
      break;
    case 'burn':
      damage = Math.max(1, Math.floor(pokemon.maxHp / 16));
      message = `${pokemon.name}은(는) 화상 데미지를 입었다! (${damage})`;
      break;
    default:
      return;
  }

  const newHp = Math.max(0, pokemon.currentHp - damage);
  setPokemonState(prev => {
    const newState = [...prev];
    const pokeIndex = newState.findIndex(p => p.id === pokemon.id);
    if (pokeIndex !== -1) {
      newState[pokeIndex] = { ...newState[pokeIndex], currentHp: newHp };
    }
    return newState;
  });

  addLog(message);
};
