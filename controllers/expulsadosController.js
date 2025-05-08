const { query } = require('../utils/db');

const getExpulsados = async (req, res) => {
    const { id_categoria } = req.query; // Obtén el id_categoria desde los parámetros de la solicitud

    let sql = `
        SELECT DISTINCT
            e.id_expulsion,
            e.id_jugador,
            e.id_partido,
            p.id_categoria,
            CONCAT(j.apellido, ', ', j.nombre) AS jugador,
            c.nombre AS categoria,
            e.fechas,
            e.fechas_restantes,
            e.multa,
            eq.id_equipo,
            e.motivo,
            CONCAT(ed.nombre, ' ', ed.temporada) AS edicion
        FROM
            expulsados AS e
        INNER JOIN
            jugadores AS j ON j.id_jugador = e.id_jugador
        INNER JOIN
            partidos AS p ON p.id_partido = e.id_partido
        INNER JOIN
            categorias AS c ON c.id_categoria = p.id_categoria
        INNER JOIN
            planteles AS pl ON pl.id_jugador = j.id_jugador
        INNER JOIN
            equipos AS eq ON eq.id_equipo = pl.id_equipo
        INNER JOIN
            ediciones AS ed ON ed.id_edicion = p.id_edicion
        ORDER BY
            p.dia DESC
    `;
    // Si id_categoria se recibe, agregar el filtro
    if (id_categoria) {
        sql += ` WHERE p.id_categoria = ?`;
    }
    try {
        const result = await query(sql, id_categoria ? [id_categoria] : []);
        res.send(result);
    } catch (error) {
        res.status(500).send('Error interno del servidor');
        console.error('Error en la consulta:', error);
    }
};

// const calcularExpulsiones = async (req, res) => {
//     // Consulta para obtener todas las expulsiones activas
//     const expulsionQuery = `SELECT * FROM expulsados WHERE estado = 'A'`;

//     try {
//         const expulsiones = await query(expulsionQuery);

//         if (!expulsiones || expulsiones.length === 0) {
//             return res.send('No hay sanciones activas para actualizar');
//         }

//         let updatedCount = 0; // Contador para llevar la cuenta de actualizaciones exitosas

//         // Iterar sobre cada expulsión activa
//         for (const expulsion of expulsiones) {
//             const { id_expulsion, id_jugador, fechas, fechas_restantes, id_partido } = expulsion;

//             // Consulta para obtener la categoría y fecha del partido de expulsión
//             const partidoQuery = `SELECT id_categoria, dia FROM partidos WHERE id_partido = ?`;

//             const partidoData = await query(partidoQuery, [id_partido]);

//             if (!partidoData || partidoData.length === 0) {
//                 console.error('Partido no encontrado para la expulsión:', id_expulsion);
//                 continue;
//             }

//             const { id_categoria, dia } = partidoData[0];

//             // Convertir la fecha a cadena si es necesario
//             const diaString = new Date(dia).toISOString().split('T')[0]; // Formato YYYY-MM-DD

//             // Consulta para obtener el equipo del jugador expulsado
//             const equipoQuery = `SELECT id_equipo FROM planteles WHERE id_jugador = ? AND id_categoria = ?`;

//             const equipoData = await query(equipoQuery, [id_jugador, id_categoria]);

//             if (!equipoData || equipoData.length === 0) {
//                 console.error('Equipo no encontrado para el jugador:', id_jugador);
//                 continue;
//             }

//             const id_equipo = equipoData[0].id_equipo;

//             // Consulta para contar los partidos jugados posteriores a la expulsión para el equipo del jugador
//             const partidosPosterioresQuery = `
//                 SELECT COUNT(*) AS partidos_jugados 
//                 FROM partidos 
//                 WHERE (id_equipoLocal = ? OR id_equipoVisita = ?)
//                 AND dia > ? 
//                 AND estado IN ('F', 'S');
//             `;

//             const partidosData = await query(partidosPosterioresQuery, [id_equipo, id_equipo, diaString]);

//             const partidos_jugados = partidosData[0].partidos_jugados;

//             let nueva_fecha_restante;
//             let nuevo_estado;

