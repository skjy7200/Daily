import { create } from 'zustand';

const useBattleStore = create((set) => ({
  userTeam: [],
  opponentTeam: [],
  leaderName: '',
  leaderSprite: '',
  battleOutcome: null, // 'win', 'loss', or null
  
  setBattleTeams: (userTeam, opponentTeam, leaderName, leaderSprite) => set({ 
    userTeam: userTeam,
    opponentTeam: opponentTeam,
    leaderName: leaderName,
    leaderSprite: leaderSprite,
    battleOutcome: null, // Reset outcome when a new battle starts
  }),

  setBattleOutcome: (outcome) => set({ battleOutcome: outcome }),

  reset: () => set({
    userTeam: [],
    opponentTeam: [],
    leaderName: '',
    battleOutcome: null,
  }),
}));

export default useBattleStore;
