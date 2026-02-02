
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

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

async function fetchPokemonData() {
  console.log(`Fetching data for ${POKEMON_COUNT} Pokémon...`);
  const results = [];

  for (let i = 1; i <= POKEMON_COUNT; i++) {
    try {
      console.log(`Processing #${i}...`);
      
      // 1. 기본 정보 및 스탯 조회
      const { data: pokemon } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${i}`);
      const { data: species } = await axios.get(pokemon.species.url);
      
      // 한글 이름 추출
      const koNameObj = species.names.find(n => n.language.name === 'ko');
      const name = koNameObj ? koNameObj.name : pokemon.name;

      // 스탯 매핑
      const stats = {};
      pokemon.stats.forEach(s => {
        if (STAT_TRANSLATIONS[s.stat.name]) {
          stats[STAT_TRANSLATIONS[s.stat.name]] = s.base_stat;
        }
      });

      // 타입 매핑
      const types = pokemon.types.map(t => TYPE_TRANSLATIONS[t.type.name] || t.type.name);

      // 2. 기술 조회 (공격 기술만, 랜덤 4개)
      // 전체 기술 목록에서 URL 추출
      const allMoveUrls = pokemon.moves.map(m => m.move.url);
      const selectedMoves = [];
      
      // 기술 상세 정보를 가져와서 공격 기술인지 확인 (병렬 처리 시 부하 고려하여 순차 혹은 청크 처리)
      // 너무 오래 걸리므로, 앞쪽 기술이 아닌 레벨업으로 배우는 기술 위주로 필터링하거나, 
      // 무작위로 뽑은 뒤 공격 기술이면 채택하는 방식 사용.
      
      // 효율성을 위해: 무작위로 섞은 뒤 하나씩 조회해서 공격 기술이면 추가, 4개 채워지면 중단.
      const shuffledMoves = allMoveUrls.sort(() => 0.5 - Math.random());
      
      for (const url of shuffledMoves) {
        if (selectedMoves.length >= 4) break;
        
        try {
          const { data: moveData } = await axios.get(url);
          
          // 공격 기술 필터링 (위력이 있거나, 'damage' 카테고리에 속하는 기술)
          if (moveData.power || (moveData.meta && moveData.meta.category.name.startsWith('damage'))) {
            const moveNameKoObj = moveData.names.find(n => n.language.name === 'ko');
            const nameKo = moveNameKoObj ? moveNameKoObj.name : moveData.name;
            
            // 부가 효과 처리 (상태이상, 능력치 변화 등)
            const moveEffect = {};

            // 1. 상태이상 효과
            if (moveData.meta?.ailment?.name && moveData.meta.ailment.name !== 'none' && moveData.effect_chance) {
              moveEffect.condition = moveData.meta.ailment.name;
              moveEffect.chance = moveData.effect_chance / 100;
            }

            // 2. 능력치 변화 효과
            if (moveData.stat_changes && moveData.stat_changes.length > 0) {
              moveEffect.stat_changes = moveData.stat_changes.map(sc => ({
                stat: STAT_TRANSLATIONS[sc.stat.name], // 'special-attack' -> 'spAttack'
                change: sc.change // e.g., +1, -2
              }));
              // 일부 기술은 확률적으로 능력치 변화가 터짐. 이 경우 effect_chance를 사용.
              // 여기서는 모든 stat_change가 100% 발동한다고 가정. 필요시 `moveData.effect_chance` 활용.
              if (moveData.effect_chance && !moveEffect.chance) {
                  moveEffect.chance = moveData.effect_chance / 100;
              }
            }

            selectedMoves.push({
              name: moveData.name,
              nameKo: nameKo,
              type: moveData.type.name, // 영문 타입 (로직용)
              power: moveData.power,
              accuracy: moveData.accuracy,
              pp: moveData.pp,
              damageClass: moveData.damage_class.name,
              category: moveData.meta.category.name, // 기술 카테고리 추가
              // moveEffect 객체에 키가 하나라도 있으면 객체를, 없으면 null을 할당
              effect: Object.keys(moveEffect).length > 0 ? moveEffect : null,
            });
          }
        } catch (e) {
          console.error(`Failed to fetch move ${url}`);
        }
      }

      // 만약 4개가 안 채워졌으면 (잉어킹 등), 있는 것만이라도 넣음.

      results.push({
        id: pokemon.id,
        name: name,
        types: types, // 한글 타입 배열
        typesEn: pokemon.types.map(t => t.type.name), // 로직용 영문 타입
        image: pokemon.sprites.front_default,
        image_back: pokemon.sprites.back_default, // 뒷모습 추가
        image_high: pokemon.sprites.other['official-artwork'].front_default,
        stats: stats,
        moves: selectedMoves,
        maxHp: stats.hp // 초기 HP 설정을 위해
      });

    } catch (error) {
      console.error(`Error processing #${i}:`, error.message);
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`Successfully wrote data to ${OUTPUT_PATH}`);
}

fetchPokemonData();
