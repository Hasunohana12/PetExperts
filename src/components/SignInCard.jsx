import * as React from 'react';
import { Box, Button, Card as MuiCard, Checkbox, Divider, FormLabel, FormControl, FormControlLabel, Link, TextField, Typography, styled } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex', flexDirection: 'column', alignSelf: 'center', width: '100%', padding: theme.spacing(4), gap: theme.spacing(2),
  boxShadow: 'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px',
  [theme.breakpoints.up('sm')]: { width: '450px' },
}));

export default function SignInCard({ onSwitch }) {
  const navigate = useNavigate();
  const [emailError, setEmailError] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get('email');
    const password = data.get('password');

try {
      const response = await axios.post('http://localhost:3001/verificar', { 
        usuario: email, 
        contrasena: password 
      });
      
      alert(`Bienvenido ${response.data.nombre_completo}`);
      
      navigate('/turnos'); 

    } catch (error) {
      alert(error.response?.data?.message || 'Error de conexión');
    }
  };

  return (
    <Card variant="outlined">
      <Typography variant="h4">Iniciar sesión</Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl>
          <FormLabel htmlFor="email">Gmail</FormLabel>
          <TextField id="email" name="email" type="email" required fullWidth variant="outlined" />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="password">Contraseña</FormLabel>
          <TextField id="password" name="password" type="password" required fullWidth variant="outlined" />
        </FormControl>
        <Button type="submit" fullWidth variant="contained">Iniciar Sesión</Button>
        <Typography sx={{ textAlign: 'center' }}>
          ¿No tienes cuenta? <Link component="button" type="button" onClick={onSwitch}>Regístrate</Link>
        </Typography>
      </Box>
    </Card>
  );
}