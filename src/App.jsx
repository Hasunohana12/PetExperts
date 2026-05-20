import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignInSide from './components/SignInSide';
import PanelCentral from './panel/PanelCentral'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignInSide />} />
        <Route path="/turnos" element={<PanelCentral />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;