const { query } = require('../utils/db');
const { esPartidoVuelta } = require('./helpers/partidosHelpers');

const getPartidos = async (req, res) => {
    const { id_categoria } = req.query;
    let sql;
    let params = [];

    if (id_categoria) {
        sql = `
            SELECT
                p.id_edicion,
                p.id_zona,
                p.id_categoria,
                p.id_partido,
                DAY(p.dia) AS dia_numero,
                MONTH(p.dia) AS mes,
                YEAR(p.dia) AS año,
                CASE
                    WHEN DAYNAME(p.dia) = 'Monday' THEN 'Lunes'
                    WHEN DAYNAME(p.dia) = 'Tuesday' THEN 'Martes'
                    WHEN DAYNAME(p.dia) = 'Wednesday' THEN 'Miércoles'
                    WHEN DAYNAME(p.dia) = 'Thursday' THEN 'Jueves'
                    WHEN DAYNAME(p.dia) = 'Friday' THEN 'Viernes'
                    WHEN DAYNAME(p.dia) = 'Saturday' THEN 'Sábado'
                    WHEN DAYNAME(p.dia) = 'Sunday' THEN 'Domingo'
                END AS dia_nombre,
                p.id_equipoLocal,
                p.id_equipoVisita,
                p.estado,
                p.jornada,
                p.dia,
                p.hora,
                p.goles_local,
                p.goles_visita,
                p.pen_local,
                p.pen_visita,
                p.cancha,
                p.arbitro,
                p.destacado,
                p.descripcion,
                p.id_planillero,
                j.id_jugador AS jugador_destacado,
                c.nombre AS nombre_categoria,
                CONCAT(u.nombre, ' ', u.apellido) AS planillero,
                CONCAT(e.nombre, ' ', e.temporada) AS nombre_edicion,
                p.vacante_local,
                p.vacante_visita,
                p.id_partido_previo_local,
                p.id_partido_previo_visita,
                p.res_partido_previo_local,
                p.res_partido_previo_visita,
                p.id_partido_posterior_ganador,
                p.id_partido_posterior_perdedor,
                p.interzonal,
                p.ventaja_deportiva,
                ida,
                vuelta
            FROM
                partidos p
            LEFT JOIN
                equipos e1 ON p.id_equipoLocal = e1.id_equipo
            LEFT JOIN
                equipos e2 ON p.id_equipoVisita = e2.id_equipo
            LEFT JOIN
                usuarios u ON p.id_planillero = u.id_usuario
            LEFT JOIN
                jugadores j ON p.id_jugador_destacado = j.id_jugador
            LEFT JOIN
                categorias c ON p.id_categoria = c.id_categoria
            LEFT JOIN
                ediciones e ON p.id_edicion = e.id_edicion
            WHERE 
                p.id_categoria = ?
            ORDER BY 
                p.dia;
        `;
        params = [id_categoria];
    } else {
        sql = `
            SELECT
                p.id_edicion,
                p.id_zona,
                p.id_categoria,
                p.id_partido,
                DAY(p.dia) AS dia_numero,
                MONTH(p.dia) AS mes,
                YEAR(p.dia) AS año,
                CASE
                    WHEN DAYNAME(p.dia) = 'Monday' THEN 'Lunes'
                    WHEN DAYNAME(p.dia) = 'Tuesday' THEN 'Martes'
                    WHEN DAYNAME(p.dia) = 'Wednesday' THEN 'Miércoles'
                    WHEN DAYNAME(p.dia) = 'Thursday' THEN 'Jueves'
                    WHEN DAYNAME(p.dia) = 'Friday' THEN 'Viernes'
                    WHEN DAYNAME(p.dia) = 'Saturday' THEN 'Sábado'
                    WHEN DAYNAME(p.dia) = 'Sunday' THEN 'Domingo'
                END AS dia_nombre,
                p.id_equipoLocal,
                p.id_equipoVisita,
                p.estado,
                p.jornada,
                p.dia,
                p.hora,
                p.goles_local,
                p.goles_visita,
                p.pen_local,
                p.pen_visita,
                p.cancha,
                p.arbitro,
                p.destacado,
                p.descripcion,
                p.id_planillero,
                j.id_jugador AS jugador_destacado,
                c.nombre AS nombre_categoria,
                CONCAT(u.nombre, ' ', u.apellido) AS planillero,
                CONCAT(e.nombre, ' ', e.temporada) AS nombre_edicion,
                p.vacante_local,
                p.vacante_visita,
                p.id_partido_previo_local,
                p.id_partido_previo_visita,
                p.res_partido_previo_local,
                p.res_partido_previo_visita,
                p.id_partido_posterior_ganador,
                p.id_partido_posterior_perdedor,
                p.interzonal,
                p.ventaja_deportiva,
                ida,
                vuelta
            FROM
                partidos p
            LEFT JOIN
                equipos e1 ON p.id_equipoLocal = e1.id_equipo
            LEFT JOIN
                equipos e2 ON p.id_equipoVisita = e2.id_equipo
            LEFT JOIN
                usuarios u ON p.id_planillero = u.id_usuario
            LEFT JOIN
                jugadores j ON p.id_jugador_destacado = j.id_jugador
            LEFT JOIN
                categorias c ON p.id_categoria = c.id_categoria
            LEFT JOIN
                ediciones e ON p.id_edicion = e.id_edicion
            ORDER BY 
                p.dia;
        `;
    }

    try {
        const result = await query(sql, params);
        res.send(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
    
};

const getIncidenciasPartido = async (req, res) => {
    const { id_partido } = req.query;

    try {
        const result = await query('CALL sp_partidos_incidencias(?)', [id_partido]);

        if (!result || result.length === 0) {
            return res.status(404).send("No se encontraron incidencias para el partido especificado.");
        }

        const [rows] = result;
        res.status(200).json(rows);

    } catch (err) {
        console.error("Error al ejecutar el procedimiento almacenado:", err);
        if (err.sqlState === '45000') {
            return res.status(400).send(err.sqlMessage);
        }
        return res.status(500).send("Error interno del servidor");
    }
};

const getFormacionesPartido = async (req, res) => {
    const { id_partido } = req.query;

    try {
        const result = await query('CALL sp_partidos_formaciones(?)', [id_partido]);

        if (!result || result.length === 0) {
            return res.status(404).send("No se encontraron incidencias para el partido especificado.");
        }

        const [rows] = result;
        res.status(200).json(rows);

    } catch (err) {
        console.error("Error al ejecutar el procedimiento almacenado de formaciones:", err);
        if (err.sqlState === '45000') {
            return res.status(400).send(err.sqlMessage);
        }
        return res.status(500).send("Error interno del servidor");
    }
};

const crearPartido = async (req, res) => {
    const { id_equipoLocal, id_equipoVisita, jornada, dia, hora, cancha, arbitro, id_planillero, id_edicion, id_categoria, id_zona, interzonal, ventaja_deportiva } = req.body;

    if (!id_equipoLocal || !id_equipoVisita || !id_categoria || !id_edicion || !id_zona) {
        return res.status(400).json({ mensaje: 'Faltan datos importantes' });
    }

    try {
        await query(`
            INSERT INTO partidos(
                id_equipoLocal, 
                id_equipoVisita, 
                jornada, 
                dia, 
                hora, 
                cancha, 
                arbitro, 
                id_planillero,
                id_edicion,
                id_categoria,
                id_zona,
                interzonal,
                ventaja_deportiva
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `, [id_equipoLocal, id_equipoVisita, jornada, dia, hora, cancha, arbitro, id_planillero, id_edicion, id_categoria, id_zona, interzonal, ventaja_deportiva]);

        return res.status(200).json({ mensaje: 'Partido creado con éxito' });

    } catch (err) {
        console.error("Error al ejecutar la consulta SQL:", err);
        return res.status(500).json({ mensaje: 'Error al interno en el servidor al intentar crear el partido' });
    }
};

const importarPartidos = async (req, res) => {
    const partidos = req.body;

    if (!Array.isArray(partidos)) {
        return res.status(400).send('Invalid data format');
    }

    // Construye el query para insertar múltiples registros
    const values = partidos.map(({ id_equipoLocal, id_equipoVisita, jornada, dia, hora, cancha, id_categoria, id_zona, id_edicion }) => [id_equipoLocal, id_equipoVisita, jornada, dia, hora, cancha, id_categoria, id_zona, id_edicion]);
    const query = 'INSERT INTO partidos (id_equipoLocal, id_equipoVisita, jornada, dia, hora, cancha, id_categoria, id_zona, id_edicion) VALUES ?';
    try {
        await query(query, [values]);
        return res.status(200).json({ mensaje: 'Partidos importados con éxito' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor' });
        console.error('Error al importar partidos:', error);
    }
};

const getPlantelesPartido = async (req, res) => {
    const { id_partido } = req.query;

    try {
    const [result] = await query('CALL sp_get_planteles(?)', [id_partido]);
        if (result.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontraron planteles para el partido especificado' });
        }
        return res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor' });
        console.error('Error al obtener planteles del partido:', error);
    }

    // Luego, obtiene las formaciones del partido
    query('CALL sp_get_planteles(?)', [id_partido], (err, result) => {
        if (err) {
            console.error("Error al ejecutar el procedimiento almacenado de planteles:", err);
            if (err.sqlState === '45000') {
                return res.status(400).send(err.sqlMessage);
            }
            return res.status(500).send("Error interno del servidor");
        }

        // Si result está vacío, verifica que el procedimiento almacenado no esté retornando resultados vacíos
        if (!result || result.length === 0) {
            return res.status(404).send("No se encontraron incidencias para el partido especificado.");
        }

        // En result, el primer elemento del array contiene el conjunto de resultados del procedimiento almacenado
        const [rows] = result;

        // Devuelve los datos
        res.status(200).json(rows);
    });
};

const updatePartido = async (req, res) => {
    console.log('🟡 Entrando a updatePartido');

    const { 
        id_equipoLocal, 
        id_equipoVisita, 
        goles_local,
        goles_visita,
        pen_local,
        pen_visita,
        jornada, 
        dia, 
        hora, 
        cancha, 
        arbitro, 
        id_planillero, 
        id_edicion, 
        id_categoria, 
        id_zona,
        estado, 
        id_partido,
        ventaja_deportiva,
        actualizar_partido
    } = req.body;

    console.log('🔸 Datos recibidos:', {
        id_partido, id_equipoLocal, id_equipoVisita, actualizar_partido
    });

    if (!id_partido) {
        console.warn('⚠️ ID de partido faltante');
        return res.status(400).json({ mensaje: 'ID de partido es requerido' });
    }

    const sql = `
        UPDATE partidos
        SET 
            id_equipoLocal = ?, 
            id_equipoVisita = ?, 
            goles_local = ?,
            goles_visita = ?,
            pen_local = ?,
            pen_visita = ?,
            jornada = ?, 
            dia = ?, 
            hora = ?,
            cancha = ?,
            arbitro = ?,
            id_planillero = ?,
            id_edicion = ?, 
            id_categoria = ?, 
            id_zona = ?,
            estado = ?,
            ventaja_deportiva = ?
        WHERE id_partido = ?
    `;

    try {
        console.log('🔵 Ejecutando UPDATE del partido...');

        const updateResult = await query(sql, [
            id_equipoLocal, 
            id_equipoVisita, 
            goles_local,
            goles_visita,
            pen_local,
            pen_visita,
            jornada, 
            dia, 
            hora, 
            cancha, 
            arbitro, 
            id_planillero, 
            id_edicion, 
            id_categoria, 
            id_zona, 
            estado,
            ventaja_deportiva,
            id_partido 
        ]);

        console.log('✅ UPDATE ejecutado correctamente');

        if (actualizar_partido) {
            console.log('🔄 Se requiere ejecutar procedimiento almacenado');

            const isVuelta = await esPartidoVuelta(id_partido, id_zona);
            console.log('🔍 Resultado de esPartidoVuelta:', isVuelta);

            if (isVuelta) {
                console.log('📌 Ejecutando SP: sp_actualizar_vacante_partido_ida_vuelta');
                const spQuery = `CALL sp_actualizar_vacante_partido_ida_vuelta(?)`;
                await query(spQuery, [id_partido]);
                console.log('✅ SP ida/vuelta ejecutado correctamente');
                return res.status(200).json({ mensaje: 'Partido actualizado con éxito y procedimiento almacenado ejecutado para vuelta' });
            } else {
                console.log('📌 Ejecutando SP: sp_actualizar_partido_vacante');
                const spQuery = `CALL sp_actualizar_partido_vacante(?)`;
                await query(spQuery, [id_partido]);
                console.log('✅ SP común ejecutado correctamente');
                return res.status(200).json({ mensaje: 'Partido actualizado con éxito y procedimiento almacenado ejecutado' });
            }
        } else {
            console.log('✅ No se requiere procedimiento almacenado, solo UPDATE');
            return res.status(200).json({ mensaje: 'Partido actualizado con éxito' });
        }

    } catch (error) {
        console.error('❌ Excepción atrapada en try/catch:', error);
        return res.status(500).json({ mensaje: 'Error interno del servidor', error });
    }
};

const deletePartido = async (req, res) => {
    const { id } = req.body;
    
    // Sentencia SQL para eliminar el año por ID
    const sql = 'DELETE FROM partidos WHERE id_partido = ?';
    try {
        if (!id) {
            return res.status(400).json({ mensaje: 'Falta el id del partido' });
        }
        await query(sql, [id]);
        return res.status(200).json({ mensaje: 'Partido eliminado con éxito' });
    } catch (error) {
        res.status(500).json({ mensaje: "Error interno del servidor" });
        console.error("Error al eliminar el partido:", error);
    }
};

const getPartidosCategoria = async (req, res) => {
    const { id_categoria } = req.query;

    const sqlQuery = `
    SELECT 
        CONCAT(r.resultado, '-' ,p.id_partido) AS id_partido,
        p.id_zona,
        p.vacante_local,
        p.vacante_visita,
        p.res_partido_previo_local,
        p.res_partido_previo_visita,
        p.id_partido_previo_local,
        p.id_partido_previo_visita,
        r.resultado,
        p.id_partido,
        CAST(
            CONCAT(
                CASE WHEN r.resultado = 'G' THEN 'Ganador' ELSE 'Perdedor' END,
                ' ', 
                CHAR(64 + z.fase), 
                p.vacante_local, 
                '-', 
                CHAR(64 + z.fase), 
                p.vacante_visita
            ) AS CHAR
        ) AS nombre_fase
    FROM 
        partidos AS p
    INNER JOIN 
        zonas AS z ON p.id_zona = z.id_zona
    CROSS JOIN 
        (SELECT 'G' AS resultado UNION ALL SELECT 'P') AS r
    WHERE 
        p.id_categoria = ?
    ORDER BY 
        r.resultado ASC, -- Primero ganadores ('G') y luego perdedores ('P')
        p.id_partido;
    `;

    try {
        if (!id_categoria) {
            return res.status(400).json({ mensaje: 'Falta el id de la categoria' });
        }
        const result = await query(sqlQuery, [id_categoria]);
        return res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor' });
        console.error('Error al obtener los partidos de la categoria:', error);
    }
};

const getPartidosZona = async (req, res) => {
    const { id_zona } = req.query;
    
    const SqlQuery = `
    SELECT 
        CONCAT(r.resultado, '-' ,p.id_partido) AS id_partido,
        CAST(
            CONCAT(
                CASE WHEN r.resultado = 'G' THEN 'Ganador' ELSE 'Perdedor' END,
                ' ', 
                CHAR(64 + z.fase), 
                p.vacante_local, 
                '-', 
                CHAR(64 + z.fase), 
                p.vacante_visita
            ) AS CHAR
        ) AS nombre_fase
    FROM 
        partidos AS p
    INNER JOIN 
        zonas AS z ON p.id_zona = z.id_zona
    CROSS JOIN 
        (SELECT 'G' AS resultado UNION ALL SELECT 'P') AS r
    WHERE 
        p.id_zona = ?
        AND (
            z.tipo_zona != 'eliminacion-directa-ida-vuelta' -- Trae todos los partidos si la zona no es ida y vuelta
            OR p.id_partido_previo_local IS NOT NULL -- Solo trae partidos de vuelta
        )
    ORDER BY 
        r.resultado ASC, -- Primero ganadores ('G') y luego perdedores ('P')
        p.id_partido;
    `;

    try {
        if (!id_zona) {
            return res.status(400).json({ mensaje: 'Falta el id de la zona' });
        }
        const result = await query(SqlQuery, [id_zona]);
        return res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno del servidor' });
        console.error('Error al obtener los partidos de la zona:', error);
    }
};

const guardarVacantePlayOff = async (req, res) => {
    const {
        id_categoria,
        id_edicion,
        id_zona,
        id_zona_previa,
        posicion_previa,
        id_partido,
        id_partido_previo,
        vacante,
        resultado
    } = req.body;

    try {
        if (posicion_previa) {
            const sql = `
                UPDATE temporadas
                SET pos_zona_previa = ?, id_zona_previa = ?
                WHERE id_zona = ? AND id_categoria = ? AND id_edicion = ? AND vacante = ?
            `;

            await query(sql, [posicion_previa, id_zona_previa, id_zona, id_categoria, id_edicion, vacante]);

            res.status(200).send({ mensaje: 'Vacante guardada con éxito' });
        } else {
            const sql = `CALL sp_agregar_enfrentamiento_vacante(?, ?, ?, ?)`;

            await query(sql, [id_partido, id_partido_previo, vacante, resultado]);

            res.status(200).send({ mensaje: 'Vacante guardada con éxito' });
        }
    } catch (err) {
        console.error('Error al guardar el vacante:', err);
        return res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

const actualizarPartidoVacante = async (req, res) => {
    const { id_partido } = req.body;

    try {
        // Paso 1: Obtener el id_zona del partido
        const getIdZonaQuery = 'SELECT id_zona FROM partidos WHERE id_partido = ?';
        const zonaResult = await query(getIdZonaQuery, [id_partido]);

        if (zonaResult.length === 0) {
            return res.status(404).json({ message: 'Partido no encontrado' });
        }

        const id_zona = zonaResult[0].id_zona;

        // Paso 2: Verificar el tipo de zona
        const getZoneTypeQuery = 'SELECT tipo_zona FROM zonas WHERE id_zona = ?';
        const zoneTypeResult = await query(getZoneTypeQuery, [id_zona]);

        if (zoneTypeResult.length === 0) {
            return res.status(404).json({ message: 'Zona no encontrada' });
        }

        const tipoZona = zoneTypeResult[0].tipo_zona.trim();

        if (tipoZona === 'eliminacion-directa') {
            // Si es una zona de eliminación directa, ejecutamos el SP correspondiente
            console.log('Zona es de tipo "eliminacion-directa"');
            const queryDirecta = 'CALL sp_actualizar_partido_vacante(?)';
            await query(queryDirecta, [id_partido]);
            res.json({ message: 'Partido de eliminación directa actualizado con éxito' });

        } else {
            // Si no es eliminación directa, verificamos si es un partido ida-vuelta
            console.log('La zona no es "eliminacion-directa", verificando ida-vuelta');
            const isReturnMatch = await esPartidoVuelta(id_partido, id_zona, query);

            if (isReturnMatch) {
                console.log('Es un partido de vuelta, ejecutando SP de ida-vuelta');
                const queryIdaVuelta = 'CALL sp_actualizar_vacante_partido_ida_vuelta(?)';
                await query(queryIdaVuelta, [id_partido]);
                res.json({ message: 'Partido de ida-vuelta actualizado con éxito' });
            } else {
                res.status(400).json({ message: 'El partido no es de ida-vuelta' });
            }
        }
    } catch (err) {
        console.error('Error en actualizarPartidoVacante:', err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = {
    getPartidos,
    getIncidenciasPartido,
    getFormacionesPartido,
    crearPartido,
    importarPartidos,
    getPlantelesPartido,
    updatePartido,
    deletePartido,
    getPartidosZona,
    guardarVacantePlayOff,
    getPartidosCategoria,
    actualizarPartidoVacante
};