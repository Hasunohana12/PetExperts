import express from 'express';
import pkg from 'pg';
const { Pool } = pkg;
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import { enviarCorreoInstitucional } from './emailService.js';

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
    }
});

const db = new Pool({
    connectionString: "postgresql://neondb_owner:npg_UO7EWDiuS8hg@ep-wispy-salad-aquib4j4-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect((err) => {
    if (err) {
        console.error("Error de conexión con Neon:", err.stack);
    } else {
        console.log("¡Conectado exitosamente al Elefante en la nube (pet_experts)!");
    }
});

io.on('connection', (socket) => {
    console.log(`📱 Dispositivo conectado al sistema de alertas (ID: ${socket.id})`);

    socket.on('enviar-mensaje-chat', (data) => {
        const query = "INSERT INTO mensajes_chat (emisor, nombre, texto, hora) VALUES ($1, $2, $3, $4)";
        db.query(query, [data.emisor, data.nombre, data.texto, data.hora], (err, result) => {
            if (err) {
                console.error("Error al guardar mensaje de chat:", err);
                return;
            }
            console.log(`Mensaje guardado de ${data.nombre}`);
            io.emit('recibir-mensaje-chat', data);
        });
    });
});
app.post('/verificar', (req, res) => {
    const { usuario, contrasena } = req.body;
    const query = "SELECT id_usuario, nombre_completo, rol FROM usuarios WHERE usuario = $1 AND contrasena = $2";

    db.query(query, [usuario, contrasena], (err, result) => {
        if (err) return res.status(500).send({ message: "Error en el servidor" });

        if (result.rows.length > 0) {
            res.send(result.rows[0]);
        } else {
            res.status(401).send({ message: "Usuario o contraseña incorrectos" });
        }
    });
});

app.post('/registrar', (req, res) => {
    const { nombre, usuario, contrasena, rol } = req.body;
    const query = "INSERT INTO usuarios (nombre_completo, usuario, contrasena, rol) VALUES ($1, $2, $3, $4)";

    db.query(query, [nombre, usuario, contrasena, rol], (err, result) => {
        if (err) return res.status(500).send({ message: "Error al registrar" });
        res.send({ message: "Usuario registrado con éxito" });
    });
});

app.post('/agregar-turno', (req, res) => {
    const { mascota, raza, especie, dueno, telefono, email, fecha, hora, motivo } = req.body;

    const queryDueno = "INSERT INTO duenos (nombre, telefono, email) VALUES ($1, $2, $3) RETURNING id_dueno";

    db.query(queryDueno, [dueno, telefono, email || null], (err, resultDueno) => {
        if (err) {
            console.error("Error al registrar el dueño:", err);
            return res.status(500).send({ message: "Error al registrar el dueño" });
        }

        const idDuenoGenerado = resultDueno.rows[0].id_dueno;
        const queryMascota = "INSERT INTO mascotas (nombre_mascota, especie, raza, id_dueno) VALUES ($1, $2, $3, $4) RETURNING id_mascota";

        db.query(queryMascota, [mascota, especie, raza, idDuenoGenerado], (err, resultMascota) => {
            if (err) {
                console.error("Error al registrar la mascota:", err);
                return res.status(500).send({ message: "Error al registrar la mascota" });
            }

            const idMascotaGenerada = resultMascota.rows[0].id_mascota;
            const queryTurno = "INSERT INTO turnos (fecha, hora, motivo, id_mascota, estado) VALUES ($1, $2, $3, $4, 'pendiente')";

            db.query(queryTurno, [fecha, hora, motivo, idMascotaGenerada], (err, resultTurno) => {
                if (err) {
                    console.error("Error al agendar el turno:", err);
                    return res.status(500).send({ message: "Error al agendar el turno" });
                }

                io.emit('notificar-nuevo-turno', {
                    mensaje: `¡Nuevo turno registrado!`,
                    mascota: mascota,
                    motivo: motivo,
                    hora: hora
                });

                res.send({ success: true, message: "Turno agendado :D" });
            });
        });
    });
});

