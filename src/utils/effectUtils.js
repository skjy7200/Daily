// src/utils/effectUtils.js

export const applyMoveEffects = async (move, attacker, defender, setAttackerState, setDefenderState, addLog) => {
  if (!move.effect) return;

  if (move.effect.chance && Math.random() > move.effect.chance) {
    return;
  }

  // 1. 능력치 변화 효과 처리
  if (move.effect.stat_changes) {
    for (const sc of move.effect.stat_changes) {
      const isSelfEffect = move.category.includes('raise') || move.category.includes('net-good-stats');
      const setTargetState = isSelfEffect ? setAttackerState : setDefenderState;
      const targetId = isSelfEffect ? attacker.id : defender.id;

      setTargetState(prev => {
        const newState = [...prev];
        const pokeIndex = newState.findIndex(p => p.id === targetId);
        if (pokeIndex === -1) return newState;

        const updatedPokemon = { 
          ...newState[pokeIndex],
          statStages: { ...newState[pokeIndex].statStages }
        };
        const currentStage = updatedPokemon.statStages[sc.stat] || 0;
        const newStage = Math.max(-6, Math.min(6, currentStage + sc.change));

        const statNamesKo = {
            attack: '공격', defense: '방어', spAttack: '특수공격', 
            spDefense: '특수방어', speed: '스피드', accuracy: '명중률', evasion: '회피율'
        };
        const statNameKo = statNamesKo[sc.stat] || sc.stat;

        if (newStage === currentStage) {
            addLog(`${updatedPokemon.name}의 ${statNameKo}은(는) 더 이상 변하지 않는다!`);
            return newState;
        }

        updatedPokemon.statStages[sc.stat] = newStage;

        if (newStage > currentStage) {
          addLog(`${updatedPokemon.name}의 ${statNameKo}이(가) 올랐다!`);
        } else if (newStage < currentStage) {
          addLog(`${updatedPokemon.name}의 ${statNameKo}이(가) 떨어졌다!`);
        }
        
        newState[pokeIndex] = updatedPokemon;
        return newState;
      });
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // 2. 상태이상 효과 처리
  if (move.effect.condition) {
    setDefenderState(prev => {
      const newState = [...prev];
      const pokeIndex = newState.findIndex(p => p.id === defender.id);
      if (pokeIndex === -1) return newState;
      
      const target = newState[pokeIndex];
      
      if (target.status) return newState;

      if (move.effect.condition === 'poison' && (target.types.includes('독') || target.types.includes('강철'))) {
          return newState;
      }
      if (move.effect.condition === 'burn' && target.types.includes('불꽃')) {
          return newState;
      }

      const updatedPokemon = { ...target, status: move.effect.condition };
      if (move.effect.condition === 'sleep') {
        updatedPokemon.statusTurns = Math.floor(Math.random() * 3) + 1;
      }
      newState[pokeIndex] = updatedPokemon;
      addLog(`${target.name}은(는) ${move.effect.condition}에 걸렸다!`);
      return newState;
    });
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};
