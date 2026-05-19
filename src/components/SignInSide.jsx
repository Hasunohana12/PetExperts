import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import PetsRoundedIcon from '@mui/icons-material/PetsRounded';
import SignInCard from './SignInCard';
import SignUpCard from './SignUpCard';
import Content from './Content';
import logo from '../assets/logo.png';

export default function SignInSide() {
  const [view, setView] = React.useState('signin');

  const icons = [
    { left: 0, top: 90 }, { left: 30, top: 190 }, { left: 0, top: 330 },
    { left: 30, top: 470 }, { left: 0, top: 590 }, { left: 30, top: 710 },
    { right: 0, top: 90 }, { right: 30, top: 190 }, { right: 0, top: 330 },
    { right: 30, top: 470 }, { right: 0, top: 590 }, { right: 30, top: 710 }
  ];

  return (
    <>
      <CssBaseline />
      <Stack
        component="main"
        sx={{
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          position: 'relative',
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {icons.map((pos, index) => (
          <PetsRoundedIcon key={index} sx={{ position: 'absolute', fontSize: 42, color: '#000', ...pos }} />
        ))}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={10} sx={{ alignItems: 'center' }}>
          <Stack spacing={3} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 110, height: 110, borderRadius: '50%', border: '4px solid #f4a6b3', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={logo} alt="Logo" style={{ width: '75%', height: '75%', objectFit: 'contain' }} />
            </Box>
            <Content />
          </Stack>

          {view === 'signin' ? (
            <SignInCard onSwitch={() => setView('signup')} />
          ) : (
            <SignUpCard onSwitch={() => setView('signin')} />
          )}
        </Stack>
      </Stack>
    </>
  );
}