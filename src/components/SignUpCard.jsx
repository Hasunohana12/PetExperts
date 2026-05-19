import * as React from 'react';
import { Box, Button, Card as MuiCard, FormLabel, FormControl, Link, TextField, Typography, styled, Select, MenuItem } from '@mui/material';
import axios from 'axios';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  backgroundColor: '#fff', 
  boxShadow: '0px 5px 15px rgba(0, 0, 0, 0.1)',
  borderRadius: '12px',
  border: '1px solid #e0e0e0',
  [theme.breakpoints.up('sm')]: { width: '450px' },
}));

export default function SignUpCard({ onSwitch }) {
  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    
    try {
      await axios.post('http://localhost:3001/registrar', {
        nombre: data.get('nombre'),
        usuario: data.get('email'),
        contrasena: data.get('password'),
        rol: data.get('rol')
      });
      alert("Registro exitoso");
      onSwitch();
    } catch (error) {
      alert("Error al registrar");
    }
  };

  return (
    <Card variant="outlined">
      <Typography variant="h4">Regístrate</Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl>
          <FormLabel>Nombre Completo</FormLabel>
          <TextField name="nombre" required fullWidth />
        </FormControl>
        <FormControl>
          <FormLabel>Gmail</FormLabel>
          <TextField name="email" type="email" required fullWidth />
        </FormControl>
        <FormControl>
          <FormLabel>Contraseña</FormLabel>
          <TextField name="password" type="password" required fullWidth />
        </FormControl>
        <FormControl>
          <FormLabel>Rol</FormLabel>
          <Select name="rol" defaultValue="recepcionista">
            <MenuItem value="recepcionista">Recepcionista</MenuItem>
            <MenuItem value="medico">Médico</MenuItem>
          </Select>
        </FormControl>
        <Button type="submit" fullWidth variant="contained">Crear Cuenta</Button>
        <Typography sx={{ textAlign: 'center' }}>
          ¿Ya tienes cuenta? <Link component="button" type="button" onClick={onSwitch}>Inicia sesión</Link>
        </Typography>
      </Box>
    </Card>
  );
}