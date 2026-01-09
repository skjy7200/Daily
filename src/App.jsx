import { Routes, Route } from 'react-router-dom';
import './App.css';
import Main from './pages/Main/Main';
import TeamSelection from './pages/TeamSelection/TeamSelection';
import Battle from './pages/Battle/Battle';
import Result from './pages/Result/Result';
import DevTools from './components/DevTools';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/select" element={<TeamSelection />} />
        <Route path="/battle" element={<Battle />} />
        <Route path="/result" element={<Result />} />
      </Routes>
      {import.meta.env.DEV && <DevTools />}
    </div>
  );
}

export default App;
