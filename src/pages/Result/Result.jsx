import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useBattleStore from '../../store/battleStore';
import { getCountdownToMidnightKST } from '../../utils/challengeUtils';
import './Result.css';

function Result() {
  const navigate = useNavigate();
  const { battleOutcome, leaderName, reset: resetBattleState } = useBattleStore();
  const win = battleOutcome === 'win';

  const [countdown, setCountdown] = useState(getCountdownToMidnightKST());

  useEffect(() => {
    // battleOutcome이 없으면, 비정상적인 접근으로 간주하고 메인으로 보냄
    if (battleOutcome === null) {
      navigate('/');
      return;
    }

    const timer = setInterval(() => {
      setCountdown(getCountdownToMidnightKST());
    }, 1000);
    return () => clearInterval(timer);
  }, [battleOutcome, navigate]);

  const handleShare = () => {
    const now = new Date();
    const dateStr = `${now.getMonth() + 1}/${now.getDate()}`;
    const effectiveLeaderName = leaderName || '오늘의 관장';
    const message = `[Pokedaily] ${dateStr} 챌린지 결과\nVS ${effectiveLeaderName}\n\n${win ? '🏆 승리했습니다!' : '💀 패배했습니다...'}\n\n매일 새로운 체육관 관장에게 도전하세요!\nhttps://pokedaily.app`;
    
    navigator.clipboard.writeText(message).then(() => {
      alert('결과가 클립보드에 복사되었습니다!');
    }).catch(err => {
      console.error('복사 실패:', err);
    });
  };
  
  const handleRetry = () => {
    resetBattleState();
    navigate('/select');
  };

  // battleOutcome이 아직 설정되지 않았을 때 렌더링을 방지
  if (battleOutcome === null) {
    return null; // 또는 로딩 스피너
  }

  return (
    <div className="result-container">
      <div className={`result-card ${win ? 'win' : 'lose'}`}>
        <h1>{win ? '승리!' : '패배...'}</h1>
        <p className="result-message">
          {win 
            ? `축하합니다! ${leaderName}` 
            : `아쉽네요. ${leaderName}`}
        </p>
        
        {win && (
          <div className="badge-container">
            <img 
              src={`/badges/${leaderName}.png`} 
              alt={`${leaderName} 배지`} 
              className="badge-image" 
              onError={(e) => {
                e.target.style.display = 'none'; // 이미지가 없으면 숨김
              }}
            />
            <p className="badge-message">{`${leaderName} 배지를 획득했다!`}</p>
          </div>
        )}
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
            onClick={handleRetry}
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
