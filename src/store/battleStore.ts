import { create } from 'zustand';

interface Pokemon {
  // Add necessary fields for Pokemon here
  id: string;
  name: string;
  // ...
}

interface BattleState {
  userTeam: Pokemon[];
  opponentTeam: Pokemon[];
  leaderName: string;
  leaderSprite: string;
  battleOutcome: 'win' | 'loss' | null;
  
  setBattleTeams: (userTeam: Pokemon[], opponentTeam: Pokemon[], leaderName: string, leaderSprite: string) => void;
  setBattleOutcome: (outcome: 'win' | 'loss' | null) => void;
  reset: () => void;
}

const useBattleStore = create<BattleState>((set) => ({
  userTeam: [],
  opponentTeam: [],
  leaderName: '',
  leaderSprite: '',
  battleOutcome: null,
  
  setBattleTeams: (userTeam, opponentTeam, leaderName, leaderSprite) => set({ 
    userTeam,
    opponentTeam,
    leaderName,
    leaderSprite,
    battleOutcome: null,
  }),

  setBattleOutcome: (outcome) => set({ battleOutcome: outcome }),

  reset: () => set({
    userTeam: [],
    opponentTeam: [],
    leaderName: '',
    leaderSprite: '',
    battleOutcome: null,
  }),
}));

export default useBattleStore;
