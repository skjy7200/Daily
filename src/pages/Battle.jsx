import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getTypeMultiplier } from '../utils/typeUtils';
import '../App.css';

function Battle() {
  const location = useLocation();
  const navigate = useNavigate();
  const { myTeam, opponentTeam, leaderName } = location.state || { myTeam: [], opponentTeam: [], leaderName: '' };

  // 배틀 상태 관리
  const [myCurrentIdx, setMyCurrentIdx] = useState(0);
  const [oppCurrentIdx, setOppCurrentIdx] = useState(0);
  const [battleTeam, setBattleTeam] = useState(JSON.parse(JSON.stringify(myTeam))); // 깊은 복사
  const [battleOpponent, setBattleOpponent] = useState(JSON.parse(JSON.stringify(opponentTeam)));
  const [logs, setLogs] = useState([`체육관 관장 ${leaderName}이(가) 승부를 걸어왔다!`]);
  const [isProcessing, setIsProcessing] = useState(false);

  // 현재 활성 포켓몬
  const myPokemon = battleTeam[myCurrentIdx];
  const oppPokemon = battleOpponent[oppCurrentIdx];

  const addLog = (msg) => {
    setLogs(prev => [msg, ...prev].slice(0, 5)); // 최근 5개 로그만 유지
  };

  // 데미지 계산 함수
  const calculateDamage = (attacker, defender, move) => {
    const attackStat = move.damageClass === 'special' ? attacker.stats.spAttack : attacker.stats.attack;
    const defenseStat = move.damageClass === 'special' ? defender.stats.spDefense : defender.stats.defense;
    
    // 기본 공식: ((2 * 레벨(50) / 5 + 2) * 위력 * 공/방) / 50 + 2
    const baseDamage = Math.floor((( (2 * 50 / 5 + 2) * move.power * (attackStat / defenseStat) ) / 50) + 2);
    
    // 타입 상성 적용
    const multiplier = getTypeMultiplier(move.type, defender.types);
    
    // 자속 보정 (STAB)
    const stab = attacker.types.some(t => {
      const TYPE_MAP_KO_TO_EN = {
        "노말": "normal", "불꽃": "fire", "물": "water", "풀": "grass", "전기": "electric",
        "얼음": "ice", "격투": "fighting", "독": "poison", "땅": "ground", "비행": "flying",
        "에스퍼": "psychic", "벌레": "bug", "바위": "rock", "고스트": "ghost", "드래곤": "dragon",
        "강철": "steel", "페어리": "fairy"
      };
      return TYPE_MAP_KO_TO_EN[t] === move.type;
    }) ? 1.5 : 1;

    // 랜덤 편차 (0.85 ~ 1.0)
    const randomMultiplier = 0.85 + Math.random() * 0.15;
    
    const finalDamage = Math.floor(baseDamage * multiplier * stab * randomMultiplier);
    return { damage: finalDamage, multiplier };
  };

  const handleMoveSelection = async (move) => {
    if (isProcessing || !myPokemon || !oppPokemon) return;
    setIsProcessing(true);

    const myFirst = myPokemon.stats.speed >= oppPokemon.stats.speed;

    if (myFirst) {
      // 내가 선공
      await executeTurn(myPokemon, oppPokemon, move, true);
      if (oppPokemon.currentHp > 0) {
        // 적이 살아있으면 적 공격
        const oppMove = oppPokemon.moves[Math.floor(Math.random() * oppPokemon.moves.length)];
        await executeTurn(oppPokemon, myPokemon, oppMove, false);
      }
    } else {
      // 적이 선공
      const oppMove = oppPokemon.moves[Math.floor(Math.random() * oppPokemon.moves.length)];
      await executeTurn(oppPokemon, myPokemon, oppMove, false);
      if (myPokemon.currentHp > 0) {
        // 내가 살아있으면 공격
        await executeTurn(myPokemon, oppPokemon, move, true);
      }
    }

    setIsProcessing(false);
  };

  const executeTurn = async (attacker, defender, move, isPlayerAttacking) => {
    addLog(`${attacker.name}의 ${move.nameKo}!`);
    
    const { damage, multiplier } = calculateDamage(attacker, defender, move);
    const newHp = Math.max(0, defender.currentHp - damage);
    
    if (isPlayerAttacking) {
      setBattleOpponent(prev => {
        const next = [...prev];
        next[oppCurrentIdx].currentHp = newHp;
        return next;
      });
    } else {
      setBattleTeam(prev => {
        const next = [...prev];
        next[myCurrentIdx].currentHp = newHp;
        return next;
      });
    }

    // 상성 메시지 출력
    if (multiplier > 1) {
      addLog("효과가 굉장했다!");
    } else if (multiplier > 0 && multiplier < 1) {
      addLog("효과가 별로인 듯하다...");
    } else if (multiplier === 0) {
      addLog(`${defender.name}에게는 효과가 없는 듯하다...`);
    }

    // 딜레이 (효과 체감)
    await new Promise(resolve => setTimeout(resolve, 800));

    if (newHp === 0) {
      addLog(`${defender.name}은(는) 쓰러졌다!`);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  };

  // 기절 처리 및 교체 로직
  useEffect(() => {
    if (!myPokemon || !oppPokemon) return;

    if (oppPokemon.currentHp === 0) {
      if (oppCurrentIdx < battleOpponent.length - 1) {
        setOppCurrentIdx(prev => prev + 1);
        addLog(`관장 ${leaderName}은(는) ${battleOpponent[oppCurrentIdx+1].name}을(를) 내보냈다!`);
      } else {
        // 승리
        navigate('/result', { state: { win: true } });
      }
    }

    if (myPokemon.currentHp === 0) {
      if (myCurrentIdx < battleTeam.length - 1) {
        setMyCurrentIdx(prev => prev + 1);
        addLog(`가라! ${battleTeam[myCurrentIdx+1].name}!`);
      } else {
        // 패배
        navigate('/result', { state: { win: false } });
      }
    }
  }, [battleOpponent, battleTeam, myCurrentIdx, oppCurrentIdx]);

  if (!myTeam.length) return <div>잘못된 접근입니다.</div>;

  return (
    <div className="battle-container">
      <div className="battle-field">
        {/* 적 포켓몬 영역 */}
        <div className="pokemon-area opponent">
          <div className="status-bar">
            <span className="name">{oppPokemon.name}</span>
            <div className="hp-container">
              <div className="hp-bar" style={{ width: `${(oppPokemon.currentHp / oppPokemon.maxHp) * 100}%` }}></div>
            </div>
            <span className="hp-text">{oppPokemon.currentHp} / {oppPokemon.maxHp}</span>
          </div>
          <img src={oppPokemon.image} alt={oppPokemon.name} className="pokemon-sprite" />
        </div>

        {/* 내 포켓몬 영역 */}
        <div className="pokemon-area player">
          <img src={myPokemon.image} alt={myPokemon.name} className="pokemon-sprite" />
          <div className="status-bar">
            <span className="name">{myPokemon.name}</span>
            <div className="hp-container">
              <div className="hp-bar" style={{ width: `${(myPokemon.currentHp / myPokemon.maxHp) * 100}%` }}></div>
            </div>
            <span className="hp-text">{myPokemon.currentHp} / {myPokemon.maxHp}</span>
          </div>
        </div>
      </div>

      {/* 배틀 컨트롤 및 로그 */}
      <div className="battle-ui">
        <div className="move-list">
          {myPokemon.moves.map((move) => (
            <button 
              key={move.name} 
              className="move-button" 
              onClick={() => handleMoveSelection(move)}
              disabled={isProcessing}
            >
              {move.nameKo}
              <span className="move-type">{move.type}</span>
            </button>
          ))}
        </div>
        <div className="battle-log">
          {logs.map((log, i) => <p key={i}>{log}</p>)}
        </div>
      </div>
    </div>
  );
}

export default Battle;
