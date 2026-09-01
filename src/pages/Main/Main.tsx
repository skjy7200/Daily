// src/pages/Main.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateDailyChallenge, getCountdownToMidnightKST } from '../../utils/challengeUtils';
import { TYPE_COLORS_KO as typeColors } from '../../utils/constants';
import './Main.css';

function Main() {
  const navigate = useNavigate();
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [countdown, setCountdown] = useState(getCountdownToMidnightKST());

  useEffect(() => {
    setDailyChallenge(generateDailyChallenge());

    const timer = setInterval(() => {
      const newCountdown = getCountdownToMidnightKST();
      setCountdown(newCountdown);

      if (newCountdown.hours === 0 && newCountdown.minutes === 0 && newCountdown.seconds === 0) {
        setDailyChallenge(generateDailyChallenge());
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!dailyChallenge) {
    return <div className="main-container">오늘의 챌린지를 불러오는 중...</div>;
  }

  const { leader, leaderSprite, leaderPokemon } = dailyChallenge;

  return (
    <div className="main-container">
      <h1>Pokedaily Challenge</h1>
      <div className="countdown">
        다음 챌린지까지: {String(countdown.hours).padStart(2, '0')}:
        {String(countdown.minutes).padStart(2, '0')}:
        {String(countdown.seconds).padStart(2, '0')}
      </div>

      <div className="gym-leader-section">
        <div className="leader-info-header">
          <h2>오늘의 관장: {leader}</h2>
          <img src={leaderSprite} alt={leader} className="leader-sprite-main" />
        </div>
        <div className="leader-pokemon-list">
          {leaderPokemon.map((p, index) => (
            <div key={index} className="pokemon-card">
              <img src={p.image} alt={p.name} className="pokemon-image" />
              <h3>{p.name}</h3>
              <div className="pokemon-types">
                {p.types.map((type) => (
                  <span
                    key={type}
                    className="type-badge"
                    style={{ backgroundColor: typeColors[type] || '#777' }}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        className="challenge-button" 
        onClick={() => navigate('/select')}
      >
        도전하기!
      </button>
    </div>
  );
}

export default Main;