app.get('/obtener-turnos', (req, res) => {
    const query = `
        SELECT 
            t.id_turno, t.fecha, t.hora, t.motivo, t.estado,
            m.id_mascota, m.nombre_mascota AS mascota, m.raza, m.especie,
            d.id_dueno, d.nombre AS dueno
        FROM turnos t
        INNER JOIN mascotas m ON t.id_mascota = m.id_mascota
        INNER JOIN duenos d ON m.id_dueno = d.id_dueno
        WHERE t.estado = 'pendiente'
        ORDER BY t.fecha ASC, t.hora ASC
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ message: "Error al traer los turnos con relaciones" });
        }
        res.send(result.rows);
    });
});

app.get('/obtener-historial', (req, res) => {
    const query = `
        SELECT 
            t.id_turno, t.fecha, t.hora, t.motivo, t.estado,
            m.id_mascota, m.nombre_mascota AS mascota, m.raza, m.especie,
            d.id_dueno, d.nombre AS dueno
        FROM turnos t
        INNER JOIN mascotas m ON t.id_mascota = m.id_mascota
        INNER JOIN duenos d ON m.id_dueno = d.id_dueno
        WHERE t.estado = 'atendido' OR t.estado = 'no asistio' 
        ORDER BY t.fecha DESC, t.hora DESC
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error("Error al obtener el historial:", err);
            return res.status(500).send({ message: "Error al traer el historial" });
        }
        res.send(result.rows);
    });
});

app.get('/obtener-chat', (req, res) => {
    const query = `
        SELECT emisor, nombre, texto, hora 
        FROM mensajes_chat 
        ORDER BY fecha_registro ASC 
        LIMIT 50
    `;
    db.query(query, (err, result) => {
        if (err) {
            console.error("Error al obtener el chat:", err);
            return res.status(500).send({ message: "Error al traer el historial del chat" });
        }
        res.send(result.rows);
    });
});

app.put('/vencer-turnos', (req, res) => {
    const { ids } = req.body;
    if (!ids || ids.length === 0) return res.json({ success: true, message: "Nada que actualizar" });

    const sql = "UPDATE turnos SET estado = 'no asistio' WHERE id_turno = ANY($1)";
    db.query(sql, [ids], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Turnos viejos marcados como 'no asistió'" });
    });
});

app.get('/api/turnos-calendario', (req, res) => {
    const { anio, mes } = req.query;

    const query = `
        SELECT 
            t.id_turno, t.fecha, t.hora, t.motivo, t.estado,
            m.id_mascota, m.nombre_mascota, m.especie, m.raza, 
            d.id_dueno, d.nombre AS nombre_dueno
        FROM turnos t
        LEFT JOIN mascotas m ON t.id_mascota = m.id_mascota
        LEFT JOIN duenos d ON m.id_dueno = d.id_dueno
        WHERE EXTRACT(YEAR FROM t.fecha) = $1 AND EXTRACT(MONTH FROM t.fecha) = $2 AND t.estado = 'pendiente'
        ORDER BY t.hora ASC
    `;

    db.query(query, [anio, mes], (err, results) => {
        if (err) {
            console.error("Error al obtener turnos del calendario:", err);
            return res.status(500).json({ error: "Error en la base de datos" });
        }
        res.json(results.rows);
    });
});

app.put('/atender-turno/:id', (req, res) => {
    const { id } = req.params;
    const sql = "UPDATE turnos SET estado = 'atendido' WHERE id_turno = $1";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "Turno marcado como atendido" });
    });
});

app.delete('/eliminar-turno/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM turnos WHERE id_turno = $1";

    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Error al borrar el registro" });
        res.json({ success: true, message: "Turno eliminado de la agenda" });
    });
});

