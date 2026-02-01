import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modules에서 __dirname을 대체하는 방법
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// pokemonData.json 파일 경로
const POKEMON_DATA_PATH = path.join(__dirname, '../src/assets/pokemonData.json');

// 1세대 버전 그룹
const GEN_1_VERSION_GROUPS = ['red-blue', 'yellow'];

/**
 * PokeAPI로부터 특정 포켓몬의 1세대 기술 목록을 가져옵니다.
 * @param {number} pokemonId 포켓몬 ID (1-151)
 * @returns {Promise<Set<string>>} 1세대에서 배울 수 있는 기술 이름(영문)의 Set
 */
async function getGen1MovesFromAPI(pokemonId) {
  try {
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    const apiMoves = response.data.moves;
    
    const gen1MoveSet = new Set();

    apiMoves.forEach(moveData => {
      const { move, version_group_details } = moveData;
      
      // 1세대 버전 그룹(red-blue, yellow)에 포함되는지 확인
      const isGen1Move = version_group_details.some(detail => 
        GEN_1_VERSION_GROUPS.includes(detail.version_group.name)
      );

      if (isGen1Move) {
        gen1MoveSet.add(move.name);
      }
    });

    return gen1MoveSet;
  } catch (error) {
    console.error(`Error fetching data for Pokémon ID ${pokemonId}:`, error.message);
    return new Set(); // 에러 발생 시 빈 Set 반환
  }
}

/**
 * pokemonData.json의 기술 목록과 API의 1세대 기술 목록을 비교하여 불일치 항목을 찾습니다.
 */
async function verifyAllPokemonMoves() {
  console.log('Starting Pokémon move verification for Gen 1...');

  try {
    // 로컬 데이터 읽기
    const localDataBuffer = await fs.readFile(POKEMON_DATA_PATH);
    const localPokemonData = JSON.parse(localDataBuffer.toString());

    const inconsistencies = [];

    // 1번부터 151번 포켓몬까지 순회
    for (let i = 0; i < 151; i++) {
      const pokemon = localPokemonData[i];
      if (!pokemon) continue;

      const pokemonId = pokemon.id;
      const pokemonName = pokemon.name;
      
      console.log(`Verifying ${pokemonName} (ID: ${pokemonId})...`);

      // API로부터 1세대 기술 목록 가져오기
      const apiGen1Moves = await getGen1MovesFromAPI(pokemonId);
      
      if (apiGen1Moves.size === 0) {
        console.log(`Could not fetch Gen 1 moves for ${pokemonName}. Skipping.`);
        continue;
      }

      // 로컬 데이터의 기술 목록과 비교
      pokemon.moves.forEach(localMove => {
        if (!apiGen1Moves.has(localMove.name)) {
          inconsistencies.push({
            pokemon: pokemonName,
            pokemonId: pokemonId,
            moveName: localMove.name,
            moveNameKo: localMove.nameKo,
            reason: 'Not a learnable move in Gen 1.'
          });
        }
      });
      
      // API 호출 사이에 약간의 딜레이를 주어 부하를 줄임
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 결과 출력
    if (inconsistencies.length > 0) {
      console.log('\n--- Verification Complete: Found Inconsistencies! ---');
      inconsistencies.forEach(item => {
        console.log(`- Pokémon: ${item.pokemon} (#${item.pokemonId}), Move: ${item.moveNameKo} (${item.moveName})`);
      });
      console.log(`\nTotal inconsistencies found: ${inconsistencies.length}`);
    } else {
      console.log('\n--- Verification Complete: No inconsistencies found! ---');
    }

  } catch (error) {
    console.error('An error occurred during the verification process:', error);
  }
}

// 스크립트 실행
verifyAllPokemonMoves();
