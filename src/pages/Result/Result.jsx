import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCountdownToMidnightKST } from '../../utils/challengeUtils';
import './Result.css';

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { win, leaderName } = location.state || { win: false, leaderName: '알 수 없는 관장' };
  const [countdown, setCountdown] = useState(getCountdownToMidnightKST());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownToMidnightKST());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleShare = () => {
    const now = new Date();
    const dateStr = `${now.getMonth() + 1}/${now.getDate()}`;
    const message = `[Pokedaily] ${dateStr} 챌린지 결과\nVS ${leaderName}\n\n${win ? '🏆 승리했습니다!' : '💀 패배했습니다...'}\n\n매일 새로운 체육관 관장에게 도전하세요!\nhttps://pokedaily.app`;
    
    navigator.clipboard.writeText(message).then(() => {
      alert('결과가 클립보드에 복사되었습니다!');
    }).catch(err => {
      console.error('복사 실패:', err);
    });
  };

  return (
    <div className="result-container">
      <div className={`result-card ${win ? 'win' : 'lose'}`}>
        <h1>{win ? '승리!' : '패배...'}</h1>
        <p className="result-message">
          {win 
            ? `축하합니다! ${leaderName}` 
            : `아쉽네요. ${leaderName}`}
        </p>
        
        {win && <div className="victory-icon">🏆</div>}
        {!win && <div className="defeat-icon">💀</div>}

        <div className="countdown-section">
          <p>다음 챌린지까지</p>
          <div className="timer">
            {String(countdown.hours).padStart(2, '0')}:
            {String(countdown.minutes).padStart(2, '0')}:
            {String(countdown.seconds).padStart(2, '0')}
          </div>
        </div>

        <div className="button-group" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            className="retry-button"
            onClick={() => navigate('/select')}
          >
            다시 도전하기
          </button>
          <button 
            className="share-button"
            onClick={handleShare}
            style={{ 
              backgroundColor: '#2ecc71', 
              color: 'white', 
              border: 'none', 
              padding: '15px 30px', 
              fontSize: '1.3em', 
              borderRadius: '50px',
              cursor: 'pointer',
              boxShadow: '0 5px 15px rgba(46, 204, 113, 0.4)'
            }}
          >
            결과 공유하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default Result;
