import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateDailyChallenge } from '../../utils/challengeUtils';
import useBattleStore from '../../store/battleStore'; // Zustand 스토어 import
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
  const setBattleTeams = useBattleStore((state) => state.setBattleTeams); // 스토어 액션 가져오기

  const [rentalPokemon, setRentalPokemon] = useState([]);
  const [leaderData, setLeaderData] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState([]);

  useEffect(() => {
    const { rentalPokemon, leader, leaderPokemon } = generateDailyChallenge();

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
      // 스토어에 팀 데이터 저장
      setBattleTeams(selectedTeam, leaderData.pokemon, leaderData.name);
      // state 없이 배틀 페이지로 이동
      navigate('/battle');
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
