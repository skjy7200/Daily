import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { calculateDamage, canAttack, processEndOfTurnStatus } from '../../utils/battleUtils';
import './Battle.css';

function Battle() {
  const location = useLocation();
  const navigate = useNavigate();
  const { myTeam, opponentTeam, leaderName } = location.state || { myTeam: [], opponentTeam: [], leaderName: '' };

  const [myCurrentIdx, setMyCurrentIdx] = useState(0);
  const [oppCurrentIdx, setOppCurrentIdx] = useState(0);
  const [battleTeam, setBattleTeam] = useState(myTeam.map(p => ({ ...p, currentHp: p.maxHp, status: null, statusTurns: 0 })));
  const [battleOpponent, setBattleOpponent] = useState(opponentTeam.map(p => ({ ...p, currentHp: p.maxHp, status: null, statusTurns: 0 })));
  const [logs, setLogs] = useState([`체육관 관장 ${leaderName}이(가) 승부를 걸어왔다!`]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hoveredMove, setHoveredMove] = useState(null);
  
  
  const [myAnim, setMyAnim] = useState('');
  const [oppAnim, setOppAnim] = useState('');

  const myPokemon = battleTeam[myCurrentIdx];
  const oppPokemon = battleOpponent[oppCurrentIdx];

  // 타입별 색상 정의
  const typeColors = {
    "normal": "#A8A77A", "fire": "#EE8130", "water": "#6390F0", "electric": "#F7D02C",
    "grass": "#7AC74C", "ice": "#96D9D6", "fighting": "#C22E28", "poison": "#A33EA1",
    "ground": "#E2BF65", "flying": "#A98FF3", "psychic": "#F95587", "bug": "#A6B91A",
    "rock": "#B6A136", "ghost": "#735797", "dragon": "#6F35FC", "steel": "#B7B7CE", "fairy": "#D685AD"
  };

  // HP 퍼센트에 따른 색상 반환
  const getHpColor = (current, max) => {
    const ratio = current / max;
    if (ratio > 0.5) return '#4cc42a'; // 초록
    if (ratio > 0.2) return '#f1c40f'; // 노랑
    return '#e74c3c'; // 빨강
  };

  const addLog = (msg) => {
    setLogs(prev => [msg, ...prev].slice(0, 5));
  };

  const processStatusEffects = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    processEndOfTurnStatus(myPokemon, setBattleTeam, addLog);
    await new Promise(resolve => setTimeout(resolve, 500));
    processEndOfTurnStatus(oppPokemon, setBattleOpponent, addLog);
    await new Promise(resolve => setTimeout(resolve, 500));
  };
  
  // 로그 내용에 따른 클래스 부여
  const getLogClass = (log) => {
    if (log.includes('효과가 굉장했다')) return 'log-super-effective';
    if (log.includes('효과가 별로')) return 'log-not-effective';
    if (log.includes('쓰러졌다')) return 'log-faint';
    if (log.includes('의 ')) return 'log-move-use'; // 기술 사용 로그
    return '';
  };

  const handleMoveSelection = async (move) => {
    if (isProcessing || !myPokemon || !oppPokemon) return;
    setIsProcessing(true);

    const mySpeed = myPokemon.status === 'paralysis' ? myPokemon.stats.speed / 2 : myPokemon.stats.speed;
    const oppSpeed = oppPokemon.status === 'paralysis' ? oppPokemon.stats.speed / 2 : oppPokemon.stats.speed;
    const myFirst = mySpeed >= oppSpeed;

    if (myFirst) {
      await executeTurn(myPokemon, oppPokemon, move, true);
      if (oppPokemon.currentHp > 0) {
        const oppMove = oppPokemon.moves[Math.floor(Math.random() * oppPokemon.moves.length)];
        await executeTurn(oppPokemon, myPokemon, oppMove, false);
      }
    } else {
      const oppMove = oppPokemon.moves[Math.floor(Math.random() * oppPokemon.moves.length)];
      await executeTurn(oppPokemon, myPokemon, oppMove, false);
      if (myPokemon.currentHp > 0) await executeTurn(myPokemon, oppPokemon, move, true);
    }
    
    // Process status effects after both turns
    if (myPokemon.currentHp > 0 || oppPokemon.currentHp > 0) {
      await processStatusEffects();
    }

    setIsProcessing(false);
  };

  const executeTurn = async (attacker, defender, move, isPlayerAttacking) => {
    
    const setAttackerState = isPlayerAttacking ? setBattleTeam : setBattleOpponent;
    const setDefenderState = isPlayerAttacking ? setBattleOpponent : setBattleTeam;
    const attackerIdx = isPlayerAttacking ? myCurrentIdx : oppCurrentIdx;

    let attackerCanAttack = true;
    setAttackerState(prev => {
        const n = [...prev];
        const currentAttacker = { ...n[attackerIdx] };
        attackerCanAttack = canAttack(currentAttacker, addLog);
        n[attackerIdx] = currentAttacker;
        return n;
    });

    if (!attackerCanAttack) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }

    addLog(`${attacker.name}의 ${move.nameKo}!`);
    if (isPlayerAttacking) setMyAnim('attack-player');
    else setOppAnim('attack-opponent');
    await new Promise(resolve => setTimeout(resolve, 400));
    setMyAnim(''); setOppAnim('');

    // 명중률 체크
    if (move.accuracy && Math.random() * 100 > move.accuracy) {
      addLog('그러나 기술은 빗나갔다!');
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }

    let updatedDefender;
    if (move.power > 0) {
      const { damage, multiplier } = calculateDamage(attacker, defender, move);
      const newHp = Math.max(0, defender.currentHp - damage);
      updatedDefender = { ...defender, currentHp: newHp };
      
      if (isPlayerAttacking) setOppAnim('damage'); else setMyAnim('damage');
      
      setDefenderState(prev => {
        const n = [...prev];
        const idx = n.findIndex(p => p.id === defender.id);
        n[idx] = updatedDefender;
        return n;
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      setMyAnim(''); setOppAnim('');

      if (multiplier > 1) addLog("효과가 굉장했다!");
      else if (multiplier > 0 && multiplier < 1) addLog("효과가 별로인 듯하다...");
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      updatedDefender = { ...defender };
    }


    // 상태이상 효과 적용
    if (move.effect && Math.random() < move.effect.chance) {
      if (updatedDefender.status !== move.effect.condition && updatedDefender.currentHp > 0) {
        
        let statusApplied = true;
        // 타입에 따른 면역 체크 (예: 독타입은 독/맹독에 걸리지 않음)
        if (move.effect.condition === 'poison' && (updatedDefender.types.includes('독') || updatedDefender.types.includes('강철'))) {
            statusApplied = false;
        }
        if (move.effect.condition === 'burn' && updatedDefender.types.includes('불꽃')) {
            statusApplied = false;
        }

        if(statusApplied) {
            updatedDefender.status = move.effect.condition;
            if (move.effect.condition === 'sleep') {
              updatedDefender.statusTurns = Math.floor(Math.random() * 3) + 1; // 1~3턴간 잠
            }
            addLog(`${updatedDefender.name}은(는) ${move.effect.condition}에 걸렸다!`);
        }
      }
    }
        
    setDefenderState(prev => {
        const n = [...prev];
        const idx = n.findIndex(p => p.id === updatedDefender.id);
        n[idx] = updatedDefender;
        return n;
    });

    if (updatedDefender.currentHp === 0) {
      if (isPlayerAttacking) setOppAnim('faint'); else setMyAnim('faint');
      addLog(`${updatedDefender.name}은(는) 쓰러졌다!`);
      updatedDefender.status = null;
      setDefenderState(prev => {
        const n = [...prev];
        const idx = n.findIndex(p => p.id === updatedDefender.id);
        n[idx] = updatedDefender;
        return n;
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };
  
  useEffect(() => {
    if (!myPokemon || !oppPokemon) return;
    const checkFainted = async () => {
      if (oppPokemon.currentHp === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (oppCurrentIdx < battleOpponent.length - 1) {
          setOppCurrentIdx(prev => prev + 1);
          addLog(`${leaderName}은(는) 다음 포켓몬을 내보냈다!`);
        }
        else navigate('/result', { state: { win: true, leaderName } });
      }
      if (myPokemon.currentHp === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (myCurrentIdx < battleTeam.length - 1) {
          setMyCurrentIdx(prev => prev + 1);
          addLog(`가라! ${battleTeam[myCurrentIdx+1].name}!`);
        }
        else navigate('/result', { state: { win: false, leaderName } });
      }
    }
    if(!isProcessing) checkFainted();
  }, [battleOpponent, battleTeam, myCurrentIdx, oppCurrentIdx, myPokemon, oppPokemon, navigate, isProcessing]);

  if (!myTeam.length) return <div>잘못된 접근입니다.</div>;
  if (!myPokemon || !oppPokemon) return <div>포켓몬 로딩 중...</div>

  return (
    <div className="battle-container">
      <div className="battle-field">
        {/* 상대 체력바 (HUD) */}
        <div className="status-bar opponent">
          <div className="status-info">
            <span className="name">{oppPokemon.name}</span>
            {oppPokemon.status && <span className={`status-text ${oppPokemon.status}`}>{oppPokemon.status.toUpperCase()}</span>}
            <span className="level">Lv.50</span>
          </div>
          <div className="hp-container">
            <div 
              className="hp-bar" 
              style={{ 
                width: `${(oppPokemon.currentHp / oppPokemon.maxHp) * 100}%`,
                backgroundColor: getHpColor(oppPokemon.currentHp, oppPokemon.maxHp)
              }}
            ></div>
          </div>
          <span className="hp-text">{oppPokemon.currentHp} / {oppPokemon.maxHp}</span>
        </div>

        <div className="pokemon-area opponent">
          <img src={oppPokemon.image} alt={oppPokemon.name} className={`pokemon-sprite ${oppAnim ? `anim-${oppAnim}` : ''}`} />
        </div>

        {/* 아군 체력바 (HUD) */}
        <div className="status-bar player">
          <div className="status-info">
            <span className="name">{myPokemon.name}</span>
            {myPokemon.status && <span className={`status-text ${myPokemon.status}`}>{myPokemon.status.toUpperCase()}</span>}
            <span className="level">Lv.50</span>
          </div>
          <div className="hp-container">
            <div 
              className="hp-bar" 
              style={{ 
                width: `${(myPokemon.currentHp / myPokemon.maxHp) * 100}%`,
                backgroundColor: getHpColor(myPokemon.currentHp, myPokemon.maxHp)
              }}
            ></div>
          </div>
          <span className="hp-text">{myPokemon.currentHp} / {myPokemon.maxHp}</span>
        </div>

        <div className="pokemon-area player">
          <img src={myPokemon.image_back || myPokemon.image} alt={myPokemon.name} className={`pokemon-sprite ${myAnim ? `anim-${myAnim}` : ''}`} />
        </div>
      </div>
      <div className="battle-ui">
        <div className="move-list">
          {myPokemon.moves.map((move) => (
            <button 
              key={move.name} 
              className="move-button" 
              onMouseEnter={() => setHoveredMove(move)}
              onMouseLeave={() => setHoveredMove(null)}
              onClick={() => handleMoveSelection(move)} 
              disabled={isProcessing || myPokemon.currentHp === 0}
              style={{ borderLeft: `8px solid ${typeColors[move.type] || '#ccc'}` }}
            >
              {move.nameKo}
              <span className="move-type" style={{ color: typeColors[move.type] }}>{move.type}</span>
            </button>
          ))}
        </div>
        <div className="battle-log">
          {hoveredMove ? (
            <div className="move-details">
              <h3>{hoveredMove.nameKo}</h3>
              <p>타입: <span style={{color: typeColors[hoveredMove.type]}}>{hoveredMove.type}</span></p>
              <p>위력: {hoveredMove.power || '—'}</p>
              <p>명중률: {hoveredMove.accuracy || '—'}</p>
              <p>분류: {hoveredMove.damageClass === 'physical' ? '물리' : '특수'}</p>
            </div>
          ) : (
            logs.map((log, i) => (
              <p key={i} className={getLogClass(log)}>{log}</p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Battle;