/* eslint-disable no-unused-vars */
// src/utils/battle/statusUtils.ts
import { Pokemon, Move } from '../../types';

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

  const accStage = attacker.statStages?.accuracy || 0;
  const evaStage = defender.statStages?.evasion || 0;
  
  const combinedStage = Math.max(-6, Math.min(6, accStage - evaStage));
  const multiplier = getAccuracyMultiplier(combinedStage);
  
  const finalAccuracy = (typeof move.accuracy === 'number' ? move.accuracy : 100) * multiplier;
  return Math.random() * 100 <= finalAccuracy;
};

export const canAttack = (pokemon: Pokemon, addLog: (message: string) => void): { canAttack: boolean; updatedPokemon: Pokemon | null } => {
  let updatedPokemon: Pokemon | null = null;

  if (pokemon.status === 'sleep') {
    if (pokemon.statusTurns && pokemon.statusTurns > 0) {
      addLog(`${pokemon.name}은(는) 💤 잠들어 있다.`);
      updatedPokemon = { ...pokemon, statusTurns: pokemon.statusTurns - 1 };
      if (updatedPokemon.statusTurns === 0) {
        updatedPokemon.status = null;
        addLog(`${pokemon.name}이(가) 잠에서 깨어났다!`);
      }
      return { canAttack: false, updatedPokemon };
    } else {
      updatedPokemon = { ...pokemon, status: null };
      addLog(`${pokemon.name}이(가) 잠에서 깨어났다!`);
      return { canAttack: true, updatedPokemon };
    }
  }

  if (pokemon.status === 'freeze') {
    if (Math.random() < 0.2) {
      updatedPokemon = { ...pokemon, status: null };
      addLog(`${pokemon.name}의 얼음이 녹았다!`);
      return { canAttack: true, updatedPokemon };
    } else {
      addLog(`${pokemon.name}은(는) 얼어붙어서 움직일 수 없다!`);
      return { canAttack: false, updatedPokemon };
    }
  }

  if (pokemon.status === 'paralysis') {
    if (Math.random() < 0.25) {
      addLog(`${pokemon.name}은(는) 몸이 저려서 움직일 수 없다!`);
      return { canAttack: false, updatedPokemon: null };
    }
  }

  return { canAttack: true, updatedPokemon: null };
};

export const processEndOfTurnStatus = (
  pokemon: Pokemon,
  setPokemonState: (updater: (prev: Pokemon[]) => Pokemon[]) => void,
  addLog: (message: string) => void
) => {
  if (!pokemon || pokemon.currentHp <= 0 || !pokemon.status) return;

  if (pokemon.status === 'poison') {
    const damage = Math.max(1, Math.floor(pokemon.maxHp / 8));
    setPokemonState(prev => {
      const n = [...prev];
      const idx = n.findIndex(p => p.id === pokemon.id);
      if (idx !== -1) {
        const newHp = Math.max(0, n[idx].currentHp - damage);
        n[idx] = { ...n[idx], currentHp: newHp };
      }
      return n;
    });
    addLog(`${pokemon.name}은(는) 독 피해를 입었다!`);
  } else if (pokemon.status === 'burn') {
    const damage = Math.max(1, Math.floor(pokemon.maxHp / 16));
    setPokemonState(prev => {
      const n = [...prev];
      const idx = n.findIndex(p => p.id === pokemon.id);
      if (idx !== -1) {
        const newHp = Math.max(0, n[idx].currentHp - damage);
        n[idx] = { ...n[idx], currentHp: newHp };
      }
      return n;
    });
    addLog(`${pokemon.name}은(는) 화상 피해를 입었다!`);
  }
};
