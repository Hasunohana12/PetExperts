import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export default function PanelRecepcion({ usuario }) {
  const cerrarSesion = () => {
    localStorage.removeItem('usuario');
    window.location.href = '/';
  };

  return (
    <Box sx={{ p: 4, bgcolor: '#f5f5f5', minHeight: '100vh', textAlign: 'center' }}>
      <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
        RECEPCIONISTA
      </Typography>
      <Typography variant="h6" sx={{ mb: 4 }}>
        Panel de Control - {usuario?.nombre_completo || 'Recepcionista'}
      </Typography>

      {/* Marcador de posición para tu tabla de recepción */}
      <Box sx={{ border: '3px solid #b51a4b', borderRadius: '20px', p: 8, bgcolor: '#fff', mb: 4 }}>
        <Typography color="textSecondary">Acá va la tabla global de turnos y botones de registro</Typography>
      </Box>

      <Button variant="contained" color="primary" onClick={cerrarSesion}>
        Cerrar Sesión
      </Button>
    </Box>
  );
}