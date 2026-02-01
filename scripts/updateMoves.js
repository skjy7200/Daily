import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modules에서 __dirname을 대체하는 방법
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POKEMON_DATA_PATH = path.join(__dirname, '../src/assets/pokemonData.json');
const GEN_1_VERSION_GROUP = 'red-blue'; // 1세대 기준

/**
 * PokeAPI로부터 기술 상세 정보를 가져옵니다. 한국어 이름 포함.
 * @param {string} moveName - 기술의 영문 이름
 * @returns {Promise<object|null>} - 기술 상세 정보 객체
 */
async function getMoveDetails(moveName) {
  try {
    const response = await axios.get(`https://pokeapi.co/api/v2/move/${moveName}`);
    const { data } = response;
    const nameKo = data.names.find(n => n.language.name === 'ko')?.name || data.name;

    return {
      name: data.name,
      nameKo: nameKo,
      type: data.type.name,
      power: data.power,
      accuracy: data.accuracy,
      pp: data.pp,
      damageClass: data.damage_class.name,
      effect: null // 효과는 단순화를 위해 일단 제외
    };
  } catch (error) {
    console.error(`Error fetching details for move: ${moveName}`, error.message);
    return null;
  }
}

/**
 * pokemonData.json의 모든 포켓몬 기술 목록을 1세대 기준으로 업데이트합니다.
 */
async function updateAllPokemonMoves() {
  console.log('--- Starting Pokémon move data update to Gen 1 standard ---');

  try {
    const localDataBuffer = await fs.readFile(POKEMON_DATA_PATH);
    const localPokemonData = JSON.parse(localDataBuffer.toString());

    for (let i = 0; i < 151; i++) {
      const pokemon = localPokemonData[i];
      if (!pokemon) continue;

      const pokemonId = pokemon.id;
      const pokemonName = pokemon.name;
      
      console.log(`Updating moves for ${pokemonName} (ID: ${pokemonId})...`);

      // 1. API로부터 포켓몬 데이터 가져오기
      const pokeApiResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
      const apiMoves = pokeApiResponse.data.moves;

      // 2. 1세대 '레벨업'으로 배우는 기술 필터링 및 정렬
      const gen1LevelUpMoves = apiMoves
        .map(moveData => {
          const gen1Detail = moveData.version_group_details.find(
            d => d.version_group.name === GEN_1_VERSION_GROUP && d.move_learn_method.name === 'level-up'
          );
          if (gen1Detail) {
            return {
              name: moveData.move.name,
              level: gen1Detail.level_learned_at
            };
          }
          return null;
        })
        .filter(move => move !== null)
        .sort((a, b) => b.level - a.level); // 레벨 높은 순으로 정렬

      // 3. 상위 4개 기술 선택 (중복 제거)
      const uniqueMoves = [...new Map(gen1LevelUpMoves.map(m => [m.name, m])).values()];
      const selectedMoveNames = uniqueMoves.slice(0, 4).map(m => m.name);
      
      // 만약 레벨업 기술이 4개 미만이면, TM 기술로 채움
      if (selectedMoveNames.length < 4) {
        const tmMoves = apiMoves
          .map(moveData => {
            const gen1Detail = moveData.version_group_details.find(
              d => d.version_group.name === GEN_1_VERSION_GROUP && d.move_learn_method.name === 'machine'
            );
            return gen1Detail ? moveData.move.name : null;
          })
          .filter(name => name && !selectedMoveNames.includes(name));
        
        selectedMoveNames.push(...tmMoves.slice(0, 4 - selectedMoveNames.length));
      }

      // 4. 선택된 기술들의 상세 정보 가져오기
      const newMoves = [];
      for (const moveName of selectedMoveNames) {
        const moveDetails = await getMoveDetails(moveName);
        if (moveDetails) {
          newMoves.push(moveDetails);
        }
        await new Promise(resolve => setTimeout(resolve, 50)); // API 부하 감소
      }

      // 5. 로컬 데이터 업데이트
      pokemon.moves = newMoves;
      
      console.log(` -> ${pokemonName} moves updated: [${newMoves.map(m => m.nameKo).join(', ')}]`);

      await new Promise(resolve => setTimeout(resolve, 100)); // API 부하 감소
    }

    // 6. 업데이트된 데이터 파일에 쓰기
    await fs.writeFile(POKEMON_DATA_PATH, JSON.stringify(localPokemonData, null, 2));

    console.log('\n--- Update Complete! pokemonData.json has been successfully updated. ---');

  } catch (error) {
    console.error('An error occurred during the update process:', error);
  }
}

// 스크립트 실행
updateAllPokemonMoves();
