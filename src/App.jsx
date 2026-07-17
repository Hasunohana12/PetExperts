import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import SignInSide from './components/SignInSide';
import PanelCentral from './panel/PanelCentral'; 
import MascotIAError from './panel/MascotIAError'; 

function App() {
  const [errorSistema, setErrorSistema] = useState(null); 

  axios.interceptors.response.use(
    response => response,
    error => {
      if (!error.response || error.response.status === 500) {
        setErrorSistema(error.message || "Error de conexión con el servidor");
      }
      return Promise.reject(error);
    }
  );

  const resetearError = () => {
    setErrorSistema(null);
    window.location.reload();
  };

  if (errorSistema) {
    return (
      <MascotIAError 
        errorTecnico={errorSistema} 
        alReintentar={resetearError} 
      />
    );
  }

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