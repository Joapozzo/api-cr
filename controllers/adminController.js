const { query } = require("../utils/db");

const crearCategoria = async (req, res) => {
  const { nombre, descripcion } = req.body;
  try {
    await query("INSERT INTO categorias(nombre, descripcion) VALUES (?, ?)", [nombre, descripcion]);
    res.send("Categoria registrada con éxito");
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const getCategorias = async (req, res) => {
  try {
    const result = await query(`
      SELECT
          c.id_categoria,
          c.id_edicion, 
          c.nombre AS nombre,
          CONCAT(
              IFNULL((SELECT COUNT(*) FROM partidos p WHERE p.id_categoria = c.id_categoria AND p.estado = 'F'), 0),
              ' / ',
              IFNULL((SELECT COUNT(*) FROM partidos p WHERE p.id_categoria = c.id_categoria), 0)
          ) AS partidos,
          IFNULL((SELECT COUNT(*) FROM equipos e WHERE e.id_categoria = c.id_categoria), 0) AS equipos,
          CONCAT(
              IFNULL((SELECT COUNT(*) FROM jugadores j WHERE j.id_categoria = c.id_categoria), 0),
              ' ',
              IFNULL(
                  CASE 
                      WHEN c.genero = 'F' THEN 
                          CASE WHEN (SELECT COUNT(*) FROM jugadores j WHERE j.id_categoria = c.id_categoria) = 1 THEN 'jugadora' ELSE 'jugadoras' END
                      ELSE 
                          CASE WHEN (SELECT COUNT(*) FROM jugadores j WHERE j.id_categoria = c.id_categoria) = 1 THEN 'jugador' ELSE 'jugadores' END
                  END,
                  ''
              )
          ) AS jugadores,
          CASE
              WHEN EXISTS (SELECT 1 FROM partidos p WHERE p.id_categoria = c.id_categoria AND p.estado = 'F') THEN 'JUGANDO'
              ELSE 'SIN INICIAR'
          END AS estado
      FROM 
          categorias c
      ORDER BY 
          c.id_categoria DESC
    `);
    res.send(result);
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const deleteCategoria = async (req, res) => {
  const { id } = req.body;
  try {
    await query("DELETE FROM categorias WHERE id_categoria = ?", [id]);
    res.status(200).send("Categoria eliminada correctamente");
  } catch (err) {
    console.error("Error eliminando la categoria:", err);
    res.status(500).send("Error eliminando la categoria");
  }
};

const crearTorneo = async (req, res) => {
  const { nombre, descripcion } = req.body;
  try {
    await query("INSERT INTO torneos(nombre, descripcion) VALUES (?, ?)", [nombre, descripcion]);
    res.send("Torneo registrado con éxito");
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const getTorneos = async (req, res) => {
  try {
    const result = await query("SELECT * FROM torneos");
    res.send(result);
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const deleteTorneo = async (req, res) => {
  const { id } = req.body;
  try {
    await query("DELETE FROM torneos WHERE id_torneo = ?", [id]);
    res.status(200).send("Torneo eliminado correctamente");
  } catch (err) {
    console.error("Error eliminando el torneo:", err);
    res.status(500).send("Error eliminando el torneo");
  }
};

const crearSede = async (req, res) => {
  const { nombre, descripcion } = req.body;
  try {
    await query("INSERT INTO sedes(nombre, descripcion) VALUES (?, ?)", [nombre, descripcion]);
    res.send("Sede registrada con éxito");
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const getSedes = async (req, res) => {
  try {
    const result = await query("SELECT * FROM sedes");
    res.send(result);
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const deleteSede = async (req, res) => {
  const { id } = req.body;
  try {
    await query("DELETE FROM sedes WHERE id_sede = ?", [id]);
    res.status(200).send("Sede eliminada correctamente");
  } catch (err) {
    console.error("Error eliminando la sede:", err);
    res.status(500).send("Error eliminando la sede");
  }
};

const crearAnio = async (req, res) => {
  const { año, descripcion } = req.body;
  try {
    await query("INSERT INTO años(año, descripcion) VALUES (?, ?)", [año, descripcion]);
    res.send("Año registrado con éxito");
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const importarAnio = async (req, res) => {
  const años = req.body;
  if (!Array.isArray(años)) {
    return res.status(400).send("Invalid data format");
  }

  const values = años.map(({ año, descripcion }) => [año, descripcion]);
  const insertQuery = "INSERT INTO años (año, descripcion) VALUES ?";

  try {
    await query(insertQuery, [values]);
    res.status(200).send("Datos importados correctamente");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al insertar datos en la base de datos");
  }
};

const deleteAnio = async (req, res) => {
  const { id } = req.body;
  try {
    await query("DELETE FROM años WHERE id_año = ?", [id]);
    res.status(200).send("Año eliminado correctamente");
  } catch (err) {
    console.error("Error eliminando el año:", err);
    res.status(500).send("Error eliminando el año");
  }
};

const getAnios = async (req, res) => {
  try {
    const result = await query("SELECT * FROM años ORDER BY año DESC");
    res.send(result);
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const getRoles = async (req, res) => {
  try {
    const result = await query("SELECT * FROM roles");
    res.send(result);
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const crearTemporada = async (req, res) => {
  const { año, sede, categoria, torneo, division, descripcion } = req.body;
  try {
    await query(
      "INSERT INTO temporadas(id_torneo, id_categoria, id_año, id_sede, id_division, descripcion) VALUES (?, ?, ?, ?, ?, ?)",
      [torneo, categoria, año, sede, division, descripcion]
    );
    res.send("Temporada registrada con éxito");
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const getTemporadas = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id_temporada, 
        torneos.nombre AS torneo, 
        categorias.nombre AS categoria, 
        años.año, 
        sedes.nombre AS sede, 
        divisiones.nombre AS division,
        temporadas.descripcion,
        CONCAT(divisiones.nombre, ' - ', torneos.nombre, ' ', años.año) AS nombre_temporada
      FROM temporadas 
      INNER JOIN torneos ON temporadas.id_torneo = torneos.id_torneo 
      INNER JOIN categorias ON temporadas.id_categoria = categorias.id_categoria 
      INNER JOIN años ON temporadas.id_año = años.id_año 
      INNER JOIN sedes ON temporadas.id_sede = sedes.id_sede
      INNER JOIN divisiones ON temporadas.id_division = divisiones.id_division
    `);
    res.send(result);
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const deleteTemporada = async (req, res) => {
  const { id } = req.body;
  try {
    await query("DELETE FROM temporadas WHERE id_temporada = ?", [id]);
    res.status(200).send("Temporada eliminada correctamente");
  } catch (err) {
    console.error("Error eliminando la temporada:", err);
    res.status(500).send("Error eliminando la temporada");
  }
};

const crearEquipo = async (req, res) => {
  const { nombre, img, categoria, division, descripcion } = req.body;
  try {
    await query(
      "INSERT INTO equipos(nombre, id_categoria, id_division, descripcion, img) VALUES (?, ?, ?, ?, ?)",
      [nombre, categoria, division, descripcion, img]
    );
    res.send("Temporada registrada con éxito");
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const getDivisiones = async (req, res) => {
  try {
    const result = await query("SELECT * FROM divisiones");
    res.send(result);
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const crearDivision = async (req, res) => {
  const { nombre, descripcion } = req.body;
  try {
    await query("INSERT INTO divisiones(nombre, descripcion) VALUES (?, ?)", [nombre, descripcion]);
    res.send("Categoria registrada con éxito");
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const getUsuarios = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        usuarios.id_usuario, 
        usuarios.dni, 
        CONCAT(UPPER(usuarios.apellido), ', ', usuarios.nombre) AS usuario, 
        usuarios.telefono, 
        usuarios.id_rol, 
        equipos.id_equipo, 
        usuarios.email,
        usuarios.estado,
        usuarios.img,
        usuarios.nombre,
        usuarios.apellido,
        DATE_FORMAT(usuarios.nacimiento, '%d/%m/%Y') AS nacimiento,
        usuarios.fecha_creacion,
        usuarios.fecha_actualizacion
      FROM 
        usuarios 
      LEFT JOIN 
        roles ON roles.id_rol = usuarios.id_rol 
      LEFT JOIN 
        equipos ON equipos.id_equipo = usuarios.id_equipo;
    `);
    res.send(result);
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const deleteUsuario = async (req, res) => {
  const { id } = req.body;
  try {
    const sql = "DELETE FROM usuarios WHERE id_usuario = ?";
    await query(sql, [id]);
    res.status(200).send("Usuario eliminado correctamente");
  } catch (err) {
    console.error("Error eliminando el usuario:", err);
    res.status(500).send("Error eliminando el usuario");
  }
};

const updateUsuario = async (req, res) => {
  const {
    dni,
    nombre,
    apellido,
    nacimiento,
    email,
    telefono,
    id_rol,
    id_equipo,
    estado,
    img,
    id_usuario,
  } = req.body;
  const fecha_actualizacion = new Date();

  if (!id_usuario) {
    return res.status(400).send("ID de usuario es requerido");
  }

  try {
    const sql = `
      UPDATE usuarios
      SET 
          dni = ?, 
          nombre = ?, 
          apellido = ?, 
          nacimiento = ?, 
          email = ?, 
          telefono = ?, 
          id_rol = ?, 
          id_equipo = ?,
          estado = ?,
          img = ?,
          fecha_actualizacion = ?
      WHERE id_usuario = ?;
    `;
    await query(sql, [
      dni,
      nombre,
      apellido,
      nacimiento,
      email,
      telefono,
      id_rol,
      id_equipo,
      estado,
      img,
      fecha_actualizacion,
      id_usuario,
    ]);
    res.send("Usuario actualizado exitosamente");
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const crearJugador = async (req, res) => {
  const { dni, nombre, apellido, posicion, id_equipo } = req.body;

  try {
    await query(
      "CALL sp_crear_jugador(?, ?, ?, ?, ?)",
      [dni, nombre, apellido, posicion, id_equipo]
    );
    res.status(200).send("Jugador creado exitosamente");
  } catch (err) {
    if (err.sqlState === "45000") {
      return res.status(400).send(err.sqlMessage);
    }
    console.error("Error al insertar el jugador en la tabla jugadores:", err);
    res.status(500).send("Error interno del servidor");
  }
};

const importarJugadores = async (req, res) => {
  const jugadores = req.body;
  if (!Array.isArray(jugadores)) {
    return res.status(400).send("Invalid data format");
  }

  const getOrCreateTeamId = async (equipo) => {
    try {
      const result = await query(
        "SELECT id_equipo FROM equipos WHERE nombre = ?",
        [equipo]
      );
      if (result.length > 0) {
        return result[0].id_equipo;
      } else {
        const [insertResult] = await query(
          "INSERT INTO equipos (nombre) VALUES (?)",
          [equipo]
        );
        return insertResult.insertId;
      }
    } catch (err) {
      console.error("Error al buscar o crear el equipo:", err);
      throw err;
    }
  };

  try {
    const values = await Promise.all(
      jugadores.map(async (jugador) => {
        const id_equipo = await getOrCreateTeamId(jugador.equipo);
        return [
          jugador.dni,
          jugador.nombre,
          jugador.apellido,
          jugador.posicion,
          id_equipo,
        ];
      })
    );

    const query =
      "INSERT INTO jugadores (dni, nombre, apellido, posicion, id_equipo) VALUES ?";
    await query(query, [values]);

    res.status(200).send("Datos importados correctamente");
  } catch (error) {
    console.error("Error durante la importación:", error);
    res.status(500).send("Error interno del servidor");
  }
};

const deleteJugador = async (req, res) => {
  const { id } = req.body;
  try {
    const sql = "DELETE FROM jugadores WHERE id_jugador = ?";
    await query(sql, [id]);
    res.status(200).send("Jugador eliminado correctamente");
  } catch (err) {
    console.error("Error eliminando el jugador:", err);
    res.status(500).send("Error eliminando el jugador");
  }
};

const crearPartido = async (req, res) => {
  const {
    id_temporada,
    id_equipoLocal,
    id_equipoVisita,
    jornada,
    dia,
    hora,
    cancha,
    arbitro,
    id_planillero,
  } = req.body;

  try {
    await query(
      `
      INSERT INTO partidos
      (id_temporada, id_equipoLocal, id_equipoVisita, jornada, dia, hora, cancha, arbitro, id_planillero) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        id_temporada,
        id_equipoLocal,
        id_equipoVisita,
        jornada,
        dia,
        hora,
        cancha,
        arbitro,
        id_planillero,
      ]
    );
    res.send("Temporada registrada con éxito");
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const updatePartido = async (req, res) => {
  const { goles_local, goles_visita, descripcion, id_partido } = req.body;
  console.log("Request received:", req.body);

  if (!id_partido) {
    return res.status(400).send("ID de partido es requerido");
  }

  try {
    const sql = `
      UPDATE partidos
      SET 
          goles_local = ?, 
          goles_visita = ?, 
          descripcion = ?
      WHERE id_partido = ?
    `;
    await query(sql, [goles_local, goles_visita, descripcion, id_partido]);
    res.send("Usuario actualizado exitosamente");
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).send("Error interno del servidor");
  }
};

const crearExpulsion = async (req, res) => {
  const { id_jugador, id_equipo, id_edicion, id_categoria, motivo } = req.body;

  try {
    const result = await query(
      `
      SELECT COUNT(*) as expulsiones_activas 
      FROM expulsados e
      JOIN partidos p ON e.id_partido = p.id_partido
      WHERE e.id_jugador = ? 
        AND p.id_categoria = ?
        AND e.estado = 'A'
      `,
      [id_jugador, id_categoria]
    );

    const { expulsiones_activas } = result[0];
    if (expulsiones_activas > 0) {
      return res.status(400).json({ mensaje: "El jugador ya tiene una expulsión activa en la categoría" });
    }

    await query(`CALL sp_crear_expulsion(?, ?, ?, ?, ?)`, [id_jugador, id_equipo, id_edicion, id_categoria, motivo]);
    res.status(201).json({ mensaje: "Expulsión creada con éxito" });

  } catch (err) {
    console.error("Error inesperado:", err);
    if (err.code === "ER_SIGNAL_EXCEPTION" || err.sqlState === "45000") {
      return res.status(400).json({ error: err.sqlMessage || "Error en el procedimiento almacenado" });
    }
    res.status(500).send("Error al procesar la solicitud");
  }
};

const borrarExpulsion = async (req, res) => {
  const { id_expulsion, id_categoria, id_jugador } = req.body;

  if (!id_expulsion || !id_categoria || !id_jugador) {
    return res.status(400).send("Faltan datos excluyentes");
  }

  try {
    const result = await query(
      `
      SELECT * 
      FROM expulsados 
      WHERE id_expulsion = ? 
        AND id_jugador = ? 
        AND estado IN ('A', 'I') 
        AND id_partido IN (
          SELECT id_partido 
          FROM partidos 
          WHERE id_categoria = ?
      )
      `,
      [id_expulsion, id_jugador, id_categoria]
    );

    if (result.length === 0) {
      return res.status(404).send("No se encontró una expulsión activa o inactiva para el jugador en esta categoría");
    }

    await query(`DELETE FROM expulsados WHERE id_expulsion = ?`, [id_expulsion]);
    await query(
      `
      UPDATE planteles
      SET sancionado = 'N'
      WHERE id_jugador = ? AND id_categoria = ?
      `,
      [id_jugador, id_categoria]
    );

    res.status(200).send("Expulsión eliminada y estado actualizado correctamente");
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const actualizarExpulsion = async (req, res) => {
  const { id_expulsion, fechas, fechas_restantes, multa } = req.body;

  if (!id_expulsion || typeof fechas !== "number" || typeof fechas_restantes !== "number" || !multa) {
    return res.status(400).send("Falta información excluyente");
  }

  try {
    const result = await query(
      `
      SELECT id_partido, id_jugador
      FROM expulsados
      WHERE id_expulsion = ?
      `,
      [id_expulsion]
    );

    if (result.length === 0) {
      return res.status(400).send("Error al encontrar la expulsión o no existe");
    }

    const { id_partido, id_jugador } = result[0];

    if (fechas_restantes === 0) {
      const catResult = await query(
        `
        SELECT id_categoria
        FROM partidos
        WHERE id_partido = ?
        `,
        [id_partido]
      );

      if (catResult.length === 0) {
        return res.status(400).send("Error al encontrar la categoría del partido");
      }

      const { id_categoria } = catResult[0];

      await query(
        `
        UPDATE planteles
        SET sancionado = 'N'
        WHERE id_jugador = ? AND id_categoria = ?
        `,
        [id_jugador, id_categoria]
      );

      await query(
        `
        UPDATE expulsados
        SET estado = 'I', fechas_restantes = 0
        WHERE id_expulsion = ?
        `,
        [id_expulsion]
      );

      return res.send("Expulsión actualizada a inactiva y sanción eliminada");
    } else {
      await query(
        `
        UPDATE expulsados
        SET fechas = ?, fechas_restantes = ?, multa = ?, estado = 'A'
        WHERE id_expulsion = ?
        `,
        [fechas, fechas_restantes, multa, id_expulsion]
      );

      return res.send("Expulsión actualizada correctamente");
    }
  } catch (err) {
    res.status(400).send("Error al actualizar la expulsión");
  }
};

const getFases = async (req, res) => {
  const { id_categoria } = req.query;

  try {
    const result = await query(
      "SELECT * FROM fases WHERE id_categoria = ?",
      [id_categoria]
    );
    res.send(result);
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const createFase = async (req, res) => {
  const { id_categoria, numero_fase } = req.body;
  console.log(id_categoria, numero_fase);

  if (!id_categoria || !numero_fase) {
    return res.status(400).json({ mensaje: "Faltan datos para crear la fase" });
  }

  try {
    const result = await query(
      "INSERT INTO fases (id_categoria, numero_fase) VALUES (?, ?)",
      [parseInt(id_categoria), parseInt(numero_fase)]
    );
    res.send(result);
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const getPartidoZona = async (req, res) => {
  const { id_zona, vacante } = req.query;

  try {
    const [partidos] = await query(
      "SELECT * FROM partidos WHERE id_zona = ?",
      [id_zona]
    );

    const partidosFiltrados = partidos.filter(partido =>
      partido.vacante_local == vacante || partido.vacante_visita == vacante
    );

    if (partidosFiltrados.length > 0) {
      return res.json(partidosFiltrados);
    } else {
      return res.status(404).send("No se encontraron partidos con la vacante especificada");
    }
  } catch (err) {
    res.status(500).send("Error interno del servidor");
  }
};

const checkEquipoPlantel = async (req, res) => {
  const { id_equipo, id_edicion } = req.query;

  if (!id_edicion || !id_equipo) {
    return res.status(500).json({ mensaje: 'Faltan datos importantes' });
  }

  try {
    const resultActual = await query(
      `
      SELECT 
        COUNT(p.id_jugador) AS total_jugadores
      FROM 
        planteles p
      WHERE 
        p.id_equipo = ? AND p.id_edicion = ?;
      `,
      [id_equipo, id_edicion]
    );

    if (resultActual[0]?.total_jugadores > 0) {
      return res.status(400).json({ mensaje: "El equipo ya tiene un plantel en esta edición." });
    }

    const resultOtras = await query(
      `
      SELECT 
        p.id_edicion,
        p.id_categoria,
        COUNT(p.id_jugador) AS total_jugadores,
        CONCAT(e.nombre, ' ', e.temporada) AS nombre_edicion
      FROM 
        planteles p
      INNER JOIN
        ediciones e ON p.id_edicion = e.id_edicion
      WHERE 
        p.id_equipo = ? AND p.id_edicion != ?
      GROUP BY 
        p.id_edicion;
      `,
      [id_equipo, id_edicion]
    );

    if (resultOtras.length === 0) {
      return res.status(404).json({ mensaje: "No se encontraron planteles en otras ediciones." });
    }

    return res.status(200).json({ data: resultOtras });

  } catch (err) {
    res.status(500).json({ mensaje: "Error en la consulta de la base de datos." });
  }
};

const copiarPlantelesTemporada = async (req, res) => {
  const { id_equipo, id_categoria_previo, id_categoria, id_edicion } = req.body;

  if (!id_equipo || !id_categoria_previo || !id_categoria || !id_edicion) {
    return res.status(400).json({ mensaje: "Faltan datos importantes" });
  }

  try {
    await query(
      `CALL sp_copiar_planteles_temporada(?, ?, ?, ?)`,
      [id_equipo, id_categoria_previo, id_categoria, id_edicion]
    );

    return res.status(200).json({ mensaje: "Planteles copiados correctamente" });
  } catch (err) {
    console.error("Error al copiar planteles temporada:", err);
    return res.status(500).json({ mensaje: "Error al copiar planteles" });
  }
};

const eliminarFase = async (req, res) => {
  const { id } = req.body;
  const { id_categoria, numero_fase } = id;

  if (!id_categoria || !numero_fase) {
    return res.status(400).json({ mensaje: "Faltan datos para eliminar la fase" });
  }

  try {
    await query(
      `DELETE FROM fases WHERE id_categoria = ? AND numero_fase = ?`,
      [id_categoria, numero_fase]
    );
    return res.status(200).json({ mensaje: "Fase eliminada correctamente" });
  } catch (err) {
    console.error("Error al eliminar fase:", err);
    return res.status(500).json({ mensaje: "Error al eliminar fase" });
  }
};

module.exports = {
  crearCategoria,
  getCategorias,
  deleteCategoria,

  crearTorneo,
  getTorneos,
  deleteTorneo,

  crearSede,
  getSedes,
  deleteSede,

  crearAnio,
  importarAnio,
  deleteAnio,
  getAnios,

  crearTemporada,
  getTemporadas,
  deleteTemporada,

  crearEquipo,

  getDivisiones,
  crearDivision,

  getRoles,
  getUsuarios,
  updateUsuario,
  deleteUsuario,

  crearPartido,
  updatePartido,
  crearJugador,
  importarJugadores,
  deleteJugador,

  crearExpulsion,
  borrarExpulsion,
  actualizarExpulsion,

  getFases,
  createFase,
  getPartidoZona,

  checkEquipoPlantel,
  copiarPlantelesTemporada,
  eliminarFase
};
