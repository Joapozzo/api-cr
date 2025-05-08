const bcryptjs = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const { query } = require('../utils/db');
const mailer = require('../utils/mailer');
const { URL_FRONT } = require('../utils/utils');
const dotenv = require('dotenv');

dotenv.config();

const checkEmail = async (req, res) => {
    const { email, bandera } = req.body;

    if (!email) {
        return res.status(400).send('Email no proporcionado');
    }

    try {
        const result = await query('SELECT COUNT(*) AS count FROM usuarios WHERE email = ?', [email]);

        console.log('Resultado de la consulta:', result);

        if (!bandera) {
            // Si bandera es false, verifica si el email ya está registrado
            if (result.length > 0 && result[0].count > 0) {
                return res.status(400).send('El correo electrónico ya está registrado');
            } else {
                return res.status(200).send('El correo electrónico está disponible');
            }
        } else {
            // Si bandera es true, verifica si el email está registrado
            if (result.length > 0 && result[0].count > 0) {
                return res.status(200).send('El correo electrónico está registrado');
            } else {
                return res.status(400).send('Correo electrónico no encontrado en la base de datos');
            }
        }
    } catch (err) {
        console.error('Error en la consulta a la base de datos:', err);
        return res.status(500).send('Error interno del servidor');
    }
};

const checkDni = async (req, res) => {
    const { dni } = req.body;

    try {
        const result = await query('SELECT COUNT(*) AS count FROM usuarios WHERE dni = ?', [dni]);

        if (result[0].count > 0) {
            return res.status(400).send('El DNI ya está registrado');
        }

        res.send('El DNI está disponible');
    } catch (err) {
        console.error('Error en la consulta a la base de datos:', err);
        return res.status(500).send('Error interno del servidor');
    }
};

