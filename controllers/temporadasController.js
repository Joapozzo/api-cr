const { query: dbQuery } = require('../utils/db');

const getPosicionesTemporada = async (req, res) => {
    const { id_zona } = req.query;

    try {
        const [result] = await dbQuery('CALL sp_posiciones_zona(?)', [id_zona]);

        if (!result || result.length === 0) {
            return res.status(404).send("No se encontraron incidencias para el partido especificado.");
        }

        res.status(200).json(result);
    } catch (err) {
        console.error("Error al ejecutar el procedimiento almacenado:", err);
        if (err.sqlState === '45000') {
            return res.status(400).send(err.sqlMessage);
        }
        res.status(500).send("Error interno del servidor");
    }
};

const getEstadisticasCategoria = async (req, res) => {
    const { id_categoria, estadistica } = req.query;

    try {
        const [result] = await dbQuery('CALL sp_estadisticas_categoria(?, ?)', [id_categoria, estadistica]);

        if (!result || result.length === 0) {
            return res.status(404).send("No se encontraron goleadores para la temporada especificada.");
        }

        res.status(200).json(result);
    } catch (err) {
        console.error("Error al ejecutar el procedimiento almacenado:", err);
        if (err.sqlState === '45000') {
            return res.status(400).send(err.sqlMessage);
        }
        res.status(500).send("Error interno del servidor");
    }
};

const getZonas = async (req, res) => {
    const { id_categoria } = req.query;
    let sql;
    let params = [];

    if (id_categoria) {
        sql = `
            SELECT
                z.id_zona,
                c.id_categoria,
                CONCAT(e.nombre, ' ', e.temporada) AS nombre_edicion,
                c.nombre AS nombre_categoria,
                z.nombre AS nombre_zona,
                c.genero AS genero,
                z.tipo_zona,
                z.cantidad_equipos,
                z.fase,
                z.id_etapa,
                z.campeon,
                z.id_equipo_campeon,
                z.terminada,
                CONCAT(z.nombre, ' - ', et.nombre) AS nombre_zona_etapa,
                et.nombre AS nombre_etapa
            FROM
                categorias AS c
                INNER JOIN ediciones AS e ON e.id_edicion = c.id_edicion
                INNER JOIN zonas AS z ON z.id_categoria = c.id_categoria
                INNER JOIN etapas AS et ON et.id_etapa = z.id_etapa
            WHERE
                c.id_categoria = ?
            ORDER BY 3;
        `;
        params = [id_categoria];
    } else {
        sql = `
            SELECT
                z.id_zona,
                c.id_categoria,
                CONCAT(e.nombre, ' ', e.temporada) AS nombre_edicion,
                c.nombre AS nombre_categoria,
                z.nombre AS nombre_zona,
                c.genero AS genero,
                z.tipo_zona,
                z.cantidad_equipos,
                z.fase,
                z.id_etapa,
                z.campeon,
                z.id_equipo_campeon,
                z.terminada,
                CONCAT(z.nombre, ' - ', et.nombre) AS nombre_zona_etapa,
                et.nombre AS nombre_etapa
            FROM
                categorias AS c
                INNER JOIN ediciones AS e ON e.id_edicion = c.id_edicion
                INNER JOIN zonas AS z ON z.id_categoria = c.id_categoria
                INNER JOIN etapas AS et ON et.id_etapa = z.id_etapa
            ORDER BY 3;
        `;
    }

    try {
        const result = await dbQuery(sql, params);
        res.status(200).json(result);
    } catch (err) {
        console.error("Error en la consulta:", err);
        res.status(500).send('Error interno del servidor');
    }
};

