import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Main from './pages/Main';
import TeamSelection from './pages/TeamSelection';
import Battle from './pages/Battle';
import Result from './pages/Result';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/team" element={<TeamSelection />} />
        <Route path="/battle" element={<Battle />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </Router>
  );
}

export default App;