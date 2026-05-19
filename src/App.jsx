import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignInSide from './components/SignInSide';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignInSide />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;