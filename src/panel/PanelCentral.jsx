import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, Avatar, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, Button, Grid, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  Snackbar, Alert, Badge, Menu, MenuItem
} from '@mui/material';
import {
  Home, CalendarMonth, History, AppRegistration, Notifications,
  ExitToApp, MoreVert, Chat, ForwardToInbox, PictureAsPdf
} from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import logoVeterinaria from '../assets/logo.PNG';
import { io } from 'socket.io-client';

const socket = io('http://172.16.4.245:3001');

export default function PanelCentral() {
  const usuarioLogueado = JSON.parse(localStorage.getItem('usuario'));
  const [seccionActiva, setSeccionActiva] = useState('PRINCIPAL');
  const [fechaActual, setFechaActual] = useState('');

  const [turnos, setTurnos] = useState([]);
  const [turnosCalendario, setTurnosCalendario] = useState([]);

  const [mesActual, setMesActual] = useState(new Date().getMonth() + 1);
  const [anioActual, setAnioActual] = useState(new Date().getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [turnosDelDia, setTurnosDelDia] = useState([]);

  const [cargandoRecordatorios, setCargandoRecordatorios] = useState(false);

  const [estudioFormData, setEstudioFormData] = useState({
    id_mascota: '',
    titulo_estudio: '',
    mensaje: ''
  });

  const [archivoPlaca, setArchivoPlaca] = useState(null);
  const [cargandoEstudio, setCargandoEstudio] = useState(false);

  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);

  const [pacientesMedicos, setPacientesMedicos] = useState([]);

  const [openModal, setOpenModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  const [alertaSistema, setAlertaSistema] = useState({ abierto: false, titulo: '', mensaje: '' });

  const [mensajesChat, setMensajesChat] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');

  const [notificaciones, setNotificaciones] = useState([]);
  const [abrirNotificaciones, setAbrirNotificaciones] = useState(false);
  const [hayNotificacionNueva, setHayNotificacionNueva] = useState(false);
  const [openToast, setOpenToast] = useState(false);
  const [datosToast, setDatosToast] = useState({ mascota: '', hora: '' });

  const [formData, setFormData] = useState({
    mascota: '', raza: '', especie: '', dueno: '', telefono: '', email: '', fecha: '', hora: '', motivo: ''
  });
  const [editFormData, setEditFormData] = useState({
    id_turno: '', mascota: '', raza: '', especie: '', dueno: '', fecha: '', hora: '', motivo: ''
  });

  useEffect(() => {
    const opciones = { month: 'long', day: 'numeric' };
    const hoy = new Date().toLocaleDateString('es-ES', opciones);
    setFechaActual(hoy.charAt(0).toUpperCase() + hoy.slice(1));
  }, []);

  useEffect(() => {
    socket.on('notificar-nuevo-turno', (data) => {
      if (usuarioLogueado?.rol === 'medico') {
        setNotificaciones(prev => [
          {
            mensaje: `Nueva cita para la mascota: ${data.mascota} - Motivo: ${data.motivo}`,
            hora: data.hora,
            fecha: new Date().toLocaleString()
          },
          ...prev
        ]);
        setHayNotificacionNueva(true);

        setDatosToast({ mascota: data.mascota, hora: data.hora });
        setOpenToast(true);
      }
    });

    socket.on('recibir-mensaje-chat', (data) => {
      console.log("¡Llegó un mensaje por Socket al cliente!", data);
      setMensajesChat(prev => [...prev, data]);
    });

    return () => {
      socket.off('notificar-nuevo-turno');
      socket.off('recibir-mensaje-chat');
    };
  }, [usuarioLogueado]);

  useEffect(() => {
    if (seccionActiva === 'ENVIAR_ESTUDIOS') {
      axios.get('http://172.16.4.245:3001/api/medico/pacientes-con-email')
        .then(response => {
          setPacientesMedicos(response.data);
        })
        .catch(error => {
          console.error("Error al traer pacientes para el médico:", error);
        });
    }
  }, [seccionActiva]);

  const [anchorElNotif, setAnchorElNotif] = useState(null);
  const openNotifMenu = Boolean(anchorElNotif);

  const handleOpenNotifMenu = (event) => {
    setAnchorElNotif(event.currentTarget);
    setHayNotificacionNueva(false);
  };

  const handleCloseNotifMenu = () => {
    setAnchorElNotif(null);
  };

  useEffect(() => {
    if (seccionActiva === 'PRINCIPAL') {
      cargarTurnosPendientes();
    } else if (seccionActiva === 'HISTORIAL') {
      cargarHistorialCompleto();
    } else if (seccionActiva === 'CHAT') {
      cargarHistorialChat();
    }
  }, [seccionActiva]);

  const cargarHistorialChat = async () => {
    try {
      const response = await axios.get('http://172.16.4.245:3001/obtener-chat');
      setMensajesChat(response.data);
    } catch (error) {
      console.error("Error cargando el historial del chat:", error);
    }
  };

  const cargarTurnosPendientes = async () => {
    try {
      const response = await axios.get('http://172.16.4.245:3001/obtener-turnos');

      const hoy = new Date();
      const hoyString = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');

      const turnosVencidos = [];
      const turnosVigentes = [];

      response.data.forEach(turno => {
        const fechaTurno = turno.fecha ? turno.fecha.substring(0, 10) : '';

        if (fechaTurno < hoyString && turno.estado === 'pendiente') {
          turnosVencidos.push(turno.id_turno);
        } else {
          turnosVigentes.push(turno);
        }
      });

      if (turnosVencidos.length > 0) {
        await axios.put('http://172.16.4.245:3001/vencer-turnos', { ids: turnosVencidos });
        console.log("Se mandaron al historial los turnos expirados:", turnosVencidos);
      }

      setTurnos(turnosVigentes);
    } catch (error) {
      console.error("Error cargando turnos pendientes:", error);
    }
  };

  const cargarHistorialCompleto = async () => {
    try {
      const responseTurnos = await axios.get('http://172.16.4.245:3001/obtener-turnos');
      const hoy = new Date();
      const hoyString = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
      const turnosVencidos = [];

      responseTurnos.data.forEach(turno => {
        const fechaTurno = turno.fecha ? turno.fecha.substring(0, 10) : '';
        if (fechaTurno < hoyString && turno.estado === 'pendiente') {
          turnosVencidos.push(turno.id_turno);
        }
      });

      if (turnosVencidos.length > 0) {
        await axios.put('http://172.16.4.245:3001/vencer-turnos', { ids: turnosVencidos });
        console.log("Historial: Turnos viejos vencidos automáticamente:", turnosVencidos);
      }

      const responseHistorial = await axios.get('http://172.16.4.245:3001/obtener-historial');
      setTurnos(responseHistorial.data);
    } catch (error) {
      console.error("Error cargando historial:", error);
    }
  };

  useEffect(() => {
    if (seccionActiva === 'CALENDARIO') {
      const cargarDatosCalendario = async () => {
        try {
          const response = await axios.get(`http://172.16.4.245:3001/api/turnos-calendario?anio=${anioActual}&mes=${mesActual}`);
          setTurnosCalendario(response.data);
        } catch (error) {
          console.error("Error cargando el mapa de turnos mensuales:", error);
        }
      };
      cargarDatosCalendario();
    }
  }, [seccionActiva, mesActual, anioActual]);

  if (!usuarioLogueado) return <Navigate to="/" />;
  const rol = usuarioLogueado.rol;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditInputChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleGuardarTurno = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://172.16.4.245:3001/agregar-turno', formData);
      if (response.data.success) {
        setAlertaSistema({ abierto: true, titulo: "¡Turno Agendado!", mensaje: response.data.message });
        setFormData({ mascota: '', raza: '', especie: '', dueno: '', telefono: '', email: '', fecha: '', hora: '', motivo: '' });
        cargarTurnosPendientes();
        setSeccionActiva('PRINCIPAL');
      }
    } catch (error) {
      setAlertaSistema({ abierto: true, titulo: "Error", mensaje: "No se pudo agendar el turno. Revisa la conexión." });
    }
  };

  const handleEliminarTurno = async (id) => {
    if (!window.confirm("¿Estás completamente seguro de que deseas eliminar este turno permanentemente?")) return;
    try {
      const response = await axios.delete(`http://172.16.4.245:3001/eliminar-turno/${id}`);
      if (response.data.success) {
        setAlertaSistema({ abierto: true, titulo: "Registro Eliminado", mensaje: response.data.message });
        setTurnos(prev => prev.filter(t => t.id_turno !== id));
        setTurnosDelDia(prev => prev.filter(t => t.id_turno !== id));
        setTurnosCalendario(prev => prev.filter(t => t.id_turno !== id));
      }
    } catch (error) {
      setAlertaSistema({ abierto: true, titulo: "Error", mensaje: "No se pudo eliminar el turno." });
    }
  };

  const handleAtenderTurno = async (id) => {
    if (!window.confirm("¿Confirmas que la atención médica finalizó?.")) return;
    try {
      const response = await axios.put(`http://172.16.4.245:3001/atender-turno/${id}`);
      if (response.data.success) {
        setAlertaSistema({ abierto: true, titulo: "¡Atención Finalizada!", mensaje: response.data.message });
        setTurnos(prev => prev.filter(t => t.id_turno !== id));
        setTurnosDelDia(prev => prev.filter(t => t.id_turno !== id));
        setTurnosCalendario(prev => prev.filter(t => t.id_turno !== id));
      }
    } catch (error) {
      setAlertaSistema({ abierto: true, titulo: "Error", mensaje: "Error al procesar la atención médica." });
    }
  };

  const handleActualizarTurno = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`http://172.16.4.245:3001/editar-turno/${editFormData.id_turno}`, editFormData);
      if (response.data.success) {
        setAlertaSistema({ abierto: true, titulo: "Registro Actualizado", mensaje: response.data.message });
        setOpenEditModal(false);
        if (seccionActiva === 'PRINCIPAL') cargarTurnosPendientes();
        if (seccionActiva === 'CALENDARIO') {
          const resCal = await axios.get(`http://172.16.4.245:3001/api/turnos-calendario?anio=${anioActual}&mes=${mesActual}`);
          setTurnosCalendario(resCal.data);
          setOpenModal(false);
        }
      }
    } catch (error) {
      setAlertaSistema({ abierto: true, titulo: "Error", mensaje: "Error al intentar actualizar la información." });
    }
  };

  const handleAbrirEditar = (turno) => {
    setEditFormData({
      id_turno: turno.id_turno,
      mascota: turno.mascota || turno.nombre_mascota,
      raza: turno.raza || '',
      especie: turno.especie || '',
      dueno: turno.dueno || turno.nombre_dueno,
      fecha: turno.fecha ? turno.fecha.substring(0, 10) : '',
      hora: turno.hora || '',
      motivo: turno.motivo || ''
    });
    setOpenEditModal(true);
  };

  const cerrarSesion = () => {
    localStorage.removeItem('usuario');
    window.location.href = '/';
  };

  const handleEnviarMensaje = (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    const estructuraMensaje = {
      emisor: rol,
      nombre: usuarioLogueado?.nombre_completo,
      texto: nuevoMensaje,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    socket.emit('enviar-mensaje-chat', estructuraMensaje);
    setNuevoMensaje('');
  };

  const NOMBRES_MESES = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
  ];

  const irMesAnterior = () => {
    if (mesActual === 1) { setMesActual(12); setAnioActual(prev => prev - 1); }
    else { setMesActual(prev => prev - 1); }
  };

  const irMesSiguiente = () => {
    if (mesActual === 12) { setMesActual(1); setAnioActual(prev => prev + 1); }
    else { setMesActual(prev => prev + 1); }
  };

  const obtenerCeldasCalendario = () => {
    const primerDiaSemana = new Date(anioActual, mesActual - 1, 1).getDay();
    const totalDiasMesActual = new Date(anioActual, mesActual, 0).getDate();
    const totalDiasMesAnterior = new Date(anioActual, mesActual - 1, 0).getDate();
    const celdas = [];

    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      celdas.push({ dia: totalDiasMesAnterior - i, mes: mesActual === 1 ? 12 : mesActual - 1, anio: mesActual === 1 ? anioActual - 1 : anioActual, esMesActual: false });
    }
    for (let i = 1; i <= totalDiasMesActual; i++) {
      celdas.push({ dia: i, mes: mesActual, anio: anioActual, esMesActual: true });
    }
    const celdasRestantes = celdas.length % 7 === 0 ? 0 : 7 - (celdas.length % 7);
    for (let i = 1; i <= celdasRestantes; i++) {
      celdas.push({ dia: i, mes: mesActual === 12 ? 1 : mesActual + 1, anio: mesActual === 12 ? anioActual + 1 : anioActual, esMesActual: false });
    }
    return celdas;
  };

  const celdasCalendario = obtenerCeldasCalendario();

  const buscarTurnosPorDia = (celda) => {
    if (!celda) return { cantidad: 0, lista: [] };
    const formatoFechaSQL = `${celda.anio}-${String(celda.mes).padStart(2, '0')}-${String(celda.dia).padStart(2, '0')}`;
    const filtrados = turnosCalendario.filter(turno => turno.fecha.substring(0, 10) === formatoFechaSQL);
    return { cantidad: filtrados.length, lista: filtrados };
  };

  const calcularColorIntensidad = (cantidad) => {
    if (cantidad === 0) return '#ffffff';
    if (cantidad >= 1 && cantidad <= 2) return '#fcd1d7';
    if (cantidad === 3) return '#f4a6b3';
    return '#b51a4b';
  };

  const abrirDetalleDia = (celda) => {
    if (!celda) return;
    const datos = buscarTurnosPorDia(celda);
    setDiaSeleccionado(`${celda.dia} de ${NOMBRES_MESES[celda.mes - 1]}`);
    setTurnosDelDia(datos.lista);
    setOpenModal(true);
  };


  const handleEnviarRecordatorios48hs = async () => {
    if (!window.confirm("¿Confirmas el envío masivo de correos de recordatorio para los turnos de las próximas 48 horas?")) return;
    setCargandoRecordatorios(true);
    try {
      const response = await axios.post('http://172.16.4.245:3001/api/recepcion/enviar-recordatorios');
      setAlertaSistema({
        abierto: true,
        titulo: "¡Envío Exitoso!",
        mensaje: response.data.message || "Los correos de recordatorio han sido despachados institucionalmente."
      });
    } catch (error) {
      console.error(error);
      setAlertaSistema({
        abierto: true,
        titulo: "Error de Despacho",
        mensaje: error.response?.data?.message || "No se pudieron enviar los recordatorios automáticos."
      });
    } finally {
      setCargandoRecordatorios(false);
    }
  };

  const handleEstudioInputChange = (e) => {
    setEstudioFormData({ ...estudioFormData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setArchivoPlaca(e.target.files[0]);
  };

  const handleGuardarYEnviarEstudio = async (e) => {
    e.preventDefault();
    if (!archivoPlaca) {
      setAlertaSistema({ abierto: true, titulo: "Archivo Requerido", mensaje: "Por favor, adjunta la imagen de la placa radiográfica u estudio." });
      return;
    }

    const formDataEnvio = new FormData();
    formDataEnvio.append('id_mascota', estudioFormData.id_mascota);
    formDataEnvio.append('id_usuario', usuarioLogueado?.id_usuario);
    formDataEnvio.append('titulo_estudio', estudioFormData.titulo_estudio);
    formDataEnvio.append('mensaje', estudioFormData.mensaje);
    formDataEnvio.append('placa', archivoPlaca);

    setCargandoEstudio(true);
    try {
      const response = await axios.post('http://172.16.4.245:3001/api/medico/enviar-estudio', formDataEnvio, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setAlertaSistema({
          abierto: true,
          titulo: "Estudio Registrado",
          mensaje: "La placa se guardó con éxito en la base de datos de Neon y el correo institucional fue enviado al dueño."
        });
        setEstudioFormData({ id_mascota: '', titulo_estudio: '', mensaje: '' });
        setArchivoPlaca(null);
        setSeccionActiva('PRINCIPAL');
      }
    } catch (error) {
      console.error(error);
      setAlertaSistema({
        abierto: true,
        titulo: "Error de Registro",
        mensaje: error.response?.data?.message || "Hubo un problema al procesar el archivo y el envío."
      });
    } finally {
      setCargandoEstudio(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: '#fdfbf7', minHeight: '100vh' }}>

      <Box sx={{ width: 260, bgcolor: '#f4efe6', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e0dbd1', p: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4, p: 1 }}>
            <Box component="img" src={logoVeterinaria} alt="Logo" sx={{ width: 110, height: 110, borderRadius: '50%', border: '4px solid #f4a6b3', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#b51a4b', lineHeight: 1.1 }}>
              PET<br />EXPERTS
            </Typography>
          </Box>

          <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {['PRINCIPAL', 'CALENDARIO', 'HISTORIAL'].map((item) => (
              <ListItem disablePadding key={item}>
                <ListItemButton
                  selected={Boolean(seccionActiva === item)}
                  onClick={() => setSeccionActiva(item)}
                  sx={{ borderRadius: '8px', color: '#b51a4b', '&.Mui-selected': { bgcolor: '#ede5d5' } }}
                >
                  <ListItemIcon sx={{ color: '#b51a4b' }}>
                    {item === 'PRINCIPAL' && <Home />}
                    {item === 'CALENDARIO' && <CalendarMonth />}
                    {item === 'HISTORIAL' && <History />}
                  </ListItemIcon>
                  <ListItemText primary={item} slotProps={{ primary: { sx: { fontWeight: 'bold', fontSize: '0.9rem' } } }} />
                </ListItemButton>
              </ListItem>
            ))}

            <ListItem disablePadding>
              <ListItemButton
                selected={Boolean(seccionActiva === 'CHAT')}
                onClick={() => setSeccionActiva('CHAT')}
                sx={{ borderRadius: '8px', color: '#b51a4b', '&.Mui-selected': { bgcolor: '#ede5d5' } }}
              >
                <ListItemIcon sx={{ color: '#b51a4b' }}><Chat /></ListItemIcon>
                <ListItemText primary="CHAT INTERNO" slotProps={{ primary: { sx: { fontWeight: 'bold', fontSize: '0.9rem' } } }} />
              </ListItemButton>
            </ListItem>

            {rol === 'recepcionista' && (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={Boolean(seccionActiva === 'REGISTRO')}
                    onClick={() => setSeccionActiva('REGISTRO')}
                    sx={{ borderRadius: '8px', color: '#b51a4b', '&.Mui-selected': { bgcolor: '#ede5d5' } }}
                  >
                    <ListItemIcon sx={{ color: '#b51a4b' }}><AppRegistration /></ListItemIcon>
                    <ListItemText primary="REGISTRO" slotProps={{ primary: { sx: { fontWeight: 'bold', fontSize: '0.9rem' } } }} />
                  </ListItemButton>
                </ListItem>

                <ListItem disablePadding>
                  <ListItemButton
                    selected={Boolean(seccionActiva === 'ENVIAR_RECORDATORIO')}
                    onClick={() => setSeccionActiva('ENVIAR_RECORDATORIO')}
                    sx={{ borderRadius: '8px', color: '#b51a4b', '&.Mui-selected': { bgcolor: '#ede5d5' } }}
                  >
                    <ListItemIcon sx={{ color: '#b51a4b' }}><ForwardToInbox /></ListItemIcon>
                    <ListItemText primary="ENVIAR RECORDATORIO" slotProps={{ primary: { sx: { fontWeight: 'bold', fontSize: '0.9rem' } } }} />
                  </ListItemButton>
                </ListItem>
              </>
            )}

            {rol === 'medico' && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={Boolean(seccionActiva === 'ENVIAR_ESTUDIOS')}
                  onClick={() => setSeccionActiva('ENVIAR_ESTUDIOS')}
                  sx={{ borderRadius: '8px', color: '#b51a4b', '&.Mui-selected': { bgcolor: '#ede5d5' } }}
                >
                  <ListItemIcon sx={{ color: '#b51a4b' }}><PictureAsPdf /></ListItemIcon>
                  <ListItemText primary="ENVIAR ESTUDIOS" slotProps={{ primary: { sx: { fontWeight: 'bold', fontSize: '0.9rem' } } }} />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>

        <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <ListItemButton onClick={cerrarSesion} sx={{ borderRadius: '8px', color: '#b51a4b' }}>
            <ListItemIcon sx={{ color: '#b51a4b' }}><ExitToApp /></ListItemIcon>
            <ListItemText primary="CIERRA SESIÓN" slotProps={{ primary: { sx: { fontWeight: 'bold', fontSize: '0.9rem' } } }} />
          </ListItemButton>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderTop: '1px solid #e0dbd1', pt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: '#b51a4b' }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#333' }}>{usuarioLogueado.nombre_completo}</Typography>
                <Typography variant="caption" sx={{ color: '#666', textTransform: 'capitalize' }}>{rol}</Typography>
              </Box>
            </Box>
            <IconButton size="small"><MoreVert /></IconButton>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ color: '#b51a4b', fontWeight: 'bold', letterSpacing: 1 }}>
            PANEL &gt; {seccionActiva}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#b51a4b' }}>
            {rol === 'medico' ? 'MÉDICO' : 'RECEPCIONISTA'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: '#b51a4b', color: 'white', px: 3, py: 0.8, borderRadius: '20px', fontWeight: 'bold' }}>
              {fechaActual}
            </Box>
            <IconButton
              onClick={handleOpenNotifMenu}
              sx={{ border: '1px solid #b51a4b', color: '#b51a4b' }}>
              <Badge color="error" variant="dot" invisible={!hayNotificacionNueva}>
                <Notifications />
              </Badge>
            </IconButton>
            <Menu
              anchorEl={anchorElNotif}
              open={openNotifMenu}
              onClose={handleCloseNotifMenu}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  maxHeight: 350,
                  width: '320px',
                  borderRadius: '16px',
                  boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
                  border: '2px solid #b51a4b',
                  mt: 1,
                  '& .MuiList-padding': { padding: 0 }
                },
              }}
            >
              <Typography sx={{ p: 2, fontWeight: 'bold', color: '#b51a4b', bgcolor: '#fdfbf7', fontSize: '1rem' }}>
                Alertas de Turnos
              </Typography>
              <Divider sx={{ borderColor: '#b51a4b', opacity: 0.2 }} />

              {notificaciones.length === 0 ? (
                <MenuItem sx={{ py: 3, justifyContent: 'center', color: 'gray', fontSize: '0.9rem', pointerEvents: 'none' }}>
                  No hay notificaciones nuevas
                </MenuItem>
              ) : (
                notificaciones.map((notif, index) => (
                  <MenuItem
                    key={index}
                    onClick={handleCloseNotifMenu}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      whiteSpace: 'normal',
                      py: 1.5,
                      px: 2,
                      borderBottom: index !== notificaciones.length - 1 ? '1px solid #f0f0f0' : 'none',
                      '&:hover': { bgcolor: '#fdfbf7' }
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#333', fontWeight: '500', lineHeight: 1.3 }}>
                      {notif.mensaje}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#b51a4b', fontWeight: 'bold', mt: 0.5 }}>
                      Enviado: {notif.hora} hs
                    </Typography>
                  </MenuItem>
                ))
              )}
            </Menu>
          </Box>
        </Box>

        {(() => {
          switch (seccionActiva) {
            case 'CHAT':
              return (
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    border: '4px solid #b51a4b',
                    borderRadius: '24px',
                    bgcolor: '#ffffff',
                    height: '65vh',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Typography variant="h5" sx={{ color: '#b51a4b', fontWeight: 'bold', mb: 2 }}>
                    Chat de Mensajes
                  </Typography>

                  <Box
                    sx={{
                      flexGrow: 1,
                      overflowY: 'auto',
                      mb: 2,
                      p: 2,
                      bgcolor: '#fdfbf7',
                      borderRadius: '16px',
                      border: '1px solid #ede5d5',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5
                    }}
                  >
                    {mensajesChat.length === 0 ? (
                      <Typography sx={{ color: 'gray', textAlign: 'center', my: 'auto', fontStyle: 'italic' }}>
                        No hay mensajes. Escribe algo para empezar!
                      </Typography>
                    ) : (
                      mensajesChat.map((msg, idx) => {
                        const esMiMensaje = msg.emisor === rol;
                        return (
                          <Box
                            key={idx}
                            sx={{
                              alignSelf: esMiMensaje ? 'flex-end' : 'flex-start',
                              maxWidth: '70%'
                            }}
                          >
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: esMiMensaje ? '16px 16px 0px 16px' : '16px 16px 16px 0px',
                                bgcolor: esMiMensaje ? '#b51a4b' : '#f4efe6',
                                color: esMiMensaje ? 'white' : '#333',
                                border: esMiMensaje ? 'none' : '1px solid #e0dbd1',
                                boxShadow: '0px 1px 3px rgba(0,0,0,0.05)'
                              }}
                            >
                              <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', fontSize: '0.7rem', color: esMiMensaje ? '#f4a6b3' : '#b51a4b' }}>
                                {msg.nombre} ({msg.emisor === 'medico' ? 'Médico' : 'Recepción'})
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5, wordBreak: 'break-word' }}>
                                {msg.texto}
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', fontSize: '0.6rem', mt: 0.5, opacity: 0.7 }}>
                                {msg.hora}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })
                    )}
                  </Box>

                  <Box component="form" onSubmit={handleEnviarMensaje} sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      placeholder="Escribí un mensaje..."
                      value={nuevoMensaje}
                      onChange={(e) => setNuevoMensaje(e.target.value)}
                      slotProps={{
                        htmlInput: { sx: { bgcolor: '#fff', borderRadius: '8px' } }
                      }}
                    />
                    <Button type="submit" variant="contained" sx={{ bgcolor: '#b51a4b', '&:hover': { bgcolor: '#871035' }, px: 4, fontWeight: 'bold', borderRadius: '12px' }}>
                      Enviar
                    </Button>
                  </Box>
                </Paper>
              );

            case 'REGISTRO':
              return (
                <Paper component="form" onSubmit={handleGuardarTurno} sx={{ p: 4, border: '4px solid #b51a4b', borderRadius: '24px' }}>
                  <Typography variant="h5" sx={{ color: '#b51a4b', fontWeight: 'bold', mb: 3 }}>Registrar Nuevo Turno Médico</Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}><TextField label="Nombre Mascota" name="mascota" value={formData.mascota} onChange={handleInputChange} fullWidth required /></Grid>
                    <Grid item xs={12} sm={6}><TextField label="Especie" name="especie" value={formData.especie} onChange={handleInputChange} fullWidth /></Grid>
                    <Grid item xs={12} sm={6}><TextField label="Raza" name="raza" value={formData.raza} onChange={handleInputChange} fullWidth /></Grid>
                    <Grid item xs={12} sm={6}><TextField label="Nombre Dueño" name="dueno" value={formData.dueno} onChange={handleInputChange} fullWidth required /></Grid>
                    <Grid item xs={12} sm={6}><TextField label="Teléfono" name="telefono" value={formData.telefono} onChange={handleInputChange} fullWidth required /></Grid>
                    <Grid item xs={12} sm={6}><TextField label="Email (opcional)" name="email" value={formData.email} onChange={handleInputChange} fullWidth /></Grid>
                    <Grid item xs={12} sm={6}><TextField type="date" name="fecha" value={formData.fecha} onChange={handleInputChange} fullWidth required slotProps={{ inputLabel: { shrink: true } }} label="Fecha Turno" /></Grid>
                    <Grid item xs={12} sm={6}><TextField type="time" name="hora" value={formData.hora} onChange={handleInputChange} fullWidth required slotProps={{ inputLabel: { shrink: true } }} label="Hora Turno" /></Grid>
                    <Grid item xs={12}><TextField label="Motivo de la Consulta" name="motivo" value={formData.motivo} onChange={handleInputChange} fullWidth multiline rows={3} /></Grid>
                    <Grid item xs={12}>
                      <Button type="submit" variant="contained" sx={{ bgcolor: '#b51a4b', '&:hover': { bgcolor: '#871035' }, px: 4, py: 1.5, fontWeight: 'bold' }}>
                        Agendar Turno
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              );

            case 'CALENDARIO':
              return (
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button onClick={irMesAnterior} variant="outlined" sx={{ color: '#b51a4b', borderColor: '#b51a4b', fontWeight: 'bold', '&:hover': { bgcolor: '#fcd1d7', borderColor: '#b51a4b' } }}>
                        &lt; Ant
                      </Button>
                      <Typography variant="h5" sx={{ color: '#b51a4b', fontWeight: 'bold', minWidth: 180, textAlign: 'center' }}>
                        {NOMBRES_MESES[mesActual - 1]} {anioActual}
                      </Typography>
                      <Button onClick={irMesSiguiente} variant="outlined" sx={{ color: '#b51a4b', borderColor: '#b51a4b', fontWeight: 'bold', '&:hover': { bgcolor: '#fcd1d7', borderColor: '#b51a4b' } }}>
                        Sig &gt;
                      </Button>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 14, height: 14, bgcolor: '#fcd1d7', border: '1px solid #ccc', borderRadius: '3px' }} />
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>1-2 turnos</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 14, height: 14, bgcolor: '#f4a6b3', border: '1px solid #ccc', borderRadius: '3px' }} />
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>3 turnos</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 14, height: 14, bgcolor: '#b51a4b', border: '1px solid #ccc', borderRadius: '3px' }} />
                        <Typography variant="caption" sx={{ color: '#b51a4b', fontWeight: 'bold' }}>+3 turnos</Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Paper sx={{ p: 3, border: '4px solid #b51a4b', borderRadius: '24px', bgcolor: '#ffffff', boxShadow: 'none' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', mb: 2, gap: 1.5 }}>
                      {['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'].map(d => (
                        <Typography key={d} variant="subtitle2" sx={{ color: '#b51a4b', fontWeight: 'bold', fontSize: '0.8rem' }}>{d}</Typography>
                      ))}
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1.5 }}>
                      {celdasCalendario.map((celda, index) => {
                        const { cantidad } = buscarTurnosPorDia(celda);
                        const colorFondo = celda.esMesActual ? calcularColorIntensidad(cantidad) : '#f9f9f9';
                        const usarLetraBlanca = celda.esMesActual && cantidad > 3;

                        return (
                          <Paper
                            key={index}
                            elevation={celda.esMesActual ? 2 : 0}
                            onClick={() => abrirDetalleDia(celda)}
                            sx={{
                              height: 90, bgcolor: colorFondo,
                              color: usarLetraBlanca ? '#ffffff' : (celda.esMesActual ? '#333333' : '#cccccc'),
                              cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                              p: 1.2, borderRadius: '12px', transition: 'all 0.2s ease', border: '1px solid #ede5d5',
                              opacity: celda.esMesActual ? 1 : 0.6,
                              '&:hover': { filter: 'brightness(0.96)', transform: 'scale(1.02)' }
                            }}
                          >
                            <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{celda.dia}</Typography>
                            {cantidad > 0 && (
                              <Typography variant="caption" sx={{
                                alignSelf: 'flex-end', fontWeight: 'bold',
                                bgcolor: usarLetraBlanca ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.85)',
                                color: usarLetraBlanca ? '#ffffff' : '#b51a4b', px: 0.8, py: 0.2, borderRadius: '6px', fontSize: '0.7rem'
                              }}>
                                {cantidad} {cantidad === 1 ? 'turno' : 'turnos'}
                              </Typography>
                            )}
                          </Paper>
                        );
                      })}
                    </Box>
                  </Paper>
                </Box>
              );

            case 'ENVIAR_RECORDATORIO':
              return (
                <Paper elevation={0} sx={{ p: 4, border: '4px solid #b51a4b', borderRadius: '24px', bgcolor: '#ffffff', textAlign: 'center', maxWidth: 600, mx: 'auto', mt: 4 }}>
                  <ForwardToInbox sx={{ fontSize: 60, color: '#b51a4b', mb: 2 }} />
                  <Typography variant="h5" sx={{ color: '#b51a4b', fontWeight: 'bold', mb: 2 }}>
                    Módulo de Recordatorios Automáticos
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#333', mb: 3, px: 2 }}>
                    Al hacer clic en el botón, el sistema revisará los turnos agendados para los próximos <strong>2 días (48 horas)</strong> y enviará un correo de aviso con el turno a todos los clientes que cargaron su Gmail.
                  </Typography>
                  <Button
                    variant="contained"
                    disabled={cargandoRecordatorios}
                    onClick={handleEnviarRecordatorios48hs}
                    sx={{ bgcolor: '#b51a4b', '&:hover': { bgcolor: '#871035' }, px: 5, py: 1.5, fontWeight: 'bold', borderRadius: '12px', fontSize: '1rem' }}
                  >
                    {cargandoRecordatorios ? "Despachando Correos..." : "ENVIAR RECORDATORIOS (48HS)"}
                  </Button>
                </Paper>
              );

            case 'ENVIAR_ESTUDIOS':
              return (
                <Paper component="form" onSubmit={handleGuardarYEnviarEstudio} sx={{ p: 4, border: '4px solid #b51a4b', borderRadius: '24px', bgcolor: '#ffffff', maxWidth: 700, mx: 'auto' }}>
                  <Typography variant="h5" sx={{ color: '#b51a4b', fontWeight: 'bold', mb: 3 }}>
                    Buscador de Pacientes y Envío de Estudios
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        select
                        label="Seleccionar Paciente (Mascotas con Gmail)"
                        name="id_mascota"
                        value={estudioFormData.id_mascota}
                        onChange={handleEstudioInputChange}
                        fullWidth
                        required
                      >
                        <MenuItem value=""><em>-- Seleccione un paciente --</em></MenuItem>

                        {pacientesMedicos.map((p) => (
                          <MenuItem key={p.id_mascota} value={p.id_mascota}>
                            {p.mascota} (Dueño: {p.dueno} - {p.email})
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        label="Título del Estudio"
                        name="titulo_estudio"
                        placeholder="Ej: Placa Radiográfica de Tórax / Análisis de Sangre"
                        value={estudioFormData.titulo_estudio}
                        onChange={handleEstudioInputChange}
                        fullWidth
                        required
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        label="Observaciones / Mensaje para el Dueño"
                        name="mensaje"
                        multiline
                        rows={4}
                        placeholder="Escriba las indicaciones médicas o detalles del estudio..."
                        value={estudioFormData.mensaje}
                        onChange={handleEstudioInputChange}
                        fullWidth
                        required
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ p: 3, border: '2px dashed #b51a4b', borderRadius: '12px', bgcolor: '#fdfbf7', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <PictureAsPdf sx={{ color: '#b51a4b', fontSize: 32 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#b51a4b' }}>
                          Adjuntar Placas o Documentos del Estudio
                        </Typography>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                          required
                          style={{ marginTop: '8px' }}
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={cargandoEstudio}
                        sx={{ bgcolor: '#b51a4b', '&:hover': { bgcolor: '#871035' }, px: 4, py: 1.5, fontWeight: 'bold', borderRadius: '12px' }}
                      >
                        {cargandoEstudio ? "Procesando y Enviando..." : "GUARDAR Y ENVIAR ESTUDIO"}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              );

            case 'PRINCIPAL':
            case 'HISTORIAL':
            default:
              return (
                <TableContainer component={Paper} sx={{ border: '4px solid #b51a4b', borderRadius: '24px', overflow: 'hidden', boxShadow: 'none' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#ffffff' }}>
                        {['MASCOTA', 'RAZA', 'ESPECIE', 'DUEÑO', 'FECHA', 'HORA', 'MOTIVO'].map((col) => (
                          <TableCell key={col} align="center" sx={{ color: '#b51a4b', fontWeight: 'bold', borderBottom: '4px solid #b51a4b', borderRight: '1px solid #e0e0e0' }}>
                            {col}
                          </TableCell>
                        ))}
                        <TableCell align="center" sx={{ color: '#b51a4b', fontWeight: 'bold', borderBottom: '4px solid #b51a4b' }}>
                          {seccionActiva === 'HISTORIAL' || rol === 'medico' ? 'ESTADO' : 'ACCIONES'}
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {turnos.length > 0 ? (
                        turnos.map((turno) => (
                          <TableRow key={turno.id_turno} sx={{ '&:nth-of-type(even)': { bgcolor: '#fdfbf7' } }}>
                            <TableCell align="center" sx={{ borderRight: '1px solid #f0f0f0', fontWeight: 'bold' }}>{turno.mascota}</TableCell>
                            <TableCell align="center" sx={{ borderRight: '1px solid #f0f0f0' }}>{turno.raza || '-'}</TableCell>
                            <TableCell align="center" sx={{ borderRight: '1px solid #f0f0f0' }}>{turno.especie || '-'}</TableCell>
                            <TableCell align="center" sx={{ borderRight: '1px solid #f0f0f0' }}>{turno.dueno}</TableCell>
                            <TableCell align="center" sx={{ borderRight: '1px solid #f0f0f0' }}>
                              {turno.fecha ? turno.fecha.split('T')[0].split('-').reverse().join('/') : '-'}
                            </TableCell>
                            <TableCell align="center" sx={{ borderRight: '1px solid #f0f0f0' }}>{turno.hora.substring(0, 5)}</TableCell>
                            <TableCell align="center" sx={{ borderRight: '1px solid #f0f0f0' }}>{turno.motivo || '-'}</TableCell>

                            <TableCell align="center">
                              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>

                                {seccionActiva === 'HISTORIAL' && (
                                  turno.estado === 'atendido' ? (
                                    <Typography variant="caption" sx={{
                                      color: '#2e7d32',
                                      bgcolor: '#e8f5e9',
                                      px: 1.5, py: 0.5,
                                      borderRadius: '6px',
                                      fontWeight: 'bold'
                                    }}>
                                      ✓ ATENDIDO
                                    </Typography>
                                  ) : (
                                    <Typography variant="caption" sx={{
                                      color: '#d32f2f',
                                      bgcolor: '#ffebee',
                                      px: 1.5, py: 0.5,
                                      borderRadius: '6px',
                                      fontWeight: 'bold'
                                    }}>
                                      ✕ NO ASISTIÓ
                                    </Typography>
                                  )
                                )}
                                {rol === 'recepcionista' && seccionActiva === 'PRINCIPAL' && (
                                  <>
                                    <IconButton onClick={() => handleAbrirEditar(turno)} sx={{ color: '#b51a4b' }} size="small" title="Editar">
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton onClick={() => handleEliminarTurno(turno.id_turno)} sx={{ color: '#d32f2f' }} size="small" title="Eliminar">
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                )}

                                {rol === 'medico' && seccionActiva === 'PRINCIPAL' && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<CheckCircleIcon />}
                                    onClick={() => handleAtenderTurno(turno.id_turno)}
                                    sx={{
                                      bgcolor: '#2e7d32',
                                      '&:hover': { bgcolor: '#1b5e20' },
                                      textTransform: 'none',
                                      fontWeight: 'bold',
                                      borderRadius: '8px'
                                    }}
                                  >
                                    Atender
                                  </Button>
                                )}

                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#999' }}>
                            No hay turnos registrados en este listado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
          }
        })()}
      </Box>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ bgcolor: '#b51a4b', color: '#ffffff', fontWeight: 'bold' }}>
          Turnos del {diaSeleccionado}, {anioActual}
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#fdfbf7' }}>
          {turnosDelDia.length === 0 ? (
            <Typography sx={{ py: 3, textAlign: 'center', color: '#666', fontStyle: 'italic' }}>No existen citas médicas programadas.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
              {turnosDelDia.map((turno) => (
                <Box key={turno.id_turno} sx={{ bgcolor: '#ffffff', p: 2, borderRadius: '12px', border: '1px solid #ede5d5', position: 'relative' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" sx={{ color: '#b51a4b', fontWeight: 'bold' }}>{turno.nombre_mascota || turno.mascota}</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', bgcolor: '#f4efe6', px: 1.5, py: 0.2, borderRadius: '8px' }}>
                      {turno.hora.substring(0, 5)} hs
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2"><strong>Dueño:</strong> {turno.nombre_dueno || turno.dueno}</Typography>
                  <Typography variant="body2"><strong>Especie/Raza:</strong> {turno.especie || 'N/A'} ({turno.raza || 'N/A'})</Typography>
                  <Typography variant="body2" sx={{ bgcolor: '#fdfbf7', p: 1, mt: 1, borderRadius: '6px', borderLeft: '3px solid #f4a6b3' }}>
                    <strong>Motivo:</strong> {turno.motivo || 'Sin especificar'}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}>
                    {rol === 'recepcionista' && (
                      <>
                        <Button size="small" startIcon={<EditIcon />} onClick={() => handleAbrirEditar(turno)} sx={{ color: '#b51a4b' }}>Editar</Button>
                        <Button size="small" startIcon={<DeleteIcon />} onClick={() => handleEliminarTurno(turno.id_turno)} sx={{ color: '#d32f2f' }}>Eliminar</Button>
                      </>
                    )}
                    {rol === 'medico' && (
                      <Button size="small" startIcon={<CheckCircleIcon />} onClick={() => handleAtenderTurno(turno.id_turno)} sx={{ color: '#2e7d32' }}>Atender</Button>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#f4efe6', p: 2 }}>
          <Button onClick={() => setOpenModal(false)} variant="contained" sx={{ bgcolor: '#b51a4b', fontWeight: 'bold' }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: '24px', border: '3px solid #b51a4b' } }}>
        <DialogTitle sx={{ color: '#b51a4b', fontWeight: 'bold', fontSize: '1.4rem' }}>Modificar Registro de Turno</DialogTitle>
        <Box component="form" onSubmit={handleActualizarTurno}>
          <DialogContent dividers sx={{ p: 4 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}><TextField label="Nombre Mascota" name="mascota" value={editFormData.mascota} onChange={handleEditInputChange} fullWidth required /></Grid>
              <Grid item xs={12} sm={4}><TextField label="Especie" name="especie" value={editFormData.especie} onChange={handleEditInputChange} fullWidth /></Grid>
              <Grid item xs={12} sm={4}><TextField label="Raza" name="raza" value={editFormData.raza} onChange={handleEditInputChange} fullWidth /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Nombre Dueño" name="dueno" value={editFormData.dueno} onChange={handleEditInputChange} fullWidth required /></Grid>
              <Grid item xs={12} sm={6}><TextField type="date" name="fecha" value={editFormData.fecha} onChange={handleEditInputChange} fullWidth required slotProps={{ inputLabel: { shrink: true } }} label="Fecha Cita" /></Grid>
              <Grid item xs={12} sm={6}><TextField type="time" name="hora" value={editFormData.hora} onChange={handleEditInputChange} fullWidth required slotProps={{ inputLabel: { shrink: true } }} label="Hora Cita" /></Grid>
              <Grid item xs={12}><TextField label="Motivo Clínico" name="motivo" value={editFormData.motivo} onChange={handleEditInputChange} fullWidth multiline rows={3} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, bgcolor: '#fdfbf7' }}>
            <Button onClick={() => setOpenEditModal(false)} sx={{ color: '#666', fontWeight: 'bold' }}>Cancelar</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#b51a4b', '&:hover': { bgcolor: '#871035' }, fontWeight: 'bold', px: 4 }}>
              Guardar Cambios
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar
        open={openToast}
        autoHideDuration={8000}
        onClose={() => setOpenToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setOpenToast(false)}
          severity="info"
          sx={{
            bgcolor: '#b51a4b',
            color: 'white',
            fontWeight: 'bold',
            borderRadius: '16px',
            boxShadow: 5,
            fontSize: '0.95rem',
            border: '2px solid #f4a6b3',
            '& .MuiAlert-icon': { color: 'white' },
            '& .MuiAlert-action rgba': { color: 'white' }
          }}
        >
          ¡Alerta! La recepcionista agendó a la mascota "{datosToast.mascota}" a las {datosToast.hora} hs.
        </Alert>
      </Snackbar>

      <Dialog
        open={alertaSistema.abierto}
        onClose={() => setAlertaSistema({ ...alertaSistema, abierto: false })}
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 1,
            minWidth: '360px',
            backgroundColor: '#ffffff',
            border: '3px solid #b51a4b',
            boxShadow: '0px 8px 30px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle sx={{ color: '#b51a4b', fontWeight: 'bold', textAlign: 'center', fontSize: '1.4rem', pb: 1 }}>
          {alertaSistema.titulo}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
          <Typography variant="body1" sx={{ color: '#444', fontSize: '1.05rem', lineHeight: 1.4 }}>
            {alertaSistema.mensaje}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={() => setAlertaSistema({ ...alertaSistema, abierto: false })}
            variant="contained"
            sx={{
              bgcolor: '#b51a4b',
              borderRadius: '25px',
              px: 5,
              py: 0.8,
              fontWeight: 'bold',
              fontSize: '0.95rem',
              textTransform: 'none',
              '&:hover': { bgcolor: '#871035' }
            }}
          >
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}