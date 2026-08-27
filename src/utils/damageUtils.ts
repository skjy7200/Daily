// src/utils/damageUtils.ts
import { getTypeMultiplier } from './typeUtils';

interface Stats {
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
}

interface StatStages {
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
}

interface Pokemon {
  types: string[];
  typesEn: string[];
  stats: Stats;
  statStages: StatStages;
  status?: string;
}

interface Move {
  type: string;
  category: string;
  damageClass: 'physical' | 'special';
  power: number;
}

const STAGE_MULTIPLIERS: Record<string, number> = {
  '-6': 2 / 8, '-5': 2 / 7, '-4': 2 / 6, '-3': 2 / 5, '-2': 2 / 4, '-1': 2 / 3,
  '0': 1,
  '1': 3 / 2, '2': 4 / 2, '3': 5 / 2, '4': 6 / 2, '5': 7 / 2, '6': 8 / 2,
};

export const getStatMultiplier = (stage: number): number => {
  return STAGE_MULTIPLIERS[String(stage)] || 1;
};

export const calculateDamage = (attacker: Pokemon, defender: Pokemon, move: Move) => {
  const multiplier = getTypeMultiplier(move.type, defender.types);
  if (multiplier === 0) {
    return { damage: 0, multiplier: 0 };
  }

  if (move.category === 'damage+fixed') {
    return { damage: 50, multiplier: multiplier };
  }

  const attackMultiplier = getStatMultiplier(attacker.statStages.attack);
  const defenseMultiplier = getStatMultiplier(defender.statStages.defense);
  const spAttackMultiplier = getStatMultiplier(attacker.statStages.spAttack);
  const spDefenseMultiplier = getStatMultiplier(defender.statStages.spDefense);

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
