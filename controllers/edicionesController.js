const { query } = require('../utils/db');

const getEdiciones = async (req, res) => {
    try {
        const result = await query(
            `SELECT
                e.id_edicion,
                e.nombre,
                CONCAT(e.nombre, ' ', e.temporada) AS nombre_temporada,
                e.temporada,
                CONCAT(
                    IFNULL((SELECT COUNT(*) FROM partidos p WHERE p.id_edicion = e.id_edicion AND p.estado = 'F'), 0),
                    ' / ',
                    IFNULL((SELECT COUNT(*) FROM partidos p WHERE p.id_edicion = e.id_edicion), 0)
                ) AS partidos,
                IFNULL((SELECT COUNT(*) FROM planteles pl WHERE pl.id_edicion = e.id_edicion), 0) AS jugadores,
                IFNULL((SELECT COUNT(*) FROM temporadas t WHERE t.id_edicion = e.id_edicion), 0) AS equipos,
                IFNULL((SELECT COUNT(*) FROM categorias c WHERE c.id_edicion = e.id_edicion), 0) AS categorias,
                CASE
                    WHEN (SELECT COUNT(*) FROM partidos p WHERE p.id_edicion = e.id_edicion AND p.estado = 'F') = 0 THEN 'SIN EMPEZAR'
                    WHEN (SELECT COUNT(*) FROM partidos p WHERE p.id_edicion = e.id_edicion AND p.estado = 'F') > 0 THEN 'JUGANDO'
                    ELSE 'SIN EMPEZAR'
                END AS estado,
                e.cantidad_eventuales,
                e.partidos_eventuales,
                e.apercibimientos,
                e.puntos_descuento
            FROM 
                ediciones e
            ORDER BY
                e.temporada DESC, e.id_edicion DESC;`,
            (err, result) => {
            if (err) return res.status(500).send('Error interno del servidor');
            res.send(result);
        });
        res.send(result);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor' });
        console.error(error);
    }
};

const crearEdicion = async (req, res) => {
    const { nombre, temporada, cantidad_eventuales, partidos_eventuales, apercibimientos, puntos_descuento } = req.body;
    try {
        await query(
            `INSERT INTO 
            ediciones(id_torneo, nombre, temporada, cantidad_eventuales, partidos_eventuales, apercibimientos, puntos_descuento) 
            VALUES (1, ?, ?, ?, ?, ?, ?)`,
            [nombre, temporada, cantidad_eventuales, partidos_eventuales, apercibimientos, puntos_descuento]
        );
        res.send('Edición registrada con éxito');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
};

const actualizarEdicion = async (req, res) => {
    const { nombre, temporada, cantidad_eventuales, partidos_eventuales, apercibimientos, puntos_descuento, id_edicion } = req.body;
    
    if (!id_edicion) {
        return res.status(400).send('ID de edición es requerido');
    }

    try {
        await query(
            `
            UPDATE ediciones
            SET 
                nombre = ?, 
                temporada = ?, 
                cantidad_eventuales = ?, 
                partidos_eventuales = ?, 
                apercibimientos = ?,
                puntos_descuento = ?
            WHERE id_edicion = ?
            `,
            [nombre, temporada, cantidad_eventuales, partidos_eventuales, apercibimientos, puntos_descuento, id_edicion]
        );
        res.send('Edición actualizada exitosamente');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
};

const eliminarEdicion = async (req, res) => {
    const { id } = req.body;

    try {
        await query(
            'DELETE FROM ediciones WHERE id_edicion = ?',
            [id]
        );
        res.status(200).send('Edición eliminada correctamente');
    } catch (error) {
        console.error('Error eliminando la edición:', error);
        res.status(500).send('Error eliminando la edición');
    }
};

module.exports = {
    getEdiciones,
    crearEdicion,
    actualizarEdicion,
    eliminarEdicion
};