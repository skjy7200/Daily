import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMoveDetailsForPokemon, getPokemonStats } from '../../api/pokeApi';
import { generateDailyChallenge } from '../../utils/challengeUtils';
import './TeamSelection.css';

const typeColors = {
  "노말": "#A8A77A",
  "불꽃": "#EE8130",
  "물": "#6390F0",
  "전기": "#F7D02C",
  "풀": "#7AC74C",
  "얼음": "#96D9D6",
  "격투": "#C22E28",
  "독": "#A33EA1",
  "땅": "#E2BF65",
  "비행": "#A98FF3",
  "에스퍼": "#F95587",
  "벌레": "#A6B91A",
  "바위": "#B6A136",
  "고스트": "#735797",
  "드래곤": "#6F35FC",
  "강철": "#B7B7CE",
  "페어리": "#D685AD",
};

function TeamSelection() {
  const navigate = useNavigate();
  const [rentalPokemon, setRentalPokemon] = useState([]);
  const [leaderData, setLeaderData] = useState(null); // 관장 정보 + 포켓몬 데이터
  const [selectedTeam, setSelectedTeam] = useState([]);

  useEffect(() => {
    // pokemonData.json이 이미 완성되어 있으므로 추가 fetch 불필요
    const { rentalPokemon, leader, leaderPokemon } = generateDailyChallenge();
    
    // 초기 HP 설정 (데이터에 maxHp가 있다면 그것을 사용, 없다면 stats.hp 기반 계산)
    // 하지만 fetchData.js에서 이미 maxHp를 넣어두었음.
    // 안전을 위해 stats.hp를 기반으로 실능(Lv.50) 계산 로직이 필요하다면 여기서 처리하거나
    // fetchData.js가 이미 실능을 저장했는지 확인해야 함.
    // fetchData.js는 base_stat을 저장했으므로, 실능 변환 로직이 필요함.

    const calculateStats = (baseStats) => {
      const level = 50;
      const iv = 31;
      const ev = 0;
      return {
        hp: Math.floor((baseStats.hp * 2 + iv + Math.floor(ev / 4)) * level / 100) + level + 10,
        attack: Math.floor((baseStats.attack * 2 + iv + Math.floor(ev / 4)) * level / 100) + 5,
        defense: Math.floor((baseStats.defense * 2 + iv + Math.floor(ev / 4)) * level / 100) + 5,
        spAttack: Math.floor((baseStats.spAttack * 2 + iv + Math.floor(ev / 4)) * level / 100) + 5,
        spDefense: Math.floor((baseStats.spDefense * 2 + iv + Math.floor(ev / 4)) * level / 100) + 5,
        speed: Math.floor((baseStats.speed * 2 + iv + Math.floor(ev / 4)) * level / 100) + 5,
      };
    };

    const processPokemon = (list) => list.map(p => {
      const realStats = calculateStats(p.stats);
      return {
        ...p,
        stats: realStats,
        maxHp: realStats.hp,
        currentHp: realStats.hp
      };
    });

    setRentalPokemon(processPokemon(rentalPokemon));
    setLeaderData({ name: leader, pokemon: processPokemon(leaderPokemon) });
  }, []);

  const toggleSelect = (pokemon) => {
    if (selectedTeam.find(p => p.id === pokemon.id)) {
      setSelectedTeam(selectedTeam.filter(p => p.id !== pokemon.id));
    } else {
      if (selectedTeam.length < 3) {
        setSelectedTeam([...selectedTeam, pokemon]);
      }
    }
  };

  const startBattle = () => {
    if (selectedTeam.length === 3 && leaderData) {
      navigate('/battle', { state: { 
        myTeam: selectedTeam, 
        opponentTeam: leaderData.pokemon,
        leaderName: leaderData.name
      }});
    }
  };

  return (
    <div className="selection-container">
      <h1>팀을 구성하세요 (3마리 선택)</h1>
      <p>선택된 포켓몬: {selectedTeam.length} / 3</p>
      
      <div className="rental-list">
        {rentalPokemon.map((p) => {
          const isSelected = selectedTeam.find(sp => sp.id === p.id);
          return (
            <div 
              key={p.id} 
              className={`pokemon-card ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleSelect(p)}
              style={{ border: isSelected ? '3px solid #ffcb05' : '1px solid #ccc', cursor: 'pointer' }}
            >
              <img src={p.image} alt={p.name} className="pokemon-image" />
              <h3>{p.name}</h3>
              <div className="pokemon-types">
                {p.types.map(type => (
                  <span key={type} className="type-badge" style={{ backgroundColor: typeColors[type] }}>
                    {type}
                  </span>
                ))}
              </div>
              <div className="pokemon-moves">
                {p.moves.map(m => <span key={m.name} style={{display:'block'}}>{m.nameKo}</span>)}
              </div>
            </div>
          );
        })}
      </div>

      <button 
        className="start-battle-button" 
        disabled={selectedTeam.length !== 3}
        onClick={startBattle}
        style={{ marginTop: '20px', padding: '10px 20px', fontSize: '1.2rem' }}
      >
        배틀 시작!
      </button>
    </div>
  );
}

export default TeamSelection;
