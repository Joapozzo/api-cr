const { query } = require("../utils/db");

const getPartidosPlanillero = async (req, res) => {
  const { id_planillero } = req.query;
  const sql = `SELECT
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
WHERE id_planillero = ?`;

  try {
    if (!id_planillero) {
      return res.status(400).json({ mensaje: "Falta el id de la partida" });
    }
    const result = await query(sql, [id_planillero]);
    if (result.length === 0) {
      return res
        .status(404)
        .json({ mensaje: "No se encontraron partidos para el planillero" });
    }
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al traer los partidos del planillero" });
    console.error("Error al traer los partidos del planillero:", error);
  }
};

const getPartidosPlanillados = async (req, res) => {
  const { id_planillero, limite } = req.query;
  const sql = `SELECT
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
WHERE id_planillero = ?
  AND p.estado IN ('S', 'F')
LIMIT ?`;

  try {
    if (!id_planillero) {
      return res.status(400).json({ mensaje: "Falta el id de la partida" });
    }
    const result = await query(sql, [id_planillero, limite]);
    if (result.length === 0) {
      return res
        .status(404)
        .json({ mensaje: "No se encontraron partidos para el planillero" });
    }
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al traer los partidos del planillero" });
    console.error("Error al traer los partidos del planillero:", error);
  }
};

const getPartidoIncidencias = async (req, res) => {
  const { id_partido } = req.query;

  const sql = `
        CALL sp_partidos_incidencias(?)
    `;

    try {
      if (!id_partido) {
        return res.status(400).json({ mensaje: "Falta el id del partido" });
      }

      const result = await query(sql, [id_partido]);
      if (result.length === 0) {
        return res
          .status(404)
          .json({ mensaje: "No se encontraron incidencias para el partido" });
      }
      return res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ mensaje: "Error al traer los incidencias del partido" });
    }
};

const getPartidoFormaciones = async (req, res) => {
  const { id_partido } = req.query;
  try {

    if (!id_partido) {
      return res.status(400).send("Falta el id del partido");
    }

    const result = await query("CALL sp_partidos_formaciones(?)", [
      id_partido,
    ]);

    if (!result || result.length === 0) {
      return res
        .status(404)
        .send("No se encontraron incidencias para el partido especificado.");
    }
    const [rows] = result;
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).send("Error interno del servidor");
  }
};

const firmaJugador = async (req, res) => {
  const { id_partido, id_jugador, dorsal } = req.body;

  const SqlQuery = `
  INSERT INTO formaciones (id_partido, id_jugador, dorsal)
  VALUES (?, ?, ?)
  ON DUPLICATE KEY UPDATE dorsal = VALUES(dorsal)
  `;
  
  try {
    if (!id_partido || !id_jugador || !dorsal) {
      return res.status(400).send("Faltan datos necesarios");
    }
    await query(SqlQuery, [id_partido, id_jugador, dorsal]);
    res.status(200).send("Dorsal guardado correctamente");
  } catch (error) {
    res.status(500).send("Error interno del servidor");
  }
};

