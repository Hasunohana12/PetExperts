import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Avatar,
    CircularProgress, Divider, Accordion, AccordionSummary, AccordionDetails, Tooltip
} from '@mui/material';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    Send, Refresh, Terminal, ExpandMore, ContentCopy, Download, Check
} from '@mui/icons-material';
import emailjs from '@emailjs/browser';

import byteDoctorImg from '../assets/byte_doctor.PNG';

export default function MascotIAError({ errorTecnico, alReintentar }) {
    const [conversacion, setConversacion] = useState([]);
    const [historialMensajes, setHistorialMensajes] = useState([]);
    const [mensajeUsuario, setMensajeUsuario] = useState('');
    const [cargandoIA, setCargandoIA] = useState(false);
    const [alertaFallida, setAlertaFallida] = useState(false);
    const [copiado, setCopiado] = useState(false);
    const chatEndRef = useRef(null);

    const clasificarErrorPostgres = (errorStr) => {
        const err = String(errorStr).toLowerCase();

        if (err.includes('econnrefused') || err.includes('5432')) {
            return {
                categoria: 'Conexión / Infraestructura (PostgreSQL)',
                causa: 'El servidor de PostgreSQL no está corriendo en el puerto 5432 o el cortafuegos está bloqueando el acceso.',
                solucion: 'Verificar el estado del servicio PostgreSQL (sudo systemctl status postgresql o pg_ctl) y revisar el archivo pg_hba.conf.',
                confianza: '95%'
            };
        }
        if (err.includes('28p01') || err.includes('password authentication failed') || err.includes('invalid password')) {
            return {
                categoria: 'Seguridad / Autenticación',
                causa: 'La contraseña o el usuario proporcionados en la cadena de conexión de la base de datos son incorrectos.',
                solucion: 'Validar las credenciales (PGUSER, PGPASSWORD) en las variables de entorno del Backend (.env).',
                confianza: '99%'
            };
        }
        if (err.includes('3d000') || err.includes('database') && err.includes('does not exist')) {
            return {
                categoria: 'Esquema de Base de Datos',
                causa: 'La base de datos específica no existe en el motor de PostgreSQL.',
                solucion: 'Ejecutar "CREATE DATABASE nombre_base_datos;" desde el shell de psql.',
                confianza: '90%'
            };
        }
        if (err.includes('42p01') || err.includes('relation') && err.includes('does not exist')) {
            return {
                categoria: 'Esquema de Base de Datos',
                causa: 'Una tabla o vista consultada no existe o el script de migración inicial no se ejecutó.',
                solucion: 'Revisar las migraciones del backend de Node.js o ejecutar el script SQL para crear la estructura de tablas.',
                confianza: '85%'
            };
        }
        if (err.includes('42501') || err.includes('permission denied')) {
            return {
                categoria: 'Permisos / Accesos',
                causa: 'El usuario de conexión no cuenta con privilegios suficientes (GRANT) sobre la tabla o base de datos seleccionada.',
                solucion: 'Ejecutar "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO usuario;"',
                confianza: '95%'
            };
        }
        return {
            categoria: 'Conectividad de Red / Gateway',
            causa: 'Falla genérica de red. No hay comunicación activa entre el frontend, el backend o los servicios externos de la clínica.',
            solucion: 'Comprobar la conexión física del router local, verificar IPs del servidor y validar que el puerto de Node esté activo.',
            confianza: '70%'
        };
    };

    const diagnosticoAnalizado = clasificarErrorPostgres(errorTecnico);

    const formatearTextoMarkdown = (texto) => {
        if (!texto) return '';
        const partes = texto.split(/(\*\*.*?\*\*)/g);
        return partes.map((parte, index) => {
            if (parte.startsWith('**') && parte.endsWith('**')) {
                return <strong key={index} style={{ fontWeight: 'bold', color: 'inherit' }}>{parte.slice(2, -2)}</strong>;
            }
            return parte;
        });
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversacion]);

    useEffect(() => {
        const inicializarByte = async () => {
            setCargandoIA(true);
            try {
                const apiKey = import.meta.env.VITE_GEMINI_KEY;
                if (!apiKey) throw new Error("API Key (VITE_GEMINI_KEY) no configurada.");

                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

                const promptSystem = `
          Eres "Byte", el analista de soporte tecnológico de Pet Experts. Eres un perro Border Collie muy inteligente, alegre y carismático que usa un guardapolvo rosa y estetoscopio. Tu misión es asistir amigablemente al personal ante fallas del sistema.
          
          Error crítico actual: "${errorTecnico}".
          Análisis del sistema:
          - Categoría: ${diagnosticoAnalizado.categoria}
          - Causa: ${diagnosticoAnalizado.causa}
          - Confianza: ${diagnosticoAnalizado.confianza}
          
          Estructura tu saludo inicial:
          1. Bienvenida entusiasta y cercana (habla de "tú" o "vos").
          2. Breve analogía médica/veterinaria del error.
          3. Muestra el diagnóstico estructurado con su nivel de confianza de ${diagnosticoAnalizado.confianza}.
          4. Ofrece 1 o 2 pasos prácticos de revisión local.
          5. Ofrece enviar la alerta por correo al administrador si no se soluciona.
          
          REGLAS DE TONO:
          - Mantén siempre una personalidad de Border Collie alegre, atento y fiel, usando toques sutiles de humor perruno (mover la cola de alegría, un "guau" entusiasta) sin perder profesionalismo técnico. Sabes perfectamente que eres un Border Collie.
          - Prohibido usar cualquier tipo de emoji o emoticón en el texto.
          - Remarca términos clave con doble asterisco (**texto**).
        `;

                const result = await model.generateContent(promptSystem);
                const respuestaByte = result.response.text();

                setConversacion([{ rol: 'byte', texto: respuestaByte }]);
                setHistorialMensajes([
                    { role: 'user', parts: [{ text: "Hola Byte, analicemos el error inicial del sistema." }] },
                    { role: 'model', parts: [{ text: respuestaByte }] }
                ]);
            } catch (e) {
                console.error(e);
                setConversacion([{
                    rol: 'byte',
                    texto: `Hola, soy **Byte**. No he podido establecer conexión con mi módulo de inteligencia artificial.\n\n[Diagnóstico]: ${e.message}`
                }]);
            } finally {
                setCargandoIA(false);
            }
        };

        inicializarByte();
    }, [errorTecnico]);

    const dispararAlertaEmail = async (diagnosticoBreve) => {
        try {
            const templateParams = {
                error_tecnico: errorTecnico,
                diagnostico_byte: diagnosticoBreve
            };
            const response = await emailjs.send(
                'service_0z2u7g6',
                'template_1byvdfp',
                templateParams,
                'O0_P8qP_2G1-iFv0j'
            );
            return response.status === 200;
        } catch (e) {
            console.error("Error al enviar la alerta mediante EmailJS:", e);
            return false;
        }
    };

    const enviarMensaje = async () => {
        if (!mensajeUsuario.trim() || cargandoIA) return;

        const nuevoMensaje = mensajeUsuario;
        setConversacion(prev => [...prev, { rol: 'usuario', texto: nuevoMensaje }]);
        setMensajeUsuario('');
        setCargandoIA(true);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_KEY;
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

            const promptContexto = `
        Eres Byte, el Border Collie especialista en soporte de Pet Experts. 
        Error activo: "${errorTecnico}".
        Alerta por email fallida previamente: ${alertaFallida ? "SÍ" : "NO"}.
        
        REGLAS DE RESPUESTA:
        1. Sé siempre amigable, alegre, compañero y empático (usa tú o vos). Tu personalidad es la de un Border Collie guardián de los sistemas: ágil, inteligente y vivaz. Evita respuestas secas, sumisas o disculpas exageradas si te llaman la atención; mantén el optimismo técnico.
        2. Si te preguntan tu raza, reafirma con orgullo que eres un Border Collie enfocado en mantener el orden informática de la clínica. 
        3. A respuestas o comentarios muy cortos del usuario, responde de forma breve, concisa y directa.
        4. Si te pide un chiste, cuenta de inmediato uno corto de programación o veterinaria sin rodeos teóricos.
        5. Prohibido usar emojis bajo ninguna circunstancia.
        6. REGLA DE ALERTA: Si solicita enviar la alerta (ej. "avisa", "enviar correo"), inicia tu respuesta OBLIGATORIAMENTE con "[TRIGGER_ALERTA]" seguido EXCLUSIVAMENTE por el informe de diagnóstico técnico estructurado para el administrador de sistemas (servicios afectados, causas, puertos). No incluyas frases como "procedo a enviar" dentro de la sección de alerta.
        7. Si la alerta por correo ya falló, no la ofrezcas de nuevo. Sugiere copiar el reporte o descargarlo para enviarlo por otro medio.
      `;

            const chatsConMemoria = [
                { role: 'user', parts: [{ text: promptContexto }] },
                ...historialMensajes,
                { role: 'user', parts: [{ text: nuevoMensaje }] }
            ];

            const result = await model.generateContent({ contents: chatsConMemoria });
            let respuestaByte = result.response.text();

            if (respuestaByte.includes('[TRIGGER_ALERTA]')) {
                const diagnosticoParaEmail = respuestaByte.replace('[TRIGGER_ALERTA]', '').trim();
                const mensajeConfirmacionChat = "¡Entendido! Preparo el reporte técnico detallado de inmediato y despacho la alerta de soporte hacia nuestro administrador de sistemas.";

                setConversacion(prev => [...prev, { rol: 'byte', texto: mensajeConfirmacionChat }]);

                const enviado = await dispararAlertaEmail(diagnosticoParaEmail);
                if (enviado) {
                    setConversacion(prev => [...prev, { rol: 'byte', texto: "¡Listo! La alerta de soporte fue enviada con éxito por correo electrónico. El administrador ya tiene el diagnóstico en su bandeja de entrada." }]);
                    setAlertaFallida(false);
                } else {
                    setAlertaFallida(true);
                    setConversacion(prev => [...prev, { rol: 'byte', texto: "Vaya, parece que la alerta no pudo salir por correo electrónico. Tiene sentido, ya que si experimentamos una desconexión total de red, no puedo alcanzar el servidor externo de correos. Te sugiero copiar el diagnóstico o descargar el reporte en archivo de texto desde el panel para enviarlo por otra vía." }]);
                }
            } else {
                setConversacion(prev => [...prev, { rol: 'byte', texto: respuestaByte }]);
            }

            setHistorialMensajes(prev => [
                ...prev,
                { role: 'user', parts: [{ text: nuevoMensaje }] },
                { role: 'model', parts: [{ text: respuestaByte }] }
            ]);

        } catch (e) {
            console.error(e);
            setConversacion(prev => [...prev, { rol: 'byte', texto: "Disculpa, he tenido una pequeña interferencia en mis circuitos. ¿Podrías repetirme tu mensaje?" }]);
        } finally {
            setCargandoIA(false);
        }
    };

    const manejarKeyPress = (e) => {
        if (e.key === 'Enter') enviarMensaje();
    };

    const copiarAlPortapapeles = () => {
        const textoReporte = `[REPORTE DE ERROR PET EXPERTS]
Fecha: ${new Date().toLocaleString()}
Falla Técnica: ${errorTecnico}
Categoría: ${diagnosticoAnalizado.categoria}
Causa Probable: ${diagnosticoAnalizado.causa}
Sugerencia de Resolución: ${diagnosticoAnalizado.solucion}
Nivel de Confianza: ${diagnosticoAnalizado.confianza}`;

        navigator.clipboard.writeText(textoReporte);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    };

    const descargarReporteTxt = () => {
        const textoReporte = `================================================
REPORTE DE INCIDENCIA TÉCNICA - PET EXPERTS
================================================
Fecha/Hora: ${new Date().toLocaleString()}
Error en el Sistema: ${errorTecnico}

------------------------------------------------
ANÁLISIS DE SISTEMAS (SOPORTE ASISTIDO BYTE)
------------------------------------------------
Categoría de Falla: ${diagnosticoAnalizado.categoria}
Causa Probable: ${diagnosticoAnalizado.causa}
Solución Recomendada: ${diagnosticoAnalizado.solucion}
Nivel de Confianza del Análisis: ${diagnosticoAnalizado.confianza}

------------------------------------------------
Este reporte fue generado automáticamente desde la terminal
de diagnóstico clínico veterinario de Pet Experts.
================================================`;

        const blob = new Blob([textoReporte], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_Falla_PetExperts_${Date.now()}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 4, bgcolor: '#FDFBF9' }}>
            <Paper elevation={3} sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, borderRadius: '24px', maxWidth: 1100, width: '100%', overflow: 'hidden', border: '1px solid #EAE3D9' }}>

                <Box sx={{ flex: 1, bgcolor: '#FAF7F2', p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #EAE3D9' }}>
                    <Avatar src={byteDoctorImg} alt="Byte - Soporte" sx={{ width: 130, height: 130, boxShadow: '0px 8px 24px rgba(0,0,0,0.08)', border: '4px solid #FFFFFF', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#2C1D11', fontWeight: 'bold' }}>Byte</Typography>
                    <Typography variant="caption" sx={{ color: '#b51a4c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Soporte Técnico de Sistemas</Typography>

                    <Divider sx={{ width: '80%', my: 3, borderColor: '#E5DEC9' }} />

                    <Accordion sx={{ width: '100%', border: '1px solid #EAE3D9', borderRadius: '12px !important', bgcolor: '#FFFFFF', boxShadow: 'none', mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Terminal sx={{ fontSize: 18, color: '#b51a4c' }} />
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2C1D11' }}>Detalles Técnicos</Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                            <Box sx={{ width: '100%', bgcolor: '#1E1E1E', borderRadius: '8px', p: 1.5, color: '#39FF14', fontFamily: 'monospace', fontSize: '11px', boxShadow: 'inset 0 0 10px #000', overflowX: 'auto', maxHeight: '120px' }}>
                                <div style={{ wordBreak: 'break-all' }}>{`> SYS_ERR: "${errorTecnico}"`}</div>
                            </Box>
                            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography variant="caption" sx={{ display: 'block', color: '#777' }}><strong>Categoría:</strong> {diagnosticoAnalizado.categoria}</Typography>
                                <Typography variant="caption" sx={{ display: 'block', color: '#777' }}><strong>Confianza:</strong> {diagnosticoAnalizado.confianza}</Typography>
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'center', mt: 1 }}>
                        <Tooltip title="Copiar diagnóstico para enviar por WhatsApp u otra vía">
                            <Button size="small" variant="outlined" startIcon={copiado ? <Check /> : <ContentCopy />} onClick={copiarAlPortapapeles} sx={{ color: copiado ? '#4caf50' : '#2C1D11', borderColor: copiado ? '#4caf50' : '#EAE3D9', textTransform: 'none', borderRadius: '8px', flex: 1, fontSize: '11px' }}>
                                {copiado ? 'Copiado' : 'Copiar'}
                            </Button>
                        </Tooltip>
                        <Tooltip title="Descargar Reporte Técnico (.txt)">
                            <Button size="small" variant="outlined" startIcon={<Download />} onClick={descargarReporteTxt} sx={{ color: '#2C1D11', borderColor: '#EAE3D9', textTransform: 'none', borderRadius: '8px', flex: 1, fontSize: '11px' }}>
                                Reporte
                            </Button>
                        </Tooltip>
                    </Box>
                </Box>

                <Box sx={{ flex: 1.4, p: 4, display: 'flex', flexDirection: 'column', bgcolor: '#FFFFFF' }}>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="h5" sx={{ color: '#2C1D11', fontWeight: 'bold' }}>Soporte de Pet Experts</Typography>
                        <Typography variant="body2" sx={{ color: '#777777' }}>Interactúa con Byte para diagnosticar o mitigar la falla de infraestructura.</Typography>
                    </Box>

                    <Box sx={{ flexGrow: 1, bgcolor: '#F9F9FA', borderRadius: '16px', p: 3, height: 350, overflowY: 'auto', mb: 3, display: 'flex', flexDirection: 'column', gap: 2, border: '1px solid #EDEDF0' }}>
                        {conversacion.map((msg, idx) => {
                            const esByte = msg.rol === 'byte';
                            return (
                                <Box key={idx} sx={{ alignSelf: esByte ? 'flex-start' : 'flex-end', maxWidth: '85%' }}>
                                    <Box sx={{ bgcolor: esByte ? '#FFFFFF' : '#b51a4c', color: esByte ? '#2C1D11' : '#FFFFFF', p: 2, borderRadius: esByte ? '16px 16px 16px 4px' : '16px 16px 4px 16px', boxShadow: '0px 2px 8px rgba(0,0,0,0.03)', border: esByte ? '1px solid #EAE3D9' : 'none' }}>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.5, fontSize: '13px' }}>
                                            {formatearTextoMarkdown(msg.texto)}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#999', textAlign: esByte ? 'left' : 'right', fontSize: '10px' }}>{esByte ? "Byte" : "Personal"}</Typography>
                                </Box>
                            );
                        })}
                        {cargandoIA && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#b51a4c', pl: 1 }}>
                                <CircularProgress size={14} color="inherit" />
                                <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#666', fontWeight: '500', fontSize: '11px' }}>Byte está analizando la traza del error...</Typography>
                            </Box>
                        )}
                        <div ref={chatEndRef} />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
                        <TextField variant="outlined" size="small" fullWidth placeholder="Escribe tu consulta o dile 'avisa al técnico'..." value={mensajeUsuario} onChange={(e) => setMensajeUsuario(e.target.value)} onKeyDown={manejarKeyPress} disabled={cargandoIA} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F9F9FA' } }} />
                        <Button variant="contained" onClick={enviarMensaje} disabled={cargandoIA} sx={{ bgcolor: '#b51a4c', borderRadius: '12px', px: 3, '&:hover': { bgcolor: '#871035' } }}><Send /></Button>
                    </Box>
                    <Button variant="outlined" startIcon={<Refresh />} onClick={alReintentar} sx={{ color: '#b51a4c', borderColor: '#b51a4c', borderRadius: '12px', py: 1, '&:hover': { borderColor: '#871035', bgcolor: 'rgba(181, 26, 76, 0.04)' } }}>Reintentar Conexión con Servidor</Button>
                </Box>
            </Paper>
        </Box>
    );
}