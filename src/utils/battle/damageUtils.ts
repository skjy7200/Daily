// src/utils/battle/damageUtils.ts
import { Pokemon, Move } from '../../types';
import { getTypeMultiplier } from '../pokemon/typeUtils';

const STAGE_MULTIPLIERS: Record<string, number> = {
  '-6': 2 / 8, '-5': 2 / 7, '-4': 2 / 6, '-3': 2 / 5, '-2': 2 / 4, '-1': 2 / 3,
  '0': 1,
  '1': 3 / 2, '2': 4 / 2, '3': 5 / 2, '4': 6 / 2, '5': 7 / 2, '6': 8 / 2,
};

export const getStatMultiplier = (stage: number): number => {
  return STAGE_MULTIPLIERS[String(stage)] || 1;
};

export const calculateDamage = (attacker: Pokemon, defender: Pokemon, move: Move, randomFactor: number = Math.random()) => {
  const multiplier = getTypeMultiplier(move.type, defender.types);
  if (multiplier === 0) {
    return { damage: 0, multiplier: 0 };
  }

  if (move.category === 'damage+fixed') {
    return { damage: attacker.level, multiplier: multiplier };
  }

  const attackMultiplier = getStatMultiplier(attacker.statStages.attack || 0);
  const defenseMultiplier = getStatMultiplier(defender.statStages.defense || 0);
  const spAttackMultiplier = getStatMultiplier(attacker.statStages.spAttack || 0);
  const spDefenseMultiplier = getStatMultiplier(defender.statStages.spDefense || 0);

  const burnModifier = (attacker.status === 'burn' && move.damageClass === 'physical') ? 0.5 : 1;

  const attackStat = move.damageClass === 'special'
    ? Math.floor((attacker.stats.spAttack || 0) * spAttackMultiplier * burnModifier)
    : Math.floor((attacker.stats.attack || 0) * attackMultiplier * burnModifier);

  const defenseStat = move.damageClass === 'special'
    ? Math.floor((defender.stats.spDefense || 0) * spDefenseMultiplier)
    : Math.floor((defender.stats.defense || 0) * defenseMultiplier);

  const baseDamage = Math.floor((( (2 * attacker.level / 5 + 2) * (move.power || 0) * (attackStat / defenseStat) ) / 50) + 2);

  const stab = attacker.typesEn && attacker.typesEn.includes(move.type) ? 1.5 : 1;

  const finalDamage = Math.floor(baseDamage * multiplier * stab * (0.85 + randomFactor * 0.15));

  return { damage: finalDamage, multiplier };
};
