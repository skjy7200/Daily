// src/pages/Main.jsx
import React, { useState, useEffect } from 'react';
import { generateDailyChallenge, getCountdownToMidnightKST } from '../utils/challengeUtils';
import '../App.css'; 

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

function Main() {
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [countdown, setCountdown] = useState(getCountdownToMidnightKST());

  useEffect(() => {
    // 컴포넌트 마운트 시 일일 챌린지 생성
    setDailyChallenge(generateDailyChallenge());

    // 카운트다운 타이머 설정
    const timer = setInterval(() => {
      const newCountdown = getCountdownToMidnightKST();
      setCountdown(newCountdown);

      // 카운트다운이 0에 도달하면 새 날짜에 대한 챌린지 새로고침
      if (newCountdown.hours === 0 && newCountdown.minutes === 0 && newCountdown.seconds === 0) {
        setDailyChallenge(generateDailyChallenge());
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!dailyChallenge) {
    return <div className="main-container">오늘의 챌린지를 불러오는 중...</div>;
  }

  const { leader, pokemon } = dailyChallenge;

  return (
    <div className="main-container">
      <h1>Pokedaily Challenge</h1>
      <div className="countdown">
        다음 챌린지까지: {String(countdown.hours).padStart(2, '0')}:
        {String(countdown.minutes).padStart(2, '0')}:
        {String(countdown.seconds).padStart(2, '0')}
      </div>

      <div className="gym-leader-section">
        <h2>오늘의 관장: {leader}</h2>
        <div className="leader-pokemon-list">
          {pokemon.map((p, index) => (
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

      <button className="challenge-button">도전하기!</button>
    </div>
  );
}

export default Main;