app.put('/editar-turno/:id', (req, res) => {
    const { id } = req.params;
    const { mascota, especie, raza, dueno, fecha, hora, motivo } = req.body;

    const queryBuscarRelaciones = `
        SELECT t.id_mascota, m.id_dueno 
        FROM turnos t
        INNER JOIN mascotas m ON t.id_mascota = m.id_mascota
        WHERE t.id_turno = $1
    `;

    db.query(queryBuscarRelaciones, [id], (err, result) => {
        if (err || result.rows.length === 0) {
            return res.status(500).json({ success: false, message: "No se encontraron las relaciones del turno" });
        }

        const { id_mascota, id_dueno } = result.rows[0];

        const sqlDueno = "UPDATE duenos SET nombre = $1 WHERE id_dueno = $2";
        db.query(sqlDueno, [dueno, id_dueno], (err) => {
            if (err) return res.status(500).json({ success: false, message: "Error al actualizar dueño" });

            const sqlMascota = "UPDATE mascotas SET nombre_mascota = $1, especie = $2, raza = $3 WHERE id_mascota = $4";
            db.query(sqlMascota, [mascota, especie, raza, id_mascota], (err) => {
                if (err) return res.status(500).json({ success: false, message: "Error al actualizar mascota" });

                const sqlTurno = "UPDATE turnos SET fecha = $1, hora = $2, motivo = $3 WHERE id_turno = $4";
                db.query(sqlTurno, [fecha, hora, motivo, id], (err) => {
                    if (err) return res.status(500).json({ success: false, message: "Error al actualizar los datos del turno" });

                    res.json({ success: true, message: "Todo el bloque fue editado con éxito" });
                });
            });
        });
    });
});