const crearCuenta = async (req, res) => {
    const { dni, nombre, apellido, fechaNacimiento, telefono, email, clave, rol } = req.body;
    const fecha_creacion = new Date(); // Obtener la fecha actual

    // Verificar que todos los campos requeridos estén presentes
    if (!dni || !nombre || !apellido || !fechaNacimiento || !telefono || !email || !clave || !rol) {
        return res.status(400).send("Faltan datos requeridos");
    }

    try {
        // Generar la sal y el hash de la contraseña
        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(clave, salt);

        // Insertar el nuevo usuario en la base de datos
        await query(
            `INSERT INTO usuarios(dni, nombre, apellido, nacimiento, telefono, email, id_rol, clave, fecha_creacion, fecha_actualizacion, estado) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [dni, nombre, apellido, fechaNacimiento, telefono, email, parseInt(rol), hash, fecha_creacion, null, 'I']
        );

        // Intentar enviar el correo antes de enviar la respuesta
        if (email) {
            try {
                await mailer.sendVerificationEmail(email, dni, nombre);
            } catch (error) {
                console.error('Error al enviar el correo:', error);
                return res.status(500).json({ message: 'Hubo un error en el envío del mail de autenticación' });
            }
        }

        // Responder una vez que todo se ha procesado correctamente
        res.status(200).send("Cuenta creada exitosamente.");
    } catch (err) {
        console.error("Error al crear la cuenta:", err);
        return res.status(500).send("Error interno del servidor");
    }
};

const checkLogin = async (req, res) => {
    const { dni, password } = req.body;

    try {
        // Obtener los datos del usuario desde la base de datos
        const rows = await query('SELECT * FROM usuarios WHERE dni = ?', [dni]);

        if (rows.length === 0) return res.status(400).send('Usuario no encontrado');

        const user = rows[0];

        if (user.id_rol === null) return res.status(401).send('Usuario no autorizado');
        if (user.estado !== 'A') return res.status(403).send('Cuenta no activada');
        if (!bcryptjs.compareSync(password, user.clave)) return res.status(405).send('Contraseña incorrecta');

        // Generar el token de autenticación
        const token = jsonwebtoken.sign({ user: user.dni }, process.env.JWT_SECRET, { expiresIn: '30d' });

        // Crear el objeto de log
        const logEntry = {
            user_id: user.id_usuario,
            action: 'Inicio de sesión',
            timestamp: new Date().toISOString(),
            endpoint: '/auth/check-login',
            request_data: JSON.stringify({ dni }),
            response_status: 200,
        };

        // Registrar el log
        try {
            await query('INSERT INTO logs_auditoria SET ?', logEntry);
        } catch (logErr) {
            console.error('Error al registrar log:', logErr);
        }

        // Enviar la respuesta con el token
        res.status(200).json({ token, id_rol: user.id_rol, id_user: user.id_usuario });
    } catch (err) {
        console.error('Error en el login:', err);
        res.status(500).send('Error interno del servidor');
    }
};

const logout = async (req, res) => {
    try {
        res.status(200).send("Sesión cerrada exitosamente");
    } catch (error) {
        console.error("Error en el logout:", error);
        res.status(500).send("Error interno del servidor");
    }
};

const checkAuthentication = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).send('Usuario no autenticado');

        const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);

        // Realizar la consulta de usuario de manera asíncrona
        const result = await query('SELECT * FROM usuarios WHERE dni = ?', [decoded.user]);
    
        if (result.length === 0) return res.status(401).send('Usuario no encontrado');
        
        const usuario = result[0];
        
        res.status(200).json({ message: "Usuario autenticado", usuario });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).send('Token expirado');
        }
        console.error('Controlador checkAuthentication - error:', error);
        return res.status(500).send('Error interno del servidor');
    }
};

const activarCuenta = async (req, res) => {
    const { dni } = req.query;

    if (!dni) {
        console.log('Falta DNI');
        return res.status(400).send('Falta DNI');
    }

    try {
        const result = await query('UPDATE usuarios SET estado = ? WHERE dni = ?', ['A', dni]);

        console.log(`Resultado de la actualización: ${result.affectedRows}`);

        if (result.affectedRows === 0) {
            console.log('El usuario no existe o ya está activado');
            return res.status(400).send('El usuario no existe o ya está activado');
        }

        console.log('Redirigiendo a login...');
        res.redirect(`${URL_FRONT}/login?activada=true`);
    } catch (err) {
        console.error('Error al actualizar el estado del usuario:', err);
        return res.status(500).send('Error interno del servidor');
    }
};

const activarCambioEmail = async (req, res) => {
    const { dni } = req.query;

    if (!dni) {
        console.log('Falta DNI');
        return res.status(400).send('Falta DNI');
    }

    try {
        const result = await query('UPDATE usuarios SET estado = ? WHERE dni = ?', ['A', dni]);

        console.log(`Resultado de la actualización: ${result.affectedRows}`);

        if (result.affectedRows === 0) {
            console.log('El usuario no existe o ya está activado');
            return res.status(400).send('El usuario no existe o ya está activado');
        }

        res.redirect(`${URL_FRONT}/confirm-email-change`);
    } catch (err) {
        console.error('Error al actualizar el estado del usuario:', err);
        return res.status(500).send('Error interno del servidor');
    }
};

const forgotPasswordHandler = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).send('Falta Email');
    }

    try {
        const result = await query('SELECT dni, email FROM usuarios WHERE email = ?', [email]);

        if (result.length === 0) {
            return res.status(404).send('Email no encontrado');
        }

        const { dni, email: userEmail } = result[0];

        // Generar y almacenar el token de recuperación
        const tokenExpiration = Date.now() + 3 * 60 * 1000; // 3 minutos desde ahora
        const resetToken = jsonwebtoken.sign({ dni }, 'your-secret-key', { expiresIn: '3m' });

        await query('UPDATE usuarios SET reset_token = ?, reset_token_expiration = ? WHERE dni = ?', 
            [resetToken, tokenExpiration, dni]);

        try {
            await mailer.forgotPassword(userEmail, dni);
            return res.status(200).send("Mail de recuperación enviado con éxito");
        } catch (mailError) {
            console.error('Error al enviar el correo:', mailError);
            return res.status(500).json({ message: 'Hubo un error en el envío del mail de recuperación' });
        }

    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        return res.status(500).json({ message: 'Hubo un error en el envío del mail de recuperación' });
    }
};

const changeNewPassword = async (req, res) => {
    const { clave, token } = req.body;

    if (!clave || !token) {
        return res.status(400).send("Clave y token son requeridos");
    }

    try {
        const decoded = jsonwebtoken.verify(token, 'your-secret-key');
        const { dni } = decoded;

        const results = await query('SELECT reset_token_expiration FROM usuarios WHERE dni = ?', [dni]);

        if (results.length === 0) {
            return res.status(404).send("Usuario no encontrado");
        }

        const resetTokenExpiration = results[0].reset_token_expiration;
        const currentTime = Date.now();

        if (currentTime > resetTokenExpiration) {
            return res.status(400).send("El token ha expirado");
        }

        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(clave, salt);

        const [updateResults] = await query('UPDATE usuarios SET clave = ?, reset_token = NULL, reset_token_expiration = NULL WHERE dni = ?', 
            [hash, dni]);

        if (updateResults.affectedRows === 0) {
            return res.status(404).send("Usuario no encontrado");
        }

        res.status(200).send("Contraseña actualizada exitosamente");

    } catch (err) {
        if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
            return res.status(400).send("Token inválido o expirado");
        }
        console.error("Error en changeNewPassword:", err);
        return res.status(500).send("Error interno del servidor");
    }
};

module.exports = {
    checkEmail,
    checkDni,
    crearCuenta,
    checkLogin,
    logout,
    checkAuthentication,
    activarCuenta,
    forgotPasswordHandler,
    changeNewPassword,
    activarCambioEmail
};
