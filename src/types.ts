export interface MoveEffect {
  chance?: number;
  stat_changes?: Array<{
    stat: 'attack' | 'defense' | 'spAttack' | 'spDefense' | 'speed' | 'accuracy' | 'evasion';
    change: number;
  }>;
  condition?: 'poison' | 'burn' | 'sleep' | 'freeze' | 'paralysis';
}

export interface Move {
  name: string;
  nameKo: string;
  type: string;
  power: number | null;
  accuracy: number | true | null;
  pp: number;
  currentPP: number;
  damageClass: 'physical' | 'special' | string;
  category: string;
  effect?: MoveEffect | null;
  isStruggle?: boolean;
}

export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  [key: string]: number;
}

export interface StatStages {
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  accuracy: number;
  evasion: number;
  [key: string]: number;
}

export interface Pokemon {
  id: number;
  name: string;
  level: number;
  types: string[];
  typesEn: string[];
  image: string | null;
  image_back?: string | null;
  image_high?: string | null;
  maxHp: number;
  currentHp: number;
  status: 'poison' | 'burn' | 'sleep' | 'freeze' | 'paralysis' | null | undefined;
  statusTurns?: number;
  stats: Stats;
  statStages: StatStages;
  moves: Move[];
}

export interface DailyChallenge {
  leader: string;
  leaderSprite: string;
  leaderPokemon: Pokemon[];
  rentalPokemon: Pokemon[];
}

export interface LeaderData {
  name: string;
  sprite: string;
  pokemon: Pokemon[];
}
