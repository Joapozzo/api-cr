const bcryptjs = require('bcryptjs');
const { query } = require('../utils/db');
const mailer = require('../utils/mailer');

const editarPerfil = async (req, res) => {
    try {
        const { id_usuario, dni, nombre, apellido, fechaNacimiento, telefono, email, clave } = req.body;

        // Verificar si el usuario existe
        const result = await query('SELECT * FROM usuarios WHERE dni = ?', [dni]);
        if (result.length === 0) return res.status(401).send('Usuario no encontrado');
        
        const user = result[0];
        console.log(user);

        // Preparar campos a actualizar
        let camposActualizados = {};

        if (dni && dni !== user.dni) {
            camposActualizados.dni = dni;
        }

        if (nombre && nombre !== user.nombre) {
            camposActualizados.nombre = nombre;
        }

        if (apellido && apellido !== user.apellido) {
            camposActualizados.apellido = apellido;
        }

        if (fechaNacimiento && fechaNacimiento !== user.nacimiento) {
            camposActualizados.nacimiento = fechaNacimiento;
        }

        if (telefono && telefono !== user.telefono) {
            camposActualizados.telefono = telefono;
        }

        // Manejo de la clave
        if (clave) {
            const isMatch = await bcryptjs.compare(clave, user.clave);
            if (!isMatch) {
                const salt = await bcryptjs.genSalt(10);
                const hashedPassword = await bcryptjs.hash(clave, salt);
                camposActualizados.clave = hashedPassword;
            }
        }

        // Manejo del email
        if (email && email !== user.email) {
            await mailer.sendVerificationChangeEmail(email, dni, nombre);
            camposActualizados.email = email;
            camposActualizados.estado = 'P';
        }

        if (Object.keys(camposActualizados).length === 0) {
            return res.status(200).send("No se realizaron cambios, los datos son iguales");
        }

        camposActualizados.fecha_actualizacion = new Date();

        // Construir query dinámica
        let updateQuery = 'UPDATE usuarios SET ';
        let queryParams = [];

        for (const [key, value] of Object.entries(camposActualizados)) {
            updateQuery += `${key} = ?, `;
            queryParams.push(value);
        }

        updateQuery = updateQuery.slice(0, -2) + ' WHERE id_usuario = ?';
        queryParams.push(id_usuario);

        const updateResult = await query(updateQuery, queryParams);

        if (updateResult.affectedRows === 0) {
            return res.status(400).send("No se pudo actualizar el perfil");
        }

        res.status(200).send("Perfil actualizado exitosamente");

    } catch (error) {
        console.error("Error al actualizar el perfil:", error);
        res.status(500).send("Error interno del servidor");
    }
};

// const getNovedades = async (req, res) => {
//     const { id_rol } = req.query;
//     try {
//         if (!id_rol) {
//             return res.status(400).send('Falta el id del rol');
//         }
//         const result = await query('SELECT * FROM novedades WHERE id_rol = ?', [id_rol]);
//     } catch (error) {
        
//     }
//     db.query('SELECT * FROM novedades WHERE id_rol = ?', [id_rol], (err, result) => {
//         if (err) {
//             return res.status(400).send(err.sqlMessage);
//         }

//         if (result.length === 0) {
//             return res.status(500).send('No hay novedades para ese rol')
//         }
//         res.status(200).json(result)
//     })
// }

module.exports = {
    editarPerfil,
    // getNovedades
};
