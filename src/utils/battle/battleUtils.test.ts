import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateDamage } from './battleUtils';

describe('calculateDamage for standard moves', () => {

  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // Random factor: 0.85 + (0.15 * 0.5) = 0.925
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const charizard = {
    name: '리자몽',
    level: 50,
    types: ['불꽃', '비행'],
    typesEn: ['fire', 'flying'],
    stats: { attack: 84, defense: 78, spAttack: 109, spDefense: 85 },
    statStages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
    status: null,
  };

  const venusaur = {
    name: '이상해꽃',
    level: 50,
    types: ['풀', '독'],
    typesEn: ['grass', 'poison'],
    stats: { attack: 82, defense: 83, spAttack: 100, spDefense: 100 },
    statStages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  };
  
  const blastoise = {
    name: '거북왕',
    level: 50,
    types: ['물'],
    typesEn: ['water'],
    stats: { attack: 83, defense: 100, spAttack: 85, spDefense: 105 },
    statStages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  };

  const flamethrower = {
    name: '화염방사', power: 90, type: 'fire', damageClass: 'special',
  };
  
  const crossChop = {
    name: '크로스촙', power: 100, type: 'fighting', damageClass: 'physical',
  };

  it('calculates damage correctly for a super-effective STAB move', () => {
    const attacker = charizard;
    const defender = venusaur;
    const move = flamethrower;
    
    const { damage } = calculateDamage(attacker, defender, move, 0.5);
    expect(damage).toBe(124);
  });
  
  it('calculates damage correctly for a not-very-effective STAB move', () => {
    const attacker = charizard;
    const defender = blastoise;
    const move = flamethrower;

    const { damage } = calculateDamage(attacker, defender, move, 0.5);
    expect(damage).toBe(29);
  });
  
  it('halves attack for burned attacker using a physical move', () => {
    const attacker = { ...charizard, status: 'burn' };
    const defender = venusaur;
    const move = crossChop;
    
    const { damage } = calculateDamage(attacker, defender, move, 0.5);
    expect(damage).toBe(11);
  });

  it('applies stat stages correctly to damage calculation', () => {
    const boostedAttacker = { ...charizard, statStages: { ...charizard.statStages, spAttack: 2 } }; // spAttack +2 stages (2x)
    const debuffedDefender = { ...venusaur, statStages: { ...venusaur.statStages, spDefense: -1 } }; // spDefense -1 stage (0.66x)

    const { damage } = calculateDamage(boostedAttacker, debuffedDefender, flamethrower, 0.5);
    expect(damage).toBe(366);
  });
});

describe('calculateDamage for fixed-damage moves', () => {
  const gengar = {
    name: '팬텀',
    level: 50,
    types: ['고스트', '독'],
    typesEn: ['ghost', 'poison'],
    stats: { attack: 65, defense: 60, spAttack: 130, spDefense: 75, speed: 110 },
    statStages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  };

  const pikachu = {
    name: '피카츄',
    level: 50,
    types: ['전기'],
    typesEn: ['electric'],
    stats: { attack: 55, defense: 40, spAttack: 50, spDefense: 50, speed: 90 },
    statStages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  };

  const snorlax = {
    name: '잠만보',
    level: 50,
    types: ['노말'],
    typesEn: ['normal'],
    stats: { attack: 110, defense: 65, spAttack: 65, spDefense: 110, speed: 30 },
    statStages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
  };

  const nightShade = {
    name: '나이트헤드',
    category: 'damage+fixed',
    type: 'ghost',
    damageClass: 'special',
    power: 0,
  };

  it('deals damage equal to user level if not immune', () => {
    const { damage } = calculateDamage(gengar, pikachu, nightShade, 0.5);
    expect(damage).toBe(50);
  });

  it('deals 0 damage if defender is immune', () => {
    const { damage } = calculateDamage(gengar, snorlax, nightShade, 0.5);
    expect(damage).toBe(0);
  });

  it('ignores stats, stat stages, and STAB', () => {
    const boostedGengar = { ...gengar, statStages: { ...gengar.statStages, spAttack: 6 } };
    const { damage } = calculateDamage(boostedGengar, pikachu, nightShade, 0.5);
    expect(damage).toBe(50);
  });
});