const getTemporadas = async (req, res) => {
    const { idsCategorias: id_categoria } = req.query;
    let sql;
    let values = [];

    if (!id_categoria) {
        sql = `
            SELECT
                t.id_zona,
                z.tipo_zona,
                t.id_edicion,
                t.id_categoria,
                t.id_equipo,
                e.nombre AS nombre_equipo,
                t.vacante,
                t.apercibimientos,
                t.pos_zona_previa,
                t.id_zona_previa,
                (SELECT COUNT(*)
                 FROM planteles p
                 INNER JOIN jugadores j ON p.id_jugador = j.id_jugador
                 WHERE p.id_equipo = t.id_equipo AND t.id_categoria = p.id_categoria
                 AND j.dni IS NOT NULL
                 AND p.eventual = 'N') AS jugadores_con_dni,
                (SELECT COUNT(*)
                 FROM planteles p
                 INNER JOIN jugadores j ON p.id_jugador = j.id_jugador
                 WHERE p.id_equipo = t.id_equipo AND t.id_categoria = p.id_categoria
                 AND j.dni IS NULL
                 AND p.eventual = 'N') AS jugadores_sin_dni
            FROM 
                temporadas t
                LEFT JOIN equipos e ON e.id_equipo = t.id_equipo
                LEFT JOIN zonas z ON z.id_zona = t.id_zona
            ORDER BY e.nombre ASC;
        `;
    } else {
        const categoriasArray = id_categoria.split(',').map(id => parseInt(id.trim()));
        const placeholders = categoriasArray.map(() => '?').join(',');
        values = categoriasArray;

        sql = `
            SELECT
                t.id_zona,
                z.tipo_zona,
                t.id_edicion,
                t.id_categoria,
                t.id_equipo,
                e.nombre AS nombre_equipo,
                t.vacante,
                t.apercibimientos,
                t.pos_zona_previa,
                t.id_zona_previa,
                (SELECT COUNT(*)
                 FROM planteles p
                 INNER JOIN jugadores j ON p.id_jugador = j.id_jugador
                 WHERE p.id_equipo = t.id_equipo AND p.id_categoria = t.id_categoria
                 AND j.dni IS NOT NULL
                 AND p.eventual = 'N') AS jugadores_con_dni,
                (SELECT COUNT(*)
                 FROM planteles p
                 INNER JOIN jugadores j ON p.id_jugador = j.id_jugador
                 WHERE p.id_equipo = t.id_equipo AND p.id_categoria = t.id_categoria
                 AND j.dni IS NULL
                 AND p.eventual = 'N') AS jugadores_sin_dni
            FROM 
                temporadas t
                LEFT JOIN equipos e ON e.id_equipo = t.id_equipo
                LEFT JOIN zonas z ON z.id_zona = t.id_zona
            WHERE t.id_categoria IN (${placeholders})
            ORDER BY e.nombre ASC;
        `;
    }

    try {
        const result = await dbQuery(sql, values);
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error interno del servidor');
    }
};

const insertarEquipoTemporada = async (req, res) => {
    const { id_categoria, id_edicion, id_zona, id_equipo, vacante, id_partido } = req.body;

    try {
        const zonaResult = await dbQuery('SELECT tipo_zona FROM zonas WHERE id_zona = ?', [id_zona]);

        if (!zonaResult) {
            return res.status(404).json({ mensaje: 'Zona no encontrada' });
        }

        const tipoZona = zonaResult.tipo_zona;

        await dbQuery(`
            UPDATE temporadas 
            SET id_equipo = ?
            WHERE id_categoria = ? AND id_edicion = ? AND vacante = ? AND id_zona = ?
        `, [id_equipo, id_categoria, id_edicion, vacante, id_zona]);

        if (tipoZona === 'eliminacion-directa' || tipoZona === 'eliminacion-directa-ida-vuelta') {
            await dbQuery('CALL sp_agregar_vacante_zona(?, ?, ?, ?)', [id_zona, id_equipo, vacante, id_partido]);
            return res.status(200).json({ mensaje: 'Edición registrada o actualizada con éxito, y procedimiento ejecutado' });
        } else {
            return res.status(200).json({ mensaje: 'Edición registrada o actualizada con éxito' });
        }

    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const insertarEquipoTemporadaCategoria = async (req, res) => {
    const { id_categoria, id_edicion, id_equipo } = req.body;

    try {
        await dbQuery(`
            INSERT INTO temporadas (id_categoria, id_edicion, id_zona, id_equipo, vacante)
            VALUES (?, ?, NULL, ?, NULL)
        `, [id_categoria, id_edicion, id_equipo]);

        res.status(200).json({ mensaje: 'Registro insertado en categorias con éxito' });
    } catch (err) {
        console.error("Error al insertar en categorias:", err);
        res.status(500).json({ mensaje: 'Error interno al insertar en categorias' });
    }
};

const eliminarEquipoTemporada = async (req, res) => {
    const { id_equipo, id_categoria, id_edicion } = req.body;

    try {
        await dbQuery('UPDATE temporadas SET id_equipo = NULL WHERE id_equipo = ? AND id_categoria = ? AND id_edicion = ?', [id_equipo, id_categoria, id_edicion]);
        res.status(200).send('Edición eliminada correctamente');
    } catch (err) {
        console.error('Error eliminando la edición:', err);
        res.status(500).send('Error interno del servidor');
    }
};

const determinarVentaja = async (req, res) => {
    const { id_zona, vacante } = req.body;

    try {
        const result = await dbQuery(`
            SELECT t.ventaja
            FROM temporadas t
            JOIN zonas z ON t.id_zona = z.id_zona
            WHERE t.id_zona = ? AND t.vacante = ? AND z.tipo_zona = 'eliminacion-directa'
        `, [id_zona, vacante]);

        res.status(200).json(result);
    } catch (err) {
        console.error('Error al obtener la ventaja:', err);
        res.status(500).send('Error interno del servidor');
    }
};

module.exports = {
    getPosicionesTemporada,
    getEstadisticasCategoria,
    getZonas,
    getTemporadas,
    insertarEquipoTemporada,
    eliminarEquipoTemporada,
    insertarEquipoTemporadaCategoria,
    determinarVentaja
};
