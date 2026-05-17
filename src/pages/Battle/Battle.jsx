import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useBattleStore from '../../store/battleStore';
import { calculateDamage, canAttack, processEndOfTurnStatus, applyMoveEffects, checkHit } from '../../utils/battleUtils';
import './Battle.css';

function Battle() {
  const navigate = useNavigate();
  const { userTeam, opponentTeam, leaderName, leaderSprite, setBattleOutcome } = useBattleStore();

  const [myCurrentIdx, setMyCurrentIdx] = useState(0);
  const [oppCurrentIdx, setOppCurrentIdx] = useState(0);
  const [battleTeam, setBattleTeam] = useState([]);
  const [battleOpponent, setBattleOpponent] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isIntro, setIsIntro] = useState(true); // 관장 등장 인트로 상태
  const [hoveredMove, setHoveredMove] = useState(null);
  const [screenShake, setScreenShake] = useState(false);
  const [battleMode, setBattleMode] = useState('main'); // 'main', 'attack', 'switch'

  const [myAnim, setMyAnim] = useState('');
  const [oppAnim, setOppAnim] = useState('');
  const [superEffectivePop, setSuperEffectivePop] = useState(null); // 'player' or 'opponent'
  const [notEffectivePop, setNotEffectivePop] = useState(null); // 'player' or 'opponent'

  const battleTeamRef = useRef([]);
  const battleOpponentRef = useRef([]);
  const myCurrentIdxRef = useRef(0);
  const oppCurrentIdxRef = useRef(0);

  useEffect(() => {
    battleTeamRef.current = battleTeam;
  }, [battleTeam]);

  useEffect(() => {
    battleOpponentRef.current = battleOpponent;
  }, [battleOpponent]);

  useEffect(() => {
    myCurrentIdxRef.current = myCurrentIdx;
  }, [myCurrentIdx]);

  useEffect(() => {
    oppCurrentIdxRef.current = oppCurrentIdx;
  }, [oppCurrentIdx]);

  // 스토어 데이터로 컴포넌트 내부 상태 초기화
  useEffect(() => {
    if (!userTeam || userTeam.length === 0) {
      navigate('/');
      return;
    }

    const initialMyTeam = userTeam.map(p => ({ ...p, currentHp: p.maxHp, status: null, statusTurns: 0, statStages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, accuracy: 0, evasion: 0 } }));
    const initialOppTeam = opponentTeam.map(p => ({ ...p, currentHp: p.maxHp, status: null, statusTurns: 0, statStages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, accuracy: 0, evasion: 0 } }));

    setBattleTeam(initialMyTeam);
    setBattleOpponent(initialOppTeam);
    setLogs([`체육관 관장 ${leaderName}이(가) 승부를 걸어왔다!`]);

    const introTimer = setTimeout(() => {
      setIsIntro(false);
      addLog(`${leaderName}은(는) ${opponentTeam[0].name}을(를) 내보냈다!`);
    }, 2500);

    return () => clearTimeout(introTimer);
  }, [userTeam, opponentTeam, leaderName, navigate]);


  const myPokemon = battleTeam[myCurrentIdx];
  const oppPokemon = battleOpponent[oppCurrentIdx];

  const typeColors = {
    "normal": "#A8A77A", "fire": "#EE8130", "water": "#6390F0", "electric": "#F7D02C",
    "grass": "#7AC74C", "ice": "#96D9D6", "fighting": "#C22E28", "poison": "#A33EA1",
    "ground": "#E2BF65", "flying": "#A98FF3", "psychic": "#F95587", "bug": "#A6B91A",
    "rock": "#B6A136", "ghost": "#735797", "dragon": "#6F35FC", "steel": "#B7B7CE", "fairy": "#D685AD"
  };

  const typeMap = {
    "normal": "노말", "fire": "불꽃", "water": "물", "electric": "전기",
    "grass": "풀", "ice": "얼음", "fighting": "격투", "poison": "독",
    "ground": "땅", "flying": "비행", "psychic": "에스퍼", "bug": "벌레",
    "rock": "바위", "ghost": "고스트", "dragon": "드래곤", "steel": "강철", "fairy": "페어리"
  };

  const getHpColor = (current, max) => {
    const ratio = current / max;
    if (ratio > 0.5) return '#4cc42a';
    if (ratio > 0.2) return '#f1c40f';
    return '#e74c3c';
  };

  const addLog = (msg) => {
    setLogs(prev => [msg, ...prev].slice(0, 10));
  };

  const processStatusEffects = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const currentMyPokemon = battleTeamRef.current[myCurrentIdxRef.current];
    const currentOppPokemon = battleOpponentRef.current[oppCurrentIdxRef.current];
    
    processEndOfTurnStatus(currentMyPokemon, setBattleTeam, addLog);
    await new Promise(resolve => setTimeout(resolve, 500));
    processEndOfTurnStatus(currentOppPokemon, setBattleOpponent, addLog);
    await new Promise(resolve => setTimeout(resolve, 500));
  };
  
  const getLogClass = (log) => {
    if (log.includes('효과가 굉장했다')) return 'log-super-effective';
    if (log.includes('효과가 별로')) return 'log-not-effective';
    if (log.includes('쓰러졌다')) return 'log-faint';
    if (log.includes('의 ')) return 'log-move-use';
    return '';
  };

  const handleMoveSelection = async (move) => {
    if (isProcessing || isIntro || !myPokemon || !oppPokemon) return;
    setIsProcessing(true);
    setBattleMode('main');

    const mySpeed = myPokemon.status === 'paralysis' ? myPokemon.stats.speed / 2 : myPokemon.stats.speed;
    const oppSpeed = oppPokemon.status === 'paralysis' ? oppPokemon.stats.speed / 2 : oppPokemon.stats.speed;
    const myFirst = mySpeed >= oppSpeed;

    if (myFirst) {
      const oppHp = await executeTurn(move, true);
      if (oppHp > 0) {
        const currentOppPokemon = battleOpponentRef.current[oppCurrentIdxRef.current];
        const oppMove = currentOppPokemon.moves[Math.floor(Math.random() * currentOppPokemon.moves.length)];
        await executeTurn(oppMove, false);
      }
    } else {
      const currentOppPokemon = battleOpponentRef.current[oppCurrentIdxRef.current];
      const oppMove = currentOppPokemon.moves[Math.floor(Math.random() * currentOppPokemon.moves.length)];
      const myHp = await executeTurn(oppMove, false);
      if (myHp > 0) {
        await executeTurn(move, true);
      }
    }
    
    await processStatusEffects();
    setIsProcessing(false);
  };

  const handleSwitch = async (newIdx) => {
    if (isProcessing || isIntro || newIdx === myCurrentIdx || battleTeam[newIdx].currentHp <= 0) return;
    setIsProcessing(true);
    setBattleMode('main');

    addLog(`돌아와, ${myPokemon.name}!`);
    setMyAnim('faint');
    await new Promise(resolve => setTimeout(resolve, 800));
    setMyAnim('');
    
    setMyCurrentIdx(newIdx);
    const newPokemon = battleTeam[newIdx];
    addLog(`가라! ${newPokemon.name}!`);
    await new Promise(resolve => setTimeout(resolve, 800));

    // 상대방의 공격
    const currentOppPokemon = battleOpponentRef.current[oppCurrentIdxRef.current];
    const oppMove = currentOppPokemon.moves[Math.floor(Math.random() * currentOppPokemon.moves.length)];
    await executeTurn(oppMove, false);

    await processStatusEffects();
    setIsProcessing(false);
  };

  const executeTurn = async (move, isPlayerAttacking) => {
    const attacker = isPlayerAttacking ? battleTeamRef.current[myCurrentIdxRef.current] : battleOpponentRef.current[oppCurrentIdxRef.current];
    const defender = isPlayerAttacking ? battleOpponentRef.current[oppCurrentIdxRef.current] : battleTeamRef.current[myCurrentIdxRef.current];

    const setAttackerState = isPlayerAttacking ? setBattleTeam : setBattleOpponent;
    const setDefenderState = isPlayerAttacking ? setBattleOpponent : setBattleTeam;
    const attackerIdx = isPlayerAttacking ? myCurrentIdxRef.current : oppCurrentIdxRef.current;

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
      return isPlayerAttacking ? battleOpponentRef.current[oppCurrentIdxRef.current].currentHp : battleTeamRef.current[myCurrentIdxRef.current].currentHp;
    }

    addLog(`${attacker.name}의 ${move.nameKo}!`);
    if (isPlayerAttacking) setMyAnim('attack-player');
    else setOppAnim('attack-opponent');
    await new Promise(resolve => setTimeout(resolve, 400));
    setMyAnim(''); setOppAnim('');

    if (!checkHit(attacker, defender, move)) {
      addLog(`${defender.name}은(는) 공격을 피했다!`);
      await new Promise(resolve => setTimeout(resolve, 500));
      return defender.currentHp;
    }

    let updatedDefender;
    if (move.power > 0) {
      const { damage, multiplier } = calculateDamage(attacker, defender, move);
      const newHp = Math.max(0, defender.currentHp - damage);
      updatedDefender = { ...defender, currentHp: newHp };
      
      if (isPlayerAttacking) setOppAnim('damage'); else setMyAnim('damage');
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 500);
      
      setDefenderState(prev => {
        const n = [...prev];
        const idx = n.findIndex(p => p.id === defender.id);
        n[idx] = updatedDefender;
        return n;
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      setMyAnim(''); setOppAnim('');

      if (multiplier > 1) {
        addLog("효과가 굉장했다!");
        if (isPlayerAttacking) setSuperEffectivePop('opponent'); else setSuperEffectivePop('player');
        setTimeout(() => { setSuperEffectivePop(null); setNotEffectivePop(null); }, 1000);
      } else if (multiplier > 0 && multiplier < 1) {
        addLog("효과가 별로인 듯하다...");
        if (isPlayerAttacking) setNotEffectivePop('opponent'); else setNotEffectivePop('player');
        setTimeout(() => { setSuperEffectivePop(null); setNotEffectivePop(null); }, 1000);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      updatedDefender = { ...defender };
    }

    await applyMoveEffects(move, attacker, updatedDefender, setAttackerState, setDefenderState, addLog);

    if (updatedDefender.currentHp === 0) {
      if (isPlayerAttacking) setOppAnim('faint'); else setMyAnim('faint');
      addLog(`${updatedDefender.name}은(는) 쓰러졌다!`);
      
      setDefenderState(prev => {
        const n = [...prev];
        const idx = n.findIndex(p => p.id === updatedDefender.id);
        if (idx !== -1) {
          n[idx] = { ...n[idx], status: null };
        }
        return n;
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return updatedDefender.currentHp;
  };
  
  useEffect(() => {
    if (!myPokemon || !oppPokemon) return;
    const checkFainted = async () => {
      if (oppPokemon.currentHp === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (oppCurrentIdx < battleOpponent.length - 1) {
          setOppCurrentIdx(prev => prev + 1);
          addLog(`${leaderName}은(는) 다음 포켓몬을 내보냈다!`);
        } else {
          setBattleOutcome('win');
          navigate('/result');
        }
      }
      if (myPokemon.currentHp === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const nextIdx = battleTeam.findIndex((p, idx) => idx > myCurrentIdx && p.currentHp > 0);
        if (nextIdx !== -1) {
          setMyCurrentIdx(nextIdx);
          addLog(`가라! ${battleTeam[nextIdx].name}!`);
        } else {
          setBattleOutcome('loss');
          navigate('/result');
        }
      }
    }
    if(!isProcessing) checkFainted();
  }, [battleOpponent, battleTeam, myCurrentIdx, oppCurrentIdx, myPokemon, oppPokemon, navigate, isProcessing, leaderName, setBattleOutcome]);

  if (!userTeam.length || !myPokemon || !oppPokemon) return <div>데이터를 불러오는 중...</div>;

  return (
    <div className="battle-container">
      <div className={`battle-field ${screenShake ? 'screen-shake' : ''}`}>
        {/* 상대 체력바 (HUD) */}
        <div className={`status-bar opponent ${isIntro ? 'hidden' : ''}`}>
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
          {isIntro ? (
            <img 
              src={leaderSprite} 
              alt={leaderName} 
              className="trainer-sprite-battle anim-trainer-enter" 
            />
          ) : (
            <img 
              src={oppPokemon.image} 
              alt={oppPokemon.name} 
              className={`pokemon-sprite ${oppAnim ? `anim-${oppAnim}` : ''} anim-pokemon-appear`} 
            />
          )}
        </div>

        {superEffectivePop === 'opponent' && <div className="super-effective-popup popup-opponent">효과가 굉장했다!</div>}
        {notEffectivePop === 'opponent' && <div className="not-effective-popup popup-opponent">효과가 별로인 듯하다...</div>}

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

        {superEffectivePop === 'player' && <div className="super-effective-popup popup-player">효과가 굉장했다!</div>}
        {notEffectivePop === 'player' && <div className="not-effective-popup popup-player">효과가 별로인 듯하다...</div>}
      </div>
      <div className="battle-ui">
        <div className="battle-controls">
          {battleMode === 'main' && (
            <div className="main-actions">
              <button 
                className="action-button attack" 
                onClick={() => setBattleMode('attack')}
                disabled={isProcessing}
              >
                공격하기
              </button>
              <button 
                className="action-button switch" 
                onClick={() => setBattleMode('switch')}
                disabled={isProcessing}
              >
                교체하기
              </button>
            </div>
          )}

          {battleMode === 'attack' && (
            <div className="move-list-container">
              <div className="move-list">
                {myPokemon.moves.map((move) => (
                  <button
                    key={move.name}
                    className="move-button"
                    onMouseEnter={() => setHoveredMove(move)}
                    onMouseLeave={() => setHoveredMove(null)}
                    onClick={() => handleMoveSelection(move)}
                    disabled={isProcessing || myPokemon.currentHp === 0}
                    style={{ borderLeft: `10px solid ${typeColors[move.type] || '#ccc'}` }}
                  >
                    <span>{move.nameKo}</span>
                    <span 
                      className="move-type-badge" 
                      style={{ 
                        backgroundColor: typeColors[move.type],
                        fontSize: '0.7rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        color: 'white',
                        textShadow: '1px 1px 1px rgba(0,0,0,0.3)'
                      }}
                    >
                      {typeMap[move.type]}
                    </span>
                  </button>
                ))}
              </div>
              <button className="back-button" onClick={() => setBattleMode('main')}>뒤로가기</button>
            </div>
          )}

          {battleMode === 'switch' && (
            <div className="team-switch-container">
              <div className="switch-list">
                {battleTeam.map((p, idx) => (
                  <button
                    key={idx}
                    className={`switch-button ${idx === myCurrentIdx ? 'active' : ''} ${p.currentHp === 0 ? 'fainted' : ''}`}
                    onClick={() => handleSwitch(idx)}
                    disabled={isProcessing || idx === myCurrentIdx || p.currentHp === 0}
                  >
                    <img src={p.image} alt={p.name} />
                    <div className="switch-info">
                      <span className="name">{p.name}</span>
                      <div className="mini-hp-bar">
                        <div 
                          className="inner" 
                          style={{ 
                            width: `${(p.currentHp / p.maxHp) * 100}%`,
                            backgroundColor: getHpColor(p.currentHp, p.maxHp)
                          }}
                        ></div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button className="back-button" onClick={() => setBattleMode('main')}>뒤로가기</button>
            </div>
          )}
        </div>
        
        <div className="battle-log">
          {hoveredMove && battleMode === 'attack' ? (
            <div className="move-details">
              <h3>{hoveredMove.nameKo}</h3>
              <p>타입: <span style={{color: typeColors[hoveredMove.type]}}>{typeMap[hoveredMove.type]}</span></p>
              <p>위력: {hoveredMove.power || '—'}</p>
              <p>명중률: {hoveredMove.accuracy || '—'}</p>
              <p>분류: {hoveredMove.damageClass === 'physical' ? '물리' : '특수'}</p>
            </div>
          ) : (            logs.map((log, i) => (
              <p key={i} className={getLogClass(log)}>{log}</p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Battle;