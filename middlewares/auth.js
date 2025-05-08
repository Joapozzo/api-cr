const jsonwebtoken = require('jsonwebtoken');
const { query } = require('../utils/db');
const dotenv = require('dotenv');

dotenv.config();

const revisarToken = async (req, res, next) => {
    try {
        // Obtener el token del encabezado
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ mensaje: 'Usuario no autenticado' });
        }

        // Verificar el formato del encabezado
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(400).json({ mensaje: 'Token no proporcionado' });
        }

        const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);

        // Buscar usuario en la base de datos
        const result = await query('SELECT * FROM usuarios WHERE dni = ?', [decoded.user]);

        if (result.length === 0) {
            return res.status(401).json({ mensaje: 'Usuario no encontrado' });
        }

        req.user = result[0];
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ mensaje: 'El token ha expirado. Por favor, inicia sesión nuevamente.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({ mensaje: 'Token inválido' });
        }
        console.error('Error en revisarToken:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

function revisarAdmin(req, res, next) {
    if (req.user && req.user.id_rol === Number(process.env.ADMIN_ROLE)) {
        next();
    } else {
        res.status(403).json({ mensaje: 'Acceso denegado' });
    }
}

function revisarPlanillero(req, res, next) {
    if (req.user && req.user.id_rol === Number(process.env.PLANILLERO_ROLE)) {
        next();
    } else {
        res.status(403).json({ mensaje: 'Acceso denegado' });
    }
}

module.exports = {
    revisarToken,
    revisarAdmin,
    revisarPlanillero
};
