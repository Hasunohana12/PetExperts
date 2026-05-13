import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: '',      
    database: 'pet_experts'
});

db.connect((err) => {
    if (err) {
        console.log("Error de conexión:", err);
    } else {
        console.log("Conectado a la base de datos pet_experts");
    }
});

app.post('/verificar', (req, res) => {
    const { usuario, contrasena } = req.body;
    const query = "SELECT id_usuario, nombre_completo, rol FROM usuarios WHERE usuario = ? AND contrasena = ?";
    
    db.query(query, [usuario, contrasena], (err, result) => {
        if (err) return res.status(500).send({ message: "Error en el servidor" });
        
        if (result.length > 0) {
            res.send(result[0]); 
        } else {
            res.status(401).send({ message: "Usuario o contraseña incorrectos" });
        }
    });
});

app.post('/registrar', (req, res) => {
    const { nombre, usuario, contrasena, rol } = req.body;
    const query = "INSERT INTO usuarios (nombre_completo, usuario, contrasena, rol) VALUES (?, ?, ?, ?)";
    
    db.query(query, [nombre, usuario, contrasena, rol], (err, result) => {
        if (err) return res.status(500).send({ message: "Error al registrar" });
        res.send({ message: "Usuario registrado con éxito" });
    });
});

app.listen(3001, () => {
    console.log("Servidor corriendo en el puerto 3001");
});