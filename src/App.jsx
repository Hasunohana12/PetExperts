import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignInSide from './components/SignInSide';
import Paperbase from './visual/Paperbase.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignInSide />} />
        <Route path="/turnos" element={<Paperbase />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;