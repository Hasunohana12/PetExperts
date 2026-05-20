import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, Avatar, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper}
from '@mui/material';
import {Home, CalendarMonth, History, AppRegistration, Notifications, ExitToApp, MoreVert}
from '@mui/icons-material';
import logo from '../assets/logo.png';

export default function PanelCentral() {
  const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));
  const [seccionActiva, setSeccionActiva] = useState('PRINCIPAL');
  const [fechaActual, setFechaActual] = useState('');

  useEffect(() => {
    const opciones = { month: 'long', day: 'numeric' };
    const hoy = new Date().toLocaleDateString('es-ES', opciones);
    setFechaActual(hoy.charAt(0).toUpperCase() + hoy.slice(1));
  }, []);

  if (!usuarioLogueado) {
    return <Navigate to="/" />;
  }

  const rol = usuarioLogueado.rol; 

  const cerrarSesion = () => {
    localStorage.removeItem('usuario');
    window.location.href = '/';
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <Box sx={{ 
        width: 260, bgcolor: '#eeebe3', display: 'flex', 
        flexDirection: 'column', justifyContent: 'between', 
        borderRight: '1px solid #e0dbd1', p: 2 
      }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4, p: 1 }}>
           <Box sx={{ width: 110, height: 110, borderRadius: '50%', border: '4px solid #f4a6b3', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={logo} alt="Logo" style={{ width: '75%', height: '75%', objectFit: 'contain' }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#c51f4c', lineHeight: 1.1 }}>
              PET<br />EXPERTS
            </Typography>
          </Box>

          <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <ListItem disablePadding>
              <ListItemButton 
                selected={seccionActiva === 'PRINCIPAL'}
                onClick={() => setSeccionActiva('PRINCIPAL')}
                sx={{ borderRadius: '8px', color: '#c51f4c', '&.Mui-selected': { bgcolor: '#ede5d5' } }}
              >
                <ListItemIcon sx={{ color: '#c51f4c' }}><Home /></ListItemIcon>
                <ListItemText primary="PRINCIPAL" slotProps={{ primary: { sx: { fontWeight: 'bold', fontSize: '0.9rem' } } }} />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton 
                selected={seccionActiva === 'CALENDARIO'}
                onClick={() => setSeccionActiva('CALENDARIO')}
                sx={{ borderRadius: '8px', color: '#c51f4c', '&.Mui-selected': { bgcolor: '#ede5d5' } }}
              >
                <ListItemIcon sx={{ color: '#c51f4c' }}><CalendarMonth /></ListItemIcon>
                <ListItemText primary="CALENDARIO" slotProps={{ primary: { sx: { fontWeight: 'bold', fontSize: '0.9rem' } } }} />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton 
                selected={seccionActiva === 'HISTORIAL'}
                onClick={() => setSeccionActiva('HISTORIAL')}
                sx={{ borderRadius: '8px', color: '#c51f4c', '&.Mui-selected': { bgcolor: '#ede5d5' } }}
              >
                <ListItemIcon sx={{ color: '#c51f4c' }}><History /></ListItemIcon>
                <ListItemText primary="HISTORIAL" slotProps={{ primary: { sx: { fontWeight: 'bold', fontSize: '0.9rem' } } }} />
              </ListItemButton>
            </ListItem>

            {rol === 'recepcionista' && (
              <ListItem disablePadding>
                <ListItemButton 
                  selected={seccionActiva === 'REGISTRO'}
                  onClick={() => setSeccionActiva('REGISTRO')}
                  sx={{ borderRadius: '8px', color: '#c51f4c', '&.Mui-selected': { bgcolor: '#ede5d5' } }}
                >
                  <ListItemIcon sx={{ color: '#c51f4c' }}><AppRegistration /></ListItemIcon>
                  <ListItemText primary="REGISTRO" slotProps={{ primary: { sx: { fontWeight: 'bold', fontSize: '0.9rem' } } }} />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>

        <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <ListItemButton onClick={cerrarSesion} sx={{ borderRadius: '8px', color: '#c51f4c' }}>
            <ListItemIcon sx={{ color: '#c51f4c' }}><ExitToApp /></ListItemIcon>
            <ListItemText primary="CIERRA SESIÓN" slotProps={{ primary: { sx: { fontWeight: 'bold', fontSize: '0.9rem' } } }} />
          </ListItemButton>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderTop: '1px solid #e0dbd1', pt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: '#c51f4c' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#333' }}>
                  {usuarioLogueado.nombre_completo}
                </Typography>
                <Typography variant="caption" sx={{ color: '#666', textTransform: 'capitalize' }}>
                  {rol}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small"><MoreVert /></IconButton>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#c51f4c', fontWeight: 'bold', letterSpacing: 1 }}>
              PANEL &gt; {seccionActiva}
            </Typography>
          </Box>
          
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#c51f4c', textTransform: 'uppercase' }}>
            {rol === 'medico' ? 'MÉDICO' : 'RECEPCIONISTA'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              bgcolor: '#b51a4b', color: 'white', px: 3, py: 0.8, 
              borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem' 
            }}>
              {fechaActual}
            </Box>
            <IconButton sx={{ border: '1px solid #c51f4c', color: '#c51f4c', p: 0.8 }}>
              <Notifications />
            </IconButton>
          </Box>
        </Box>

        <TableContainer component={Paper} sx={{ 
          border: '4px solid #c51f4c', borderRadius: '24px', 
          overflow: 'hidden', boxShadow: 'none', mt: 1 
        }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#ffffff' }}>
                {['MASCOTA', 'RAZA', 'ESPECIE', 'DUEÑO', 'FECHA', 'HORA', 'MOTIVO'].map((columna) => (
                  <TableCell 
                    key={columna} 
                    align="center" 
                    sx={{ 
                      color: '#c51f4c', fontWeight: 'bold', fontSize: '0.95rem',
                      borderBottom: '4px solid #c51f4c', borderRight: '1px solid #e0e0e0'
                    }}
                  >
                    {columna}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((fila) => (
                <TableRow key={fila} sx={{ height: '50px', '&:nth-of-type(even)': { bgcolor: '#fdfbf7' } }}>
                  <TableCell sx={{ borderRight: '1px solid #f0f0f0' }}></TableCell>
                  <TableCell sx={{ borderRight: '1px solid #f0f0f0' }}></TableCell>
                  <TableCell sx={{ borderRight: '1px solid #f0f0f0' }}></TableCell>
                  <TableCell sx={{ borderRight: '1px solid #f0f0f0' }}></TableCell>
                  <TableCell sx={{ borderRight: '1px solid #f0f0f0' }}></TableCell>
                  <TableCell sx={{ borderRight: '1px solid #f0f0f0' }}></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

      </Box>
    </Box>
  );
}