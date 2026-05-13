import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PetsRoundedIcon from '@mui/icons-material/PetsRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import MedicalServicesRoundedIcon from '@mui/icons-material/MedicalServicesRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';

const items = [
  {
    icon: <PetsRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Clínica veterinaria',
    description: 'PET EXPERTS',
  },
  {
    icon: <GroupRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Usuarios permitidos:',
    description: 'Médicos y Recepcionistas.',
  },
  {
    icon: <MedicalServicesRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Médicos:',
    description:
      'Procuren la actualización de sus estados y registros para llevar bien el orden y horario de los turnos.',
  },
  {
    icon: <CalendarMonthRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Recepcionistas:',
    description:
      'Estén atentos a cualquier cambio de horario para la asignación de turnos.',
  },
];

export default function Content() {
  return (
    <Stack
      sx={{ flexDirection: 'column', alignSelf: 'center', gap: 4, maxWidth: 450 }}
    >
      {items.map((item, index) => (
        <Stack key={index} direction="row" sx={{ gap: 2 }}>
          {item.icon}
          <div>
            <Typography gutterBottom sx={{ fontWeight: 'medium' }}>
              {item.title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {item.description}
            </Typography>
          </div>
        </Stack>
      ))}
    </Stack>
  );
}