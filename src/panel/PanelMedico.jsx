import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export default function PanelMedico({ usuario }) {
  const cerrarSesion = () => {
    localStorage.removeItem('usuario');
    window.location.href = '/';
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f5f5f5', minHeight: '100vh', textAlign: 'center' }}>
      <Typography variant="h3" color="error" sx={{ fontWeight: 'bold', mb: 2 }}>
        MÉDICO
      </Typography>
      <Typography variant="h6" sx={{ mb: 4 }}>
        Bienvenido, Dr/a. {usuario?.nombre_completo || 'Médico'}
      </Typography>
      
      <Box sx={{ border: '3px solid #b51a4b', borderRadius: '20px', p: 8, bgcolor: '#fff', mb: 4 }}>
        <Typography color="textSecondary">Acá va tu hermosa tabla de turnos médicos</Typography>
      </Box>

      <Button variant="contained" color="error" onClick={cerrarSesion}>
        Cerrar Sesión
      </Button>
    </Box>
  );
}