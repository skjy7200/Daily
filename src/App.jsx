import { useState, useEffect } from 'react';
import HomeView from './views/HomeView';
// import SelectView from './views/SelectView'; // Will be added later
// import BattleView from './views/BattleView'; // Will be added later
// import ResultView from './views/ResultView'; // Will be added later
import pokemonData from './data/pokemon_data.json';
import typeData from './data/type_chart.json';
import './App.css';

function App() {
  // 'HOME', 'SELECT', 'BATTLE', 'RESULT'
  const [gameState, setGameState] = useState('HOME');
  const [dailyChallenge, setDailyChallenge] = useState(null);

  // Generate daily challenge once on load
  useEffect(() => {
    // For now, let's just use mock data.
    // Later, this will be replaced with `generateDailyChallenge` from `utils`.
    const leaderTeam = [
      pokemonData.find(p => p.id === 25), // Pikachu
      pokemonData.find(p => p.id === 6),  // Charizard
      pokemonData.find(p => p.id === 9),  // Blastoise
    ];
    setDailyChallenge({
      leaderTeam: leaderTeam,
      // rentalPokemon will be added later
    });
  }, []);

  const handleChallengeClick = () => {
    setGameState('SELECT');
  };

  const renderView = () => {
    switch (gameState) {
      case 'HOME':
        return <HomeView onChallengeClick={handleChallengeClick} leaderTeam={dailyChallenge?.leaderTeam} />;
      // case 'SELECT':
      //   return <SelectView />;
      // case 'BATTLE':
      //   return <BattleView />;
      // case 'RESULT':
      //   return <ResultView />;
      default:
        return <HomeView onChallengeClick={handleChallengeClick} leaderTeam={dailyChallenge?.leaderTeam} />;
    }
  };

  return (
    <div className="App">
      <header>
        <h1>Pokedaily</h1>
      </header>
      <main>
        {renderView()}
      </main>
    </div>
  );
}

export default App;
