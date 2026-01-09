import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getTypeMultiplier } from '../../utils/typeUtils';
import './Battle.css';

function Battle() {
  const location = useLocation();
  const navigate = useNavigate();
  const { myTeam, opponentTeam, leaderName } = location.state || { myTeam: [], opponentTeam: [], leaderName: '' };

  const [myCurrentIdx, setMyCurrentIdx] = useState(0);
  const [oppCurrentIdx, setOppCurrentIdx] = useState(0);
  const [battleTeam, setBattleTeam] = useState(JSON.parse(JSON.stringify(myTeam)));
  const [battleOpponent, setBattleOpponent] = useState(JSON.parse(JSON.stringify(opponentTeam)));
  const [logs, setLogs] = useState([`체육관 관장 ${leaderName}이(가) 승부를 걸어왔다!`]);
  const [isProcessing, setIsProcessing] = useState(false);
  
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

  // 로그 내용에 따른 클래스 부여
  const getLogClass = (log) => {
    if (log.includes('효과가 굉장했다')) return 'log-super-effective';
    if (log.includes('효과가 별로')) return 'log-not-effective';
    if (log.includes('쓰러졌다')) return 'log-faint';
    if (log.includes('의 ')) return 'log-move-use'; // 기술 사용 로그
    return '';
  };

  const calculateDamage = (attacker, defender, move) => {
    const attackStat = move.damageClass === 'special' ? attacker.stats.spAttack : attacker.stats.attack;
    const defenseStat = move.damageClass === 'special' ? defender.stats.spDefense : defender.stats.defense;
    const baseDamage = Math.floor((( (2 * 50 / 5 + 2) * move.power * (attackStat / defenseStat) ) / 50) + 2);
    const multiplier = getTypeMultiplier(move.type, defender.types);
    const stab = attacker.types.some(t => {
      const TYPE_MAP_KO_TO_EN = {
        "노말": "normal", "불꽃": "fire", "물": "water", "풀": "grass", "전기": "electric",
        "얼음": "ice", "격투": "fighting", "독": "poison", "땅": "ground", "비행": "flying",
        "에스퍼": "psychic", "벌레": "bug", "바위": "rock", "고스트": "ghost", "드래곤": "dragon",
        "강철": "steel", "페어리": "fairy"
      };
      return TYPE_MAP_KO_TO_EN[t] === move.type;
    }) ? 1.5 : 1;
    const finalDamage = Math.floor(baseDamage * multiplier * stab * (0.85 + Math.random() * 0.15));
    return { damage: finalDamage, multiplier };
  };

  const handleMoveSelection = async (move) => {
    if (isProcessing || !myPokemon || !oppPokemon) return;
    setIsProcessing(true);
    const myFirst = myPokemon.stats.speed >= oppPokemon.stats.speed;
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
    setIsProcessing(false);
  };

  const executeTurn = async (attacker, defender, move, isPlayerAttacking) => {
    addLog(`${attacker.name}의 ${move.nameKo}!`);
    if (isPlayerAttacking) setMyAnim('attack-player');
    else setOppAnim('attack-opponent');
    await new Promise(resolve => setTimeout(resolve, 400));
    setMyAnim(''); setOppAnim('');

    const { damage, multiplier } = calculateDamage(attacker, defender, move);
    const newHp = Math.max(0, defender.currentHp - damage);
    if (isPlayerAttacking) {
      setBattleOpponent(prev => { const n = [...prev]; n[oppCurrentIdx].currentHp = newHp; return n; });
      setOppAnim('damage');
    } else {
      setBattleTeam(prev => { const n = [...prev]; n[myCurrentIdx].currentHp = newHp; return n; });
      setMyAnim('damage');
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    setMyAnim(''); setOppAnim('');

    if (multiplier > 1) addLog("효과가 굉장했다!");
    else if (multiplier > 0 && multiplier < 1) addLog("효과가 별로인 듯하다...");
    await new Promise(resolve => setTimeout(resolve, 500));

    if (newHp === 0) {
      if (isPlayerAttacking) setOppAnim('faint'); else setMyAnim('faint');
      addLog(`${defender.name}은(는) 쓰러졌다!`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  useEffect(() => {
    if (!myPokemon || !oppPokemon) return;
    if (oppPokemon.currentHp === 0) {
      if (oppCurrentIdx < battleOpponent.length - 1) setOppCurrentIdx(prev => prev + 1);
      else navigate('/result', { state: { win: true } });
    }
    if (myPokemon.currentHp === 0) {
      if (myCurrentIdx < battleTeam.length - 1) setMyCurrentIdx(prev => prev + 1);
      else navigate('/result', { state: { win: false } });
    }
  }, [battleOpponent, battleTeam]);

  if (!myTeam.length) return <div>잘못된 접근입니다.</div>;

  return (
    <div className="battle-container">
      <div className="battle-field">
        <div className="pokemon-area opponent">
          <div className="status-bar">
            <span className="name">{oppPokemon.name}</span>
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
          <img src={oppPokemon.image} alt={oppPokemon.name} className={`pokemon-sprite ${oppAnim ? `anim-${oppAnim}` : ''}`} />
        </div>
        <div className="pokemon-area player">
          <img src={myPokemon.image} alt={myPokemon.name} className={`pokemon-sprite ${myAnim ? `anim-${myAnim}` : ''}`} />
          <div className="status-bar">
            <span className="name">{myPokemon.name}</span>
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
        </div>
      </div>
      <div className="battle-ui">
        <div className="move-list">
          {myPokemon.moves.map((move) => (
            <button 
              key={move.name} 
              className="move-button" 
              onClick={() => handleMoveSelection(move)} 
              disabled={isProcessing}
              style={{ borderLeft: `8px solid ${typeColors[move.type] || '#ccc'}` }}
            >
              {move.nameKo}
              <span className="move-type" style={{ color: typeColors[move.type] }}>{move.type}</span>
            </button>
          ))}
        </div>
        <div className="battle-log">
          {logs.map((log, i) => (
            <p key={i} className={getLogClass(log)}>{log}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Battle;