import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateDamage } from './battleUtils';
import { Pokemon, Move } from '../../types';

describe('calculateDamage for standard moves', () => {

  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // Random factor: 0.85 + (0.15 * 0.5) = 0.925
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const charizard: Pokemon = {
    id: 6,
    name: '리자몽',
    level: 50,
    types: ['불꽃', '비행'],
    typesEn: ['fire', 'flying'],
    stats: { hp: 153, attack: 84, defense: 78, spAttack: 109, spDefense: 85, speed: 100 },
    statStages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    status: null,
    maxHp: 153,
    currentHp: 153,
    image: null,
    moves: []
  };

  const venusaur: Pokemon = {
    id: 3,
    name: '이상해꽃',
    level: 50,
    types: ['풀', '독'],
    typesEn: ['grass', 'poison'],
    stats: { hp: 155, attack: 82, defense: 83, spAttack: 100, spDefense: 100, speed: 80 },
    statStages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    status: null,
    maxHp: 155,
    currentHp: 155,
    image: null,
    moves: []
  };
  
  const blastoise: Pokemon = {
    id: 9,
    name: '거북왕',
    level: 50,
    types: ['물'],
    typesEn: ['water'],
    stats: { hp: 154, attack: 83, defense: 100, spAttack: 85, spDefense: 105, speed: 78 },
    statStages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    status: null,
    maxHp: 154,
    currentHp: 154,
    image: null,
    moves: []
  };

  const flamethrower: Move = {
    name: 'flamethrower',
    nameKo: '화염방사',
    power: 90,
    type: 'fire',
    damageClass: 'special',
    category: 'damage',
    pp: 15,
    currentPP: 15,
    accuracy: 100
  };
  
  const crossChop: Move = {
    name: 'cross-chop',
    nameKo: '크로스촙',
    power: 100,
    type: 'fighting',
    damageClass: 'physical',
    category: 'damage',
    pp: 5,
    currentPP: 5,
    accuracy: 80
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
    const attacker = { ...charizard, status: 'burn' as const };
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
  const gengar: Pokemon = {
    id: 94,
    name: '팬텀',
    level: 50,
    types: ['고스트', '독'],
    typesEn: ['ghost', 'poison'],
    stats: { hp: 135, attack: 65, defense: 60, spAttack: 130, spDefense: 75, speed: 110 },
    statStages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    status: null,
    maxHp: 135,
    currentHp: 135,
    image: null,
    moves: []
  };

  const pikachu: Pokemon = {
    id: 25,
    name: '피카츄',
    level: 50,
    types: ['전기'],
    typesEn: ['electric'],
    stats: { hp: 110, attack: 55, defense: 40, spAttack: 50, spDefense: 50, speed: 90 },
    statStages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    status: null,
    maxHp: 110,
    currentHp: 110,
    image: null,
    moves: []
  };

  const snorlax: Pokemon = {
    id: 143,
    name: '잠만보',
    level: 50,
    types: ['노말'],
    typesEn: ['normal'],
    stats: { hp: 225, attack: 110, defense: 65, spAttack: 65, spDefense: 110, speed: 30 },
    statStages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    status: null,
    maxHp: 225,
    currentHp: 225,
    image: null,
    moves: []
  };

  const nightShade: Move = {
    name: 'night-shade',
    nameKo: '나이트헤드',
    category: 'damage+fixed',
    type: 'ghost',
    damageClass: 'special',
    power: 0,
    pp: 15,
    currentPP: 15,
    accuracy: 100
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