const crearJugadorEventual = async (req, res) => {
  const {
    id_partido,
    id_equipo,
    nombre,
    apellido,
    dni,
    dorsal,
    estado,
    eventual,
  } = req.body;

  try {
    // 1. Verificar si el jugador ya existe en la tabla jugadores
    let id_jugador;
    const jugadores = await query(
      `SELECT id_jugador FROM jugadores WHERE dni = ?`,
      [dni]
    );

    if (jugadores.length > 0) {
      id_jugador = jugadores[0].id_jugador;
    } else {
      const resultadoJugador = await query(
        `INSERT INTO jugadores (dni, nombre, apellido, estado) VALUES (?, ?, ?, ?)`,
        [dni, nombre, apellido, estado]
      );
      id_jugador = resultadoJugador.insertId;
    }

    console.log("ID del jugador:", id_jugador);

    // 2. Obtener id_categoria e id_edicion de la tabla partidos
    const partido = await query(
      `SELECT id_categoria, id_edicion FROM partidos WHERE id_partido = ?`,
      [id_partido]
    );

    if (!partido.length) {
      return res
        .status(404)
        .json({ success: false, message: "Partido no encontrado" });
    }

    const { id_categoria, id_edicion } = partido[0];

    // 3. Verificar si el jugador ya está en planteles
    const planteles = await query(
      `SELECT * FROM planteles WHERE id_jugador = ? AND id_equipo = ? AND id_categoria = ? AND id_edicion = ?`,
      [id_jugador, id_equipo, id_categoria, id_edicion]
    );

    if (planteles.length > 0) {
      return res.status(409).json({
        success: false,
        message: "El jugador ya está registrado en este equipo",
      });
    }

    // 4. Insertar el jugador en la tabla planteles
    await query(
      `INSERT INTO planteles (id_equipo, id_jugador, id_edicion, id_categoria, eventual, sancionado) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_equipo, id_jugador, id_edicion, id_categoria, eventual, "N"]
    );

    // 5. Verificar si el jugador ya está en formaciones
    const formaciones = await query(
      `SELECT * FROM formaciones WHERE id_partido = ? AND id_jugador = ?`,
      [id_partido, id_jugador]
    );

    if (formaciones.length > 0) {
      return res.status(409).json({
        success: false,
        message: "El jugador ya está registrado en este partido",
      });
    }

    // 6. Insertar en la tabla formaciones
    await query(
      `INSERT INTO formaciones (id_partido, id_jugador, dorsal) VALUES (?, ?, ?)`,
      [id_partido, id_jugador, dorsal]
    );

    // Responder con éxito
    return res.status(201).json({
      success: true,
      message: "Jugador eventual creado exitosamente",
    });
  } catch (error) {
    console.error("Error inesperado:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getEdicion = async (req, res) => {
  const { id_edicion } = req.query;

  if (!id_edicion) {
    return res.status(400).json({ mensaje: "Falta el id del edicion" });
  }

  try {
    const sql = `
      SELECT nombre, temporada, cantidad_eventuales, partidos_eventuales 
      FROM ediciones 
      WHERE id_edicion = ?
    `;
    const result = await query(sql, [id_edicion]);

    if (result.length === 0) {
      return res.status(404).json({ mensaje: "No se encontró la edición" });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("Error al traer la edicion:", err);
    return res.status(500).json({ mensaje: "Error al traer la edicion" });
  }
};

const checkPartidosEventual = async (req, res) => {
  const { id_partido, dni } = req.query;

  if (!id_partido || !dni) {
    return res.status(400).json({ mensaje: "Faltan parámetros" });
  }

  try {
    const sql = `
      SELECT COUNT(DISTINCT p.id_partido) AS partidos_jugados
      FROM formaciones f
      JOIN partidos p ON f.id_partido = p.id_partido
      WHERE f.id_jugador IN (SELECT id_jugador FROM jugadores WHERE dni = ?)
        AND p.id_categoria IN (SELECT id_categoria FROM partidos WHERE id_partido = ?)
        AND p.id_edicion IN (SELECT id_edicion FROM partidos WHERE id_partido = ?)
        AND p.estado = 'F'
    `;
    const result = await query(sql, [dni, id_partido, id_partido]);

    if (result.length === 0) {
      return res.status(404).json({ mensaje: "No se encontró la edición" });
    }

    return res.status(200).json(result[0]);
  } catch (err) {
    console.error("Error al ejecutar la consulta de checkPartidosEventual:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

const getJugadoresDestacados = async (req, res) => {
  const { id_partido } = req.query;

  if (!id_partido) {
    return res.status(400).json({ mensaje: "Falta el id del partido" });
  }

  try {
    const sql = `
      SELECT
        jd.id_partido,
        jd.id_jugador,
        CONCAT(j.nombre, ' ', j.apellido, ' - ', e.nombre) AS nombre_completo,
        jd.id_jugador AS jugador_destacado,
        jd.posicion
      FROM 
        jugadores_destacados AS jd
      JOIN 
        jugadores AS j ON jd.id_jugador = j.id_jugador
      JOIN 
        partidos AS p ON p.id_partido = jd.id_partido
      JOIN
        equipos AS e ON jd.id_equipo = e.id_equipo
      WHERE 
        p.id_partido = ?
      ORDER BY 
        jd.posicion ASC;
    `;

    const result = await query(sql, [id_partido]);

    if (result.length === 0) {
      return res
        .status(404)
        .json({ mensaje: "No se encontraron jugadores destacados" });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("Error al traer los jugadores destacados:", err);
    return res
      .status(500)
      .json({ mensaje: "Error al traer los jugadores destacados" });
  }
};

const getJugadoresDream = async (req, res) => {
  const { id_categoria, jornada } = req.query;

  if (!id_categoria || !jornada) {
    return res.status(400).json({ mensaje: "Faltan datos" });
  }

  try {
    const sql = `
      SELECT 
        j.id_jugador,
        j.nombre,
        j.apellido,
        jd.id_equipo,
        p.jornada
      FROM 
        jugadores_destacados AS jd
      INNER JOIN 
        jugadores AS j ON jd.id_jugador = j.id_jugador
      INNER JOIN 
        partidos AS p ON jd.id_partido = p.id_partido
      WHERE 
        jd.id_categoria = ? 
        AND p.jornada = ?
        AND dt = 'N'
    `;

    const result = await query(sql, [id_categoria, jornada]);

    if (result.length === 0) {
      return res
        .status(404)
        .json({ mensaje: "No se encontraron jugadores destacados" });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("Error obteniendo jugadores destacados:", err);
    return res
      .status(500)
      .json({ mensaje: "Error obteniendo jugadores destacados" });
  }
};

const updateMvpPartido = async (req, res) => {
  const { id_partido, id_jugador } = req.query;

  if (!id_partido) {
    return res.status(400).json({ error: "Faltan datos del partido" });
  }

  try {
    const updateQuery = `
      UPDATE partidos
      SET id_jugador_destacado = ?
      WHERE id_partido = ?`;

    await query(updateQuery, [id_jugador, id_partido]);

    return res.status(200).json({
      message: "Se agrego correctamente el mvp al partido",
      status: 200,
    });
  } catch (error) {
    console.error("Error al insertar mvp en el partido", error);
    return res.status(500).json({ error: "Error al insertar mvp en el partido" });
  }
};

const verificarJugadores = async (req, res) => {
  const { id_partido } = req.query;

  if (!id_partido) {
    return res.status(400).send("Falta el id del partido");
  }

  try {
    const queryEstado = `
      SELECT estado 
      FROM partidos 
      WHERE id_partido = ?`;

    const estadoResult = await query(queryEstado, [id_partido]);

    if (estadoResult.length === 0) {
      return res.status(404).send("Partido no encontrado");
    }

    const estadoPartido = estadoResult[0].estado;

    if (estadoPartido !== "P") {
      return res.status(200).json({ sePuedeComenzar: true });
    }

    const queryEquipos = `
      SELECT id_equipoLocal, id_equipoVisita 
      FROM partidos 
      WHERE id_partido = ?`;

    const equiposResult = await query(queryEquipos, [id_partido]);
    const { id_equipoLocal, id_equipoVisita } = equiposResult[0];

    const queryJugadores = `
      SELECT
        (SELECT COUNT(*) FROM formaciones WHERE id_partido = ? AND id_jugador IN (SELECT id_jugador FROM planteles WHERE id_equipo = ?)) AS jugadores_local,
        (SELECT COUNT(*) FROM formaciones WHERE id_partido = ? AND id_jugador IN (SELECT id_jugador FROM planteles WHERE id_equipo = ?)) AS jugadores_visitante`;

    const jugadoresResult = await query(queryJugadores, [
      id_partido,
      id_equipoLocal,
      id_partido,
      id_equipoVisita,
    ]);

    const { jugadores_local, jugadores_visitante } = jugadoresResult[0];

    if (jugadores_local >= 5 && jugadores_visitante >= 5) {
      return res.status(200).json({ sePuedeComenzar: true });
    } else {
      return res.status(200).json({
        sePuedeComenzar: false,
        jugadores_local,
        jugadores_visitante,
      });
    }
  } catch (err) {
    console.error("Error al verificar los jugadores:", err);
    return res.status(500).send("Error interno del servidor");
  }
};

const actualizarEstadoPartido = async (req, res) => {
  const { id_partido } = req.body;

  if (!id_partido) {
    return res.status(400).json({ mensaje: "Falta el id del partido" });
  }

  try {
    const queryEstado = `
      SELECT estado FROM partidos
      WHERE id_partido = ?
    `;

    const result = await query(queryEstado, [id_partido]);

    if (result.length === 0) {
      return res.status(404).json({ mensaje: "Partido no encontrado" });
    }

    let nuevoEstado;
    let palabra = "";
    const estadoActual = result[0].estado;

    if (estadoActual === "P") {
      nuevoEstado = "C";
      palabra = "Comenzado";
    } else if (estadoActual === "C") {
      nuevoEstado = "T";
      palabra = "Terminado";
    } else if (estadoActual === "T") {
      nuevoEstado = "F";
      palabra = "Cargado";
    } else {
      return res
        .status(400)
        .json({ mensaje: "Estado del partido no válido para la transición" });
    }

    let queryUpdate = `
      UPDATE partidos
      SET estado = ?`;
    const params = [nuevoEstado];

    if (nuevoEstado === "C") {
      queryUpdate += `,
        goles_local = 0,
        goles_visita = 0`;
    }

    queryUpdate += ` WHERE id_partido = ?`;
    params.push(id_partido);

    await query(queryUpdate, params);

    return res.status(200).json({
      mensaje: `Partido ${palabra} con éxito`,
      data: { id_partido, nuevoEstado },
    });
  } catch (err) {
    console.error("Error al actualizar el estado del partido:", err);
    return res
      .status(500)
      .json({ mensaje: "Error al actualizar el estado del partido" });
  }
};

const updatePartido = async (req, res) => {
  const { data } = req.body;
  const {
    descripcion,
    id_partido,
    pen_local,
    pen_visita,
    goles_local,
    goles_visita,
  } = data;

  if (!id_partido) {
    return res.status(400).json({ mensaje: "Falta el id_partido" });
  }

  const penLocal = pen_local === 0 ? null : pen_local;
  const penVisita = pen_visita === 0 ? null : pen_visita;

  try {
    const sqlZona = `
      SELECT p.id_zona, z.tipo_zona, z.campeon
      FROM partidos p
      JOIN zonas z ON p.id_zona = z.id_zona
      WHERE p.id_partido = ?
    `;

    const results = await query(sqlZona, [id_partido]);

    if (results.length === 0) {
      return res.status(404).json({ mensaje: "Partido no encontrado" });
    }

    const { id_zona, tipo_zona, campeon } = results[0];

    const sqlUpdatePartido = `
      UPDATE partidos
      SET descripcion = ?, pen_local = ?, pen_visita = ?
      WHERE id_partido = ?
    `;

    await query(sqlUpdatePartido, [
      descripcion,
      penLocal,
      penVisita,
      id_partido,
    ]);

    if (tipo_zona === "eliminacion-directa" && campeon === "S") {
      let idEquipoGanador = null;

      if (goles_local > goles_visita) {
        idEquipoGanador = data.id_equipoLocal;
      } else if (goles_visita > goles_local) {
        idEquipoGanador = data.id_equipoVisita;
      } else if (penLocal !== null && penVisita !== null) {
        idEquipoGanador =
          penLocal > penVisita ? data.id_equipoLocal : data.id_equipoVisita;
      }

      if (idEquipoGanador) {
        const sqlUpdateZona = `
          UPDATE zonas
          SET id_equipo_campeon = ?
          WHERE id_zona = ?
        `;

        await query(sqlUpdateZona, [idEquipoGanador, id_zona]);

        return res.status(200).json({
          mensaje: "Partido y campeón actualizados exitosamente",
        });
      } else {
        return res.status(200).json({
          mensaje: "Partido actualizado, pero no se determinó campeón",
        });
      }
    } else {
      return res
        .status(200)
        .json({ mensaje: "Partido actualizado exitosamente" });
    }
  } catch (err) {
    console.error("Error al actualizar partido:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

const suspenderPartido = async (req, res) => {
  const { goles_local, goles_visita, descripcion, estado, id_partido } = req.body;

  if (!id_partido) {
    return res.status(400).json({ mensaje: "ID de partido es requerido" });
  }

  try {
    if (estado === "A") {
      const sql = `
        UPDATE partidos
        SET estado = ?
        WHERE id_partido = ?
      `;
      await query(sql, [estado, id_partido]);

      return res.json({ mensaje: "Partido postergado exitosamente" });
    } else {
      const sql = `
        UPDATE partidos
        SET 
          goles_local = ?, 
          goles_visita = ?, 
          descripcion = ?,
          estado = ?
        WHERE id_partido = ?
      `;

      await query(sql, [
        goles_local,
        goles_visita,
        descripcion,
        estado,
        id_partido,
      ]);

      return res.json({ mensaje: "Partido suspendido exitosamente" });
    }
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

module.exports = {
  getPartidosPlanillero,
  getPartidoIncidencias,
  getPartidoFormaciones,
  firmaJugador,
  crearJugadorEventual,
  getEdicion,
  checkPartidosEventual,
  getJugadoresDestacados,
  updateMvpPartido,
  verificarJugadores,
  actualizarEstadoPartido,
  updatePartido,
  suspenderPartido,
  getPartidosPlanillados,
  getJugadoresDream,
};
