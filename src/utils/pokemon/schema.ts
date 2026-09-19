import { z } from 'zod';

export const PokemonSchema = z.object({
  id: z.number(),
  name: z.string(),
  types: z.array(z.string()),
  typesEn: z.array(z.string()),
  image: z.string().nullable(),
  image_back: z.string().nullable(),
  image_high: z.string().nullable(),
  stats: z.object({
    hp: z.number(),
    attack: z.number(),
    defense: z.number(),
    spAttack: z.number(),
    spDefense: z.number(),
    speed: z.number(),
  }),
  moves: z.array(z.object({
    name: z.string(),
    nameKo: z.string(),
    type: z.string(),
    power: z.number().nullable(),
    accuracy: z.number().nullable(),
    pp: z.number(),
    damageClass: z.string(),
    category: z.string(),
    effect: z.object({
      condition: z.string().optional(),
      chance: z.number().optional(),
      stat_changes: z.array(z.object({
        stat: z.string(),
        change: z.number(),
      })).optional(),
    }).nullable(),
  })),
  maxHp: z.number(),
});

export const PokemonListSchema = z.array(PokemonSchema);
