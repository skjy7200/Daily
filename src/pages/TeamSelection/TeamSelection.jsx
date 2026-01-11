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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      const { rentalPokemon, leader, leaderPokemon } = generateDailyChallenge();
      
      // 1. 렌탈 포켓몬 데이터 보강 (기술 한글명, 종족값)
      const enrichedRental = await Promise.all(rentalPokemon.map(async (p) => {
        const moves = await fetchMoveDetailsForPokemon(p.moves);
        const stats = await getPokemonStats(p.id);
        return { ...p, moves, stats, maxHp: stats.hp, currentHp: stats.hp }; // maxHp, currentHp 초기화
      }));

      // 2. 관장 포켓몬 데이터 보강
      const enrichedLeaderPokemon = await Promise.all(leaderPokemon.map(async (p) => {
        const moves = await fetchMoveDetailsForPokemon(p.moves);
        const stats = await getPokemonStats(p.id);
        return { ...p, moves, stats, maxHp: stats.hp, currentHp: stats.hp };
      }));
      
      setRentalPokemon(enrichedRental);
      setLeaderData({ name: leader, pokemon: enrichedLeaderPokemon });
      setLoading(false);
    };

    initData();
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

  if (loading) {
    return <div className="selection-container"><h2>포켓몬 데이터를 불러오는 중입니다...</h2></div>;
  }

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