app.post('/api/recepcion/enviar-recordatorios', (req, res) => {
    const query = `
        SELECT 
            t.fecha, t.hora, t.motivo,
            m.nombre_mascota AS mascota,
            d.nombre AS dueno, d.email AS email_dueno
        FROM turnos t
        INNER JOIN mascotas m ON t.id_mascota = m.id_mascota
        INNER JOIN duenos d ON m.id_dueno = d.id_dueno
        WHERE t.fecha >= CURRENT_DATE + INTERVAL '1 day' 
          AND t.fecha <= CURRENT_DATE + INTERVAL '2 days'
          AND t.estado = 'pendiente'
          AND d.email IS NOT NULL AND d.email <> '';
    `;

    db.query(query, async (err, result) => {
        if (err) {
            console.error("Error al buscar turnos para recordatorio:", err);
            return res.status(500).send({ message: "Error al procesar la base de datos" });
        }

        const turnos = result.rows;
        if (turnos.length === 0) {
            return res.send({ success: true, message: "No hay turnos programados para dentro de 48hs." });
        }

        let enviadosCount = 0;

        for (const turno of turnos) {
            const fechaFormateada = new Date(turno.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' });

            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #b51a4c; text-align: center;">Recordatorio de Turno en la clínica Pet Experts</h2>
                    <p>Hola <strong>${turno.dueno}</strong>,</p>
                    <p>Te recordamos que tenés un turno programado para tu mascota <strong>${turno.mascota}</strong> en nuestra clínica.</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-left: 5px solid #b51a4c; margin: 20px 0;">
                        <p style="margin: 5px 0;"> <strong>Fecha:</strong> ${fechaFormateada}</p>
                        <p style="margin: 5px 0;"> <strong>Hora:</strong> ${turno.hora.substring(0, 5)} hs</p>
                        <p style="margin: 5px 0;"> <strong>Motivo:</strong> ${turno.motivo || 'Consulta general'}</p>
                    </div>
                    <p style="font-size: 0.9em; color: #555;">Si no podés asistir, por favor avisanos con anticipación respondiendo a este correo.</p>
                    <p style="text-align: center; margin-top: 30px; font-weight: bold; color: #b51a4c;">¡Los esperamos!</p>
                </div>
            `;

            const emailResultado = await enviarCorreoInstitucional({
                to: turno.email_dueno,
                subject: `Recordatorio de Turno para ${turno.mascota} - Pet Experts`,
                html: htmlContent
            });

            if (emailResultado.success) enviadosCount++;
        }

        res.send({ success: true, message: `Se enviaron ${enviadosCount} recordatorios con éxito.` });
    });
});

app.post('/api/medico/enviar-estudio', upload.single('placa'), (req, res) => {
    const { id_mascota, id_usuario, titulo_estudio, mensaje } = req.body;
    const archivo = req.file; 

    if (!archivo) {
        return res.status(400).send({ message: "No se subió ninguna imagen o placa médica" });
    }

    const queryInfo = `
        SELECT m.nombre_mascota, d.nombre AS dueno, d.email
        FROM mascotas m
        INNER JOIN duenos d ON m.id_dueno = d.id_dueno
        WHERE m.id_mascota = $1
    `;

    db.query(queryInfo, [id_mascota], async (err, resultInfo) => {
        if (err || resultInfo.rows.length === 0) {
            console.error("Error al buscar datos de la mascota/dueño:", err);
            return res.status(500).send({ message: "Error al identificar el paciente" });
        }

        const infoPaciente = resultInfo.rows[0];

        if (!infoPaciente.email) {
            return res.status(400).send({ message: "El dueño de la mascota no tiene cargado un correo electrónico." });
        }

        const queryGuardarEstudio = `
            INSERT INTO estudios_mascotas (id_mascota, id_usuario, titulo_estudio, ruta_archivo)
            VALUES ($1, $2, $3, $4)
        `;

        db.query(queryGuardarEstudio, [id_mascota, id_usuario, titulo_estudio, archivo.originalname], async (err, resultGuardar) => {
            if (err) {
                console.error("Error al registrar el estudio en la BD:", err);
                return res.status(500).send({ message: "Error al guardar el estudio en el historial" });
            }

            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #b51a4c; text-align: center;">Estudios Médicos Adjuntos - Pet Experts</h2>
                    <p>Hola <strong>${infoPaciente.dueno}</strong>,</p>
                    <p>El médico veterinario ha cargado un nuevo estudio clínico para tu mascota <strong>${infoPaciente.nombre_mascota}</strong>.</p>
                    <div style="background-color: #f1f1f1; padding: 15px; border-radius: 4px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Estudio realizado:</strong> ${titulo_estudio}</p>
                        <p style="margin: 5px 0;"> <strong>Indicaciones del Profesional:</strong> ${mensaje || 'Sin comentarios adicionales.'}</p>
                    </div>
                    <p>Adjunto a este correo encontrarás el archivo correspondiente al estudio clínico para que puedas descargarlo.</p>
                    <p style="font-size: 0.85em; color: #777; text-align: center; margin-top: 30px;">Este es un mensaje automático de Pet Experts.</p>
                </div>
            `;

            try {
                const emailResultado = await enviarCorreoInstitucional({
                    to: infoPaciente.email,
                    subject: `Estudios Clínicos de ${infoPaciente.nombre_mascota} (${titulo_estudio})`,
                    html: htmlContent,
                    attachments: [
                        {
                            filename: archivo.originalname,
                            content: archivo.buffer 
                        }
                    ]
                });

                if (emailResultado && emailResultado.success) {
                    return res.send({ 
                        success: true, 
                        message: "Estudio guardado en el historial y enviado al dueño con éxito" 
                    });
                } else {
                    console.error("Detalle del fallo en SMTP enviado desde el servicio:", emailResultado.error);
                    return res.status(500).send({ 
                        message: "El estudio se guardó en el historial pero falló el envío del correo electrónico.",
                        error: emailResultado.error 
                    });
                }

            } catch (emailError) {
                console.error("Error crítico inesperado en el flujo del endpoint:", emailError);
                return res.status(500).send({ 
                    message: "Error de red o caída inesperada al procesar el envío SMTP." 
                });
            }
        });
    });
});
app.get('/api/medico/pacientes-con-email', (req, res) => {
    const query = `
        SELECT 
            m.id_mascota, 
            m.nombre_mascota AS mascota, 
            d.nombre AS dueno, 
            d.email
        FROM mascotas m
        INNER JOIN duenos d ON m.id_dueno = d.id_dueno
        WHERE d.email IS NOT NULL AND d.email <> ''
        ORDER BY m.nombre_mascota ASC
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error("Error al obtener pacientes con email:", err);
            return res.status(500).send({ message: "Error al traer los pacientes" });
        }
        res.send(result.rows);
    });
});

httpServer.listen(3001, () => {
    console.log("Servidor corriendo en el puerto 3001 con WebSockets activos");
});