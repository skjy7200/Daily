
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { PokemonListSchema } from '../src/utils/pokemon/schema.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POKEMON_COUNT = 151;
const OUTPUT_PATH = path.join(__dirname, '../src/assets/pokemonData.json');

// 한글 타입 맵핑
const TYPE_TRANSLATIONS = {
  normal: '노말', fighting: '격투', flying: '비행', poison: '독', ground: '땅', rock: '바위', bug: '벌레',
  ghost: '고스트', steel: '강철', fire: '불꽃', water: '물', grass: '풀', electric: '전기', psychic: '에스퍼',
  ice: '얼음', dragon: '드래곤', dark: '악', fairy: '페어리'
};

const STAT_TRANSLATIONS = {
  hp: 'hp', 'attack': 'attack', 'defense': 'defense', 
  'special-attack': 'spAttack', 'special-defense': 'spDefense', 'speed': 'speed'
};

async function fetchSinglePokemon(id) {
  try {
    const { data: pokemon } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const { data: species } = await axios.get(pokemon.species.url);
    
    const koNameObj = species.names.find(n => n.language.name === 'ko');
    const name = koNameObj ? koNameObj.name : pokemon.name;

    const stats = {};
    pokemon.stats.forEach(s => {
      if (STAT_TRANSLATIONS[s.stat.name]) {
        stats[STAT_TRANSLATIONS[s.stat.name]] = s.base_stat;
      }
    });

    const types = pokemon.types.map(t => TYPE_TRANSLATIONS[t.type.name] || t.type.name);

    const allMoveUrls = pokemon.moves.map(m => m.move.url);
    const selectedMoves = [];
    const shuffledMoves = allMoveUrls.sort(() => 0.5 - Math.random());
    
    for (const url of shuffledMoves) {
      if (selectedMoves.length >= 4) break;
      try {
        const { data: moveData } = await axios.get(url);
        
        if (moveData.power || (moveData.meta && moveData.meta.category.name.startsWith('damage'))) {
          const moveNameKoObj = moveData.names.find(n => n.language.name === 'ko');
          const nameKo = moveNameKoObj ? moveNameKoObj.name : moveData.name;
          
          const moveEffect = {};
          if (moveData.meta?.ailment?.name && moveData.meta.ailment.name !== 'none' && moveData.effect_chance) {
            moveEffect.condition = moveData.meta.ailment.name;
            moveEffect.chance = moveData.effect_chance / 100;
          }

          if (moveData.stat_changes && moveData.stat_changes.length > 0) {
            moveEffect.stat_changes = moveData.stat_changes.map(sc => ({
              stat: STAT_TRANSLATIONS[sc.stat.name] || sc.stat.name,
              change: sc.change
            }));
            if (moveData.effect_chance && !moveEffect.chance) {
                moveEffect.chance = moveData.effect_chance / 100;
            }
          }

          selectedMoves.push({
            name: moveData.name,
            nameKo: nameKo,
            type: moveData.type.name,
            power: moveData.power,
            accuracy: moveData.accuracy,
            pp: moveData.pp,
            damageClass: moveData.damage_class.name,
            category: moveData.meta.category.name,
            effect: Object.keys(moveEffect).length > 0 ? moveEffect : null,
          });
        }
      } catch {
        console.error(`Failed to fetch move ${url}`);
      }
    }

    return {
      id: pokemon.id,
      name: name,
      types: types,
      typesEn: pokemon.types.map(t => t.type.name),
      image: pokemon.sprites.front_default,
      image_back: pokemon.sprites.back_default,
      image_high: pokemon.sprites.other['official-artwork'].front_default,
      stats: stats,
      moves: selectedMoves,
      maxHp: stats.hp
    };

  } catch (error) {
    console.error(`Error processing #${id}:`, error.message);
    return null;
  }
}

async function fetchPokemonData() {
  console.log(`Fetching data for ${POKEMON_COUNT} Pokémon...`);
  
  const ids = Array.from({ length: POKEMON_COUNT }, (_, i) => i + 1);
  const CHUNK_SIZE = 10;
  const results = [];

  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    console.log(`Processing chunk ${i / CHUNK_SIZE + 1}...`);
    const chunkResults = await Promise.all(chunk.map(id => fetchSinglePokemon(id)));
    results.push(...chunkResults.filter(r => r !== null));
  }

  // Validate with Zod
  try {
    const validatedData = PokemonListSchema.parse(results);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(validatedData, null, 2), 'utf-8');
    console.log(`Successfully validated and wrote data to ${OUTPUT_PATH}`);
  } catch (error) {
    console.error("Data validation failed:", error);
    process.exit(1);
  }
}

fetchPokemonData();
