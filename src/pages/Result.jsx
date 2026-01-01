import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../App.css';

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { win } = location.state || { win: false };

  return (
    <div className="result-container">
      <div className={`result-card ${win ? 'win' : 'lose'}`}>
        <h1>{win ? '승리!' : '패배...'}</h1>
        <p className="result-message">
          {win 
            ? '축하합니다! 체육관 관장을 이겼습니다!' 
            : '아쉽네요. 다음엔 이길 수 있을 거예요!'}
        </p>
        
        {win && <div className="victory-icon">🏆</div>}
        {!win && <div className="defeat-icon">💀</div>}

        <button 
          className="retry-button"
          onClick={() => navigate('/select')}
        >
          다시 도전하기
        </button>
      </div>
    </div>
  );
}

export default Result;
