import * as React from 'react';
import { Box, Button, Card as MuiCard, FormLabel, FormControl, Link, TextField, Typography, styled, Select, MenuItem } from '@mui/material';
import axios from 'axios';
import { useState } from 'react';

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
  const [showPassword, setShowPassword] = React.useState(false);
  const [rol, setRol] = useState('recepcionista');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    
    try {
      await axios.post('http://172.16.4.245:3001/registrar', {
        nombre: data.get('nombre'),
        usuario: data.get('email'),
        contrasena: data.get('password'),
        rol: data.get('rol'),
        especialidad: data.get('rol') === 'medico' ? data.get('especialidad') : null
      });
      alert("Registro exitoso");
      onSwitch();
    } catch (error) {
      alert("Error al registrar");
    }
  };

  return (
    <Card variant="outlined">
      <Typography variant="h4">Registro</Typography>
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
          <TextField name="password" type ={showPassword ? "text" : "password"} required fullWidth />
          <label style={{ marginTop:'8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input type= "checkbox" onChange={() => setShowPassword(!showPassword)}/>
            Mostrar Contraseña
          </label>
        </FormControl>
        
        <FormControl>
          <FormLabel>Rol</FormLabel>
          <Select 
            name="rol" 
            value={rol} 
            onChange={(e) => setRol(e.target.value)}
          >
            <MenuItem value="recepcionista">Recepcionista</MenuItem>
            <MenuItem value="medico">Médico</MenuItem>
          </Select>
        </FormControl>

        {rol === 'medico' && (
          <FormControl required>
            <FormLabel>Especialidad Médica</FormLabel>
            <Select name="especialidad" defaultValue="Clínica General">
              <MenuItem value="Clínica General">Clínica General</MenuItem>
              <MenuItem value="Cirugía Veterinaria">Cirugía Veterinaria</MenuItem>
              <MenuItem value="Cardiología">Cardiología</MenuItem>
              <MenuItem value="Dermatología">Dermatología</MenuItem>
              <MenuItem value="Fisiatría / Rehabilitación">Fisiatría / Rehabilitación</MenuItem>
              <MenuItem value="Odontología">Odontología</MenuItem>
            </Select>
          </FormControl>
        )}

        <Button type="submit" fullWidth variant="contained">Crear Cuenta</Button>
        <Typography sx={{ textAlign: 'center' }}>
          ¿Ya tienes cuenta? <Link component="button" type="button" onClick={onSwitch}>Inicia sesión</Link>
        </Typography>
      </Box>
    </Card>
  );
}