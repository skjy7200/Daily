// src/utils/battleUtils.js
import { getTypeMultiplier } from './typeUtils';

const STAGE_MULTIPLIERS = {
  '-6': 2 / 8, '-5': 2 / 7, '-4': 2 / 6, '-3': 2 / 5, '-2': 2 / 4, '-1': 2 / 3,
  '0': 1,
  '1': 3 / 2, '2': 4 / 2, '3': 5 / 2, '4': 6 / 2, '5': 7 / 2, '6': 8 / 2,
};

export const getStatMultiplier = (stage) => {
  return STAGE_MULTIPLIERS[stage] || 1;
};

export const calculateDamage = (attacker, defender, move) => {
  // 1. 타입 상성 배율 계산 (무효화 체크)
  const multiplier = getTypeMultiplier(move.type, defender.types);
  if (multiplier === 0) {
    return { damage: 0, multiplier: 0 }; // 타입 무효화 시 데미지 0
  }

  // 2. 고정 데미지 기술 처리 (예: 나이트헤드)
  if (move.category === 'damage+fixed') {
    // 레벨과 동일한 데미지 (현재 모든 포켓몬 Lv.50)
    return { damage: 50, multiplier: multiplier };
  }

  // 3. 기존 데미지 계산 로직 (능력치 랭크 적용 등)
  // 능력치 랭크 적용
  const attackMultiplier = getStatMultiplier(attacker.statStages.attack);
  const defenseMultiplier = getStatMultiplier(defender.statStages.defense);
  const spAttackMultiplier = getStatMultiplier(attacker.statStages.spAttack);
  const spDefenseMultiplier = getStatMultiplier(defender.statStages.spDefense);

  // 화상 상태일 경우 물리 공격력 절반 감소
  const burnModifier = (attacker.status === 'burn' && move.damageClass === 'physical') ? 0.5 : 1;

  const attackStat = move.damageClass === 'special' 
    ? Math.floor(attacker.stats.spAttack * spAttackMultiplier)
    : Math.floor(attacker.stats.attack * attackMultiplier * burnModifier);
    
  const defenseStat = move.damageClass === 'special' 
    ? Math.floor(defender.stats.spDefense * spDefenseMultiplier)
    : Math.floor(defender.stats.defense * defenseMultiplier);
  
  const baseDamage = Math.floor((( (2 * 50 / 5 + 2) * move.power * (attackStat / defenseStat) ) / 50) + 2);
  
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

export const applyMoveEffects = async (move, attacker, defender, setAttackerState, setDefenderState, addLog) => {
  if (!move.effect) return;

  // 부가 효과 발동 확률 체크
  if (move.effect.chance && Math.random() > move.effect.chance) {
    return;
  }

  // 1. 능력치 변화 효과 처리
  if (move.effect.stat_changes) {
    for (const sc of move.effect.stat_changes) {
      const isSelf = sc.change > 0;
      const target = isSelf ? attacker : defender;
      const setTargetState = isSelf ? setAttackerState : setDefenderState;
      const targetName = target.name;

      setTargetState(prev => {
        const newState = [...prev];
        const pokeIndex = newState.findIndex(p => p.id === target.id);
        if (pokeIndex === -1) return newState;

        const updatedPokemon = { ...newState[pokeIndex] };
        const currentStage = updatedPokemon.statStages[sc.stat] || 0;
        
        // 랭크는 -6 ~ +6 사이로 제한
        const newStage = Math.max(-6, Math.min(6, currentStage + sc.change));
        
        if (newStage === currentStage) {
            addLog(`${targetName}의 ${sc.stat}은(는) 더 이상 변하지 않는다!`);
            return newState;
        }

        updatedPokemon.statStages[sc.stat] = newStage;

        // 로그 메시지 생성
        if (newStage > currentStage) {
          addLog(`${targetName}의 ${sc.stat}이(가) 올랐다!`);
        } else if (newStage < currentStage) {
          addLog(`${targetName}의 ${sc.stat}이(가) 떨어졌다!`);
        }
        
        newState[pokeIndex] = updatedPokemon;
        return newState;
      });
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // 2. 상태이상 효과 처리
  if (move.effect.condition) {
    const target = defender; // 상태이상은 항상 상대에게 적용
    
    // 이미 같은 상태이상이면 적용 안함
    if (target.status === move.effect.condition) return;

    let statusApplied = true;
    // 타입에 따른 면역 체크
    if (move.effect.condition === 'poison' && (target.types.includes('독') || target.types.includes('강철'))) {
        statusApplied = false;
    }
    if (move.effect.condition === 'burn' && target.types.includes('불꽃')) {
        statusApplied = false;
    }

    if (statusApplied) {
      setDefenderState(prev => {
        const newState = [...prev];
        const pokeIndex = newState.findIndex(p => p.id === target.id);
        if (pokeIndex === -1) return newState;
        
        const updatedPokemon = { ...newState[pokeIndex] };
        updatedPokemon.status = move.effect.condition;
        if (move.effect.condition === 'sleep') {
          updatedPokemon.statusTurns = Math.floor(Math.random() * 3) + 1; // 1~3턴간 잠
        }
        newState[pokeIndex] = updatedPokemon;
        return newState;
      });
      addLog(`${target.name}은(는) ${move.effect.condition}에 걸렸다!`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
};