import React from 'react';
import PokemonCard from '../components/PokemonCard';
import './HomeView.css';

// Mock data for the gym leader's team
const mockLeaderTeam = [
  {
    "id": 25,
    "name": { "english": "Pikachu" },
    "type": ["Electric"],
    "image": { "thumbnail": "https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/images/pokedex/thumbnails/025.png" }
  },
  {
    "id": 6,
    "name": { "english": "Charizard" },
    "type": ["Fire", "Flying"],
    "image": { "thumbnail": "https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/images/pokedex/thumbnails/006.png" }
  },
  {
    "id": 9,
    "name": { "english": "Blastoise" },
    "type": ["Water"],
    "image": { "thumbnail": "https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/images/pokedex/thumbnails/009.png" }
  }
];


const HomeView = ({ onChallengeClick }) => {
  return (
    <div className="home-view">
      <h1>오늘의 챌린지</h1>
      <h2>오늘의 관장</h2>
      <div className="leader-team">
        {mockLeaderTeam.map(pokemon => (
          <PokemonCard key={pokemon.id} pokemon={pokemon} />
        ))}
      </div>
      <button className="challenge-button" onClick={onChallengeClick}>
        도전하기
      </button>
    </div>
  );
};

export default HomeView;