//             if (partidos_jugados >= fechas) {
//                 // Si se han jugado suficientes partidos para completar la sanción
//                 nueva_fecha_restante = 0;
//                 nuevo_estado = 'I'; // Inactivo
//             } else {
//                 // Si aún quedan fechas restantes
//                 nueva_fecha_restante = fechas - partidos_jugados;
//                 nuevo_estado = 'A'; // Activo
//             }

//             // Actualizar la expulsión
//             const actualizarExpulsionQuery = `
//                 UPDATE expulsados 
//                 SET fechas_restantes = ?, estado = ? 
//                 WHERE id_expulsion = ?
//             `;

//             await query(actualizarExpulsionQuery, [nueva_fecha_restante, nuevo_estado, id_expulsion]);

//             // Si la sanción se ha completado, actualizar el estado en la tabla 'planteles'
//             if (nuevo_estado === 'I') {
//                 const updateSancionadoQuery = `
//                     UPDATE planteles 
//                     SET sancionado = 'N' 
//                     WHERE id_jugador = ? AND id_categoria = ?
//                 `;

//                 await query(updateSancionadoQuery, [id_jugador, id_categoria]);
//             }

//             updatedCount++;

//             // Verifica si hemos terminado de procesar todas las expulsiones
//             if (updatedCount === expulsiones.length) {
//                 res.send('Sanciones actualizadas exitosamente');
//             }
//         }

//     } catch (err) {
//         console.error('Error al calcular las expulsiones:', err);
//         return res.status(500).send('Error en la base de datos');
//     }
// };

const calcularExpulsiones = async (req, res) => {
    console.time('expulsiones'); // Inicia medición de tiempo

    const expulsionQuery = `SELECT * FROM expulsados WHERE estado = 'A'`;

    try {
        const expulsiones = await query(expulsionQuery);

        if (!expulsiones || expulsiones.length === 0) {
            console.timeEnd('expulsiones');
            return res.send('No hay sanciones activas para actualizar');
        }

        // Ejecutar actualizaciones en paralelo
        const tareas = expulsiones.map(async (expulsion) => {
            const { id_expulsion, id_jugador, fechas, id_partido } = expulsion;

            try {
                const partidoData = await query(
                    `SELECT id_categoria, dia FROM partidos WHERE id_partido = ?`,
                    [id_partido]
                );

                if (!partidoData.length) return;

                const { id_categoria, dia } = partidoData[0];
                const diaString = new Date(dia).toISOString().split('T')[0];

                const equipoData = await query(
                    `SELECT id_equipo FROM planteles WHERE id_jugador = ? AND id_categoria = ?`,
                    [id_jugador, id_categoria]
                );

                if (!equipoData.length) return;

                const id_equipo = equipoData[0].id_equipo;

                const partidosData = await query(
                    `
                    SELECT COUNT(*) AS partidos_jugados 
                    FROM partidos 
                    WHERE (id_equipoLocal = ? OR id_equipoVisita = ?)
                    AND dia > ? 
                    AND estado IN ('F', 'S');
                    `,
                    [id_equipo, id_equipo, diaString]
                );

                const partidos_jugados = partidosData[0].partidos_jugados;
                const nueva_fecha_restante = Math.max(fechas - partidos_jugados, 0);
                const nuevo_estado = nueva_fecha_restante === 0 ? 'I' : 'A';

                await query(
                    `
                    UPDATE expulsados 
                    SET fechas_restantes = ?, estado = ? 
                    WHERE id_expulsion = ?
                    `,
                    [nueva_fecha_restante, nuevo_estado, id_expulsion]
                );

                if (nuevo_estado === 'I') {
                    await query(
                        `
                        UPDATE planteles 
                        SET sancionado = 'N' 
                        WHERE id_jugador = ? AND id_categoria = ?
                        `,
                        [id_jugador, id_categoria]
                    );
                }
            } catch (err) {
                console.error(`Error procesando expulsión ${expulsion.id_expulsion}:`, err);
            }
        });

        await Promise.all(tareas);

        console.timeEnd('expulsiones'); // Fin medición de tiempo
        return res.send('Sanciones actualizadas exitosamente');

    } catch (err) {
        console.timeEnd('expulsiones');
        console.error('Error al calcular las expulsiones:', err);
        return res.status(500).send('Error en la base de datos');
    }
};


module.exports = {
    getExpulsados,
    calcularExpulsiones
};
