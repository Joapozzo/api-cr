const { query } = require('../utils/db');

const getPlanteles = async (req, res) => {
    const { id_equipo, id_categoria } = req.query;

    const sql = `
        SELECT 
            CONCAT(UPPER(j.apellido), ', ', j.nombre) AS jugador,
            p.id_equipo,
            e.nombre AS equipo,
            p.id_categoria,
            c.nombre as nombre_categoria,
            p.id_edicion,
            CONCAT(ed.nombre, ' ', ed.temporada) as edicion,
            p.eventual,
            j.id_jugador, 
            j.dni, 
            j.nombre as nombre_jugador, 
            j.apellido, 
            j.posicion, 
            j.img,
            p.sancionado,
            IFNULL(f.pj, 0) AS pj  -- Columna que muestra los partidos jugados
        FROM 
            planteles p
        INNER JOIN 
            jugadores j ON p.id_jugador = j.id_jugador
        INNER JOIN 
            equipos e ON p.id_equipo = e.id_equipo
        INNER JOIN 
            ediciones ed ON p.id_edicion = ed.id_edicion
        INNER JOIN 
            categorias c ON p.id_categoria = c.id_categoria
        LEFT JOIN 
            (SELECT id_jugador, COUNT(*) AS pj
            FROM formaciones
            GROUP BY id_jugador) f ON j.id_jugador = f.id_jugador
        WHERE 
            (? IS NULL OR p.id_equipo = ?)
            AND (? IS NULL OR p.id_categoria = ?)
        ORDER BY
            j.apellido;
    `;

    try {
        if (!id_equipo && !id_categoria) {
            return res.status(400).send('Faltan parámetros');
        }
        const result = await query(sql, [id_equipo, id_equipo, id_categoria, id_categoria]);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send("Error interno del servidor");
        console.error("Error en la consulta de planteles:", error);
    }
};

module.exports = { getPlanteles };
