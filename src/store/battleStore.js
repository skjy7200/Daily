import { create } from 'zustand';

const useBattleStore = create((set) => ({
  userTeam: [],
  opponentTeam: [],
  leaderName: '',
  battleOutcome: null, // 'win', 'loss', or null
  
  setBattleTeams: (userTeam, opponentTeam, leaderName) => set({ 
    userTeam: userTeam,
    opponentTeam: opponentTeam,
    leaderName: leaderName,
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
