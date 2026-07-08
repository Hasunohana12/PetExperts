import * as React from 'react';
import { Box, Button, Card as MuiCard, Checkbox, Divider, FormLabel, FormControl, FormControlLabel, Link, TextField, Typography, styled } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  backgroundColor: '#ffffff!important', 
  borderRadius: '12px', 
  boxShadow: '0px 10px 25px rgba(0,0,0,0.1), 0px 4px 10px rgba(0,0,0,0.05)', 
  border: '1px solid #e0e0e0', 
  [theme.breakpoints.up('sm')]: {
    width: '450px',
  },
  ...theme.applyStyles('dark', {
    boxShadow: 'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

export default function SignInCard({ onSwitch }) {
  const navigate = useNavigate();
  const [emailError, setEmailError] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState(false);
  
  const [showPassword, setShowPassword] = React.useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get('email');
    const password = data.get('password');

    try {
      const response = await axios.post('http://172.16.4.245:3001/verificar', { 
        usuario: email, 
        contrasena: password 
      });

      localStorage.setItem('usuario', JSON.stringify(response.data));
      
      alert(`Bienvenido ${response.data.nombre_completo}`);
      
      navigate('/turnos'); 

    } catch (error) {
      alert(error.response?.data?.message || 'Error de conexión');
    }
  };

  return (
    <Card elevation={5}>
      <Typography variant="h4">Iniciar sesión</Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl>
          <FormLabel htmlFor="email">Gmail</FormLabel>
          <TextField id="email" name="email" type="email" required fullWidth variant="outlined" />
        </FormControl>
        
        <FormControl>
          <FormLabel htmlFor="password">Contraseña</FormLabel>
          <TextField id="password" name="password" type={showPassword ? "text" : "password"} required fullWidth variant="outlined" />   
          
          <label style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '14px' }}>
            <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} />
            Mostrar Contraseña
          </label>
        </FormControl>

        <Button type="submit" fullWidth variant="contained">Iniciar Sesión</Button>
        <Typography sx={{ textAlign: 'center' }}>
          ¿No tienes cuenta? <Link component="button" type="button" onClick={onSwitch}>Regístrate</Link>
        </Typography>
      </Box>
    </Card>
  );
}