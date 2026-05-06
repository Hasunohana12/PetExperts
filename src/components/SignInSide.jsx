import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import SignInCard from './SignInCard';
import Content from './Content';

export default function SignInSide() {
  return (
    <>
      <CssBaseline />

      <Stack
        direction="column"
        component="main"
        sx={{
          justifyContent: 'center',
          minHeight: '100vh',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            zIndex: -1,
            backgroundImage:
              'radial-gradient(ellipse at 50% 50%, #e3f2fd, #ffffff)',
            backgroundRepeat: 'no-repeat',
          },
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{
            justifyContent: 'center',
            gap: 6,
            p: 2,
          }}
        >
          <Content />
          <SignInCard />
        </Stack>
      </Stack>
    </>
  );
}