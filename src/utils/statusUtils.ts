// src/utils/statusUtils.ts

interface StatStages {
  accuracy?: number;
  evasion?: number;
}

interface Pokemon {
  id: string;
  name: string;
  currentHp: number;
  maxHp: number;
  status: string | null;
  statusTurns?: number;
  statStages: StatStages;
}

interface Move {
  accuracy: number | true;
}

const ACCURACY_EVASION_MULTIPLIERS: Record<string, number> = {
  '-6': 3 / 9, '-5': 3 / 8, '-4': 3 / 7, '-3': 3 / 6, '-2': 3 / 5, '-1': 3 / 4,
  '0': 3 / 3,
  '1': 4 / 3, '2': 5 / 3, '3': 6 / 3, '4': 7 / 3, '5': 8 / 3, '6': 9 / 3,
};

export const getAccuracyMultiplier = (stage: number): number => {
  return ACCURACY_EVASION_MULTIPLIERS[String(stage)] || 1;
};

export const checkHit = (attacker: Pokemon, defender: Pokemon, move: Move): boolean => {
  if (!move.accuracy || move.accuracy === true) return true;

  const accStage = attacker.statStages.accuracy || 0;
  const evaStage = defender.statStages.evasion || 0;
  
  const combinedStage = Math.max(-6, Math.min(6, accStage - evaStage));
  const multiplier = getAccuracyMultiplier(combinedStage);
  
  const finalAccuracy = move.accuracy * multiplier;
  return Math.random() * 100 <= finalAccuracy;
};

export const canAttack = (pokemon: Pokemon, addLog: (message: string) => void): { canAttack: boolean; updatedPokemon: Pokemon | null } => {
  let updatedPokemon: Pokemon | null = null;

  if (pokemon.status === 'sleep') {
    if (pokemon.statusTurns && pokemon.statusTurns > 0) {
      addLog(`${pokemon.name}은(는) 잠들어있다...`);
      updatedPokemon = { ...pokemon, statusTurns: pokemon.statusTurns - 1 };
      return { canAttack: false, updatedPokemon };
    } else {
      addLog(`${pokemon.name}이(가) 잠에서 깨어났다!`);
      updatedPokemon = { ...pokemon, status: null };
      return { canAttack: true, updatedPokemon };
    }
  }
  if (pokemon.status === 'freeze') {
    if (Math.random() > 0.2) {
      addLog(`${pokemon.name}이(가) 꽁꽁 얼어있다!`);
      return { canAttack: false, updatedPokemon };
    } else {
      addLog(`${pokemon.name}의 얼음이 녹았다!`);
      updatedPokemon = { ...pokemon, status: null };
      return { canAttack: true, updatedPokemon };
    }
  }
  if (pokemon.status === 'paralysis') {
    if (Math.random() < 0.25) {
      addLog(`${pokemon.name}은(는) 몸이 저려 움직일 수 없다!`);
      return { canAttack: false, updatedPokemon };
    }
  }
  return { canAttack: true, updatedPokemon };
};

export const processEndOfTurnStatus = (
  pokemon: Pokemon, 
  setPokemonState: (updater: (prev: Pokemon[]) => Pokemon[]) => void, 
  addLog: (message: string) => void
): void => {
  if (!pokemon || pokemon.currentHp <= 0) return;

  setPokemonState(prev => {
    const newState = [...prev];
    const pokeIndex = newState.findIndex(p => p.id === pokemon.id);
    if (pokeIndex === -1) return newState;

    const currentPoke = newState[pokeIndex];
    if (!currentPoke.status) return newState;

    let damage = 0;
    let message = '';

    switch (currentPoke.status) {
      case 'poison':
        damage = Math.max(1, Math.floor(currentPoke.maxHp / 8));
        message = `${currentPoke.name}은(는) 독 데미지를 입었다! (${damage})`;
        break;
      case 'burn':
        damage = Math.max(1, Math.floor(currentPoke.maxHp / 16));
        message = `${currentPoke.name}은(는) 화상 데미지를 입었다! (${damage})`;
        break;
      default:
        return newState;
    }

    const newHp = Math.max(0, currentPoke.currentHp - damage);
    newState[pokeIndex] = { ...currentPoke, currentHp: newHp };
    addLog(message);
    return newState;
  });
};
