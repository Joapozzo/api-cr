const { query } = require("../utils/db");

const getJugadores = async (req, res) => {
  try {
    const result = await query(`SELECT 
      j.id_jugador, 
      j.dni, 
      j.nombre, 
      j.apellido, 
      j.posicion, 
      j.id_equipo,
      j.img,
      j.sancionado,
      j.email,
      j.eventual
      FROM jugadores AS j
      LEFT JOIN equipos AS e ON e.id_equipo = j.id_equipo
      ORDER BY 
        j.apellido`);
    res.send(result);
  } catch (error) {
    res.status(500).send("Error interno del servidor");
    console.error("Error en la consulta:", error);
  }
};

const deleteJugador = async (req, res) => {
  const { id } = req.body;

  // Sentencia SQL para eliminar el año por ID
  const sql = "DELETE FROM jugadores WHERE id_jugador = ?";
  try {
    await query(sql, [id]);
    res.status(200).send("Jugador eliminado correctamente");
  } catch (error) {
    res.status(500).send("Error eliminando el jugador");
    console.error("Error eliminando el jugador:", error);
  }
};

const updateJugador = async (req, res) => {
  const {
    dni,
    nombre,
    apellido,
    posicion,
    id_equipo,
    id_jugador,
    jugador_eventual,
  } = req.body;

  if (!id_jugador) {
    return res.status(400).send("ID de jugador es requerido");
  }

  try {
    const sqlCheckEventual = `
      SELECT eventual FROM planteles
      WHERE id_jugador = ? AND id_equipo = ?
    `;

    const [result] = await query(sqlCheckEventual, [id_jugador, id_equipo]);

    if (result.length === 0) {
      return res.status(404).send("Jugador no encontrado en planteles");
    }

    const currentEventual = result[0].eventual;

    if (currentEventual !== jugador_eventual) {
      const sqlUpdateEventual = `
        UPDATE planteles
        SET eventual = ?
        WHERE id_jugador = ? AND id_equipo = ?
      `;

      await query(sqlUpdateEventual, [jugador_eventual, id_jugador, id_equipo]);
    }

    await updateJugadorInfo();
    res.send("Jugador actualizado exitosamente");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error interno del servidor");
  }

  async function updateJugadorInfo() {
    const sqlUpdateJugador = `
      UPDATE jugadores
      SET 
        dni = ?, 
        nombre = ?, 
        apellido = ?, 
        posicion = ?, 
        id_equipo = ?
      WHERE id_jugador = ?
    `;

    await query(sqlUpdateJugador, [
      dni,
      nombre,
      apellido,
      posicion,
      id_equipo,
      id_jugador,
    ]);
  }
};
//! No esta migrado a trycatch
const importarJugadores = async (req, res) => {
  const jugadores = req.body;
  if (!Array.isArray(jugadores)) {
    return res.status(400).send("Invalid data format");
  }

  const getOrCreateTeamId = async (equipo) => {
    return new Promise((resolve, reject) => {
      db.query(
        "SELECT id_equipo FROM equipos WHERE nombre = ?",
        [equipo],
        (err, result) => {
          if (err) {
            console.error("Error al buscar el equipo:", err);
            return reject(err);
          }
          if (result.length > 0) {
            resolve(result[0].id_equipo);
          } else {
            db.query(
              "INSERT INTO equipos (nombre) VALUES (?)",
              [equipo],
              (err, result) => {
                if (err) {
                  console.error("Error al crear el equipo:", err);
                  return reject(err);
                }
                resolve(result.insertId);
              }
            );
          }
        }
      );
    });
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

    db.query(query, [values], (err, result) => {
      if (err) {
        console.error("Error al insertar jugadores:", err);
        return res
          .status(500)
          .send("Error al insertar datos en la base de datos");
      }
      res.status(200).send("Datos importados correctamente");
    });
  } catch (error) {
    console.error("Error durante la importación:", error);
    res.status(500).send("Error interno del servidor");
  }
};

const crearJugador = async (req, res) => {
  const {
    apellido,
    dni,
    id_categoria,
    id_edicion,
    id_equipo,
    nombre,
    posicion,
  } = req.body;

  const valores = [
    dni,
    nombre,
    apellido,
    posicion,
    id_equipo,
    id_edicion,
    id_categoria,
  ];

  try {
    await query("CALL sp_crear_jugador(?, ?, ?, ?, ?, ?, ?)", valores);
    res.status(200).send("Jugador creado exitosamente");
  } catch (error) {
    res.status(500).send("Error interno del servidor");
    console.error("Error al crear el jugador:", error);
  }
};

const agregarJugadorPlantel = async (req, res) => {
  const { id_jugador, id_equipo, id_categoria, id_edicion } = req.body;

  const query = `
  INSERT INTO planteles (id_jugador, id_equipo, id_categoria, id_edicion)
  VALUES (?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE 
      id_jugador = VALUES(id_jugador)
`;

  // Pasa los valores como un array
  const values = [id_jugador, id_equipo, id_categoria, id_edicion];
  try {
    await query(query, values);
    res.status(200).send("Jugador creado exitosamente");
  } catch (error) {
    res.status(500).send("Error interno del servidor");
    console.error("Error al crear el jugador:", error);
  }
};

const eliminarJugadorPlantel = async (req, res) => {
  const { id_jugador, id_equipo, id_edicion, id_categoria } = req.body;

  // Sentencia SQL para eliminar el jugador de la tabla planteles
  const deletePlantelSQL = `
        DELETE FROM planteles 
        WHERE id_jugador = ? 
        AND id_equipo = ? 
        AND id_edicion = ? 
        AND id_categoria = ?`;
  try {
    await query(deletePlantelSQL, [
      id_jugador,
      id_equipo,
      id_edicion,
      id_categoria,
    ]);
    res.status(200).send("Jugador eliminado del plantel correctamente");
  } catch (error) {
    res.status(500).send("Error eliminando el jugador del plantel");
    console.error("Error eliminando el jugador del plantel:", error);
  }
};

// ESTO ES POR EQUIPO, PARA TRAER J.E. DE CADA EQUIPO Y FACILITAR LA INFORMACION
const verificarJugadorEventual = async (req, res) => {
  const { dni, id_categoria, id_equipo } = req.query;

  const encontrarJugador = `
    SELECT 
        p.id_jugador,
        p.id_categoria,
        p.id_equipo,
        j.dni,
        e.nombre
    FROM
        planteles AS p
        INNER JOIN jugadores as j ON p.id_jugador = j.id_jugador
        INNER JOIN equipos as e ON p.id_equipo = e.id_equipo
    WHERE
        p.id_equipo != ?
        AND j.dni = ?
        AND p.id_categoria = ?;`;

  try {
    const [result] = await query(encontrarJugador, [
      dni,
      id_categoria,
      id_equipo,
    ]);
    if (result.length > 0) {
      // Se encontró un jugador con ese DNI en la categoría especificada
      res.status(200).json({ found: true, jugador: result[0] });
    } else {
      // No se encontró un jugador
      res.status(200).json({ found: false });
    }
  } catch (error) {
    res.status(500).send("Error interno del servidor");
    console.error("Error verificando el jugador eventual:", error);
  }
};

const verificarCategoriaJugadorEventual = async (req, res) => {
  const { dni, id_categoria, id_equipo } = req.query;

  try {
    const encontrarJugador = `
      SELECT 
        p.id_jugador,
        p.id_categoria,
        p.id_equipo,
        j.id_jugador,
        j.dni,
        j.nombre,
        j.apellido
      FROM
        planteles AS p
        INNER JOIN jugadores AS j ON p.id_jugador = j.id_jugador
      WHERE
        j.dni = ?
    `;

    const [result] = await query(encontrarJugador, [dni]);

    if (result.length > 0) {
      const matchCategory = result.some(
        (jugador) => Number(jugador.id_categoria) === Number(id_categoria)
      );

      const matchEquipo = result.some(
        (jugador) =>
          Number(jugador.id_categoria) === Number(id_categoria) &&
          Number(jugador.id_equipo) === Number(id_equipo)
      );

      const response = {
        found: true,
        matchCategory,
        jugador: result[0],
      };

      if (matchEquipo) {
        response.message = "El jugador ya pertenece al equipo";
      }

      return res.status(200).json(response);
    } else {
      return res.status(200).json({ found: false });
    }
  } catch (err) {
    console.error("Error verificando el jugador eventual:", err);
    return res.status(500).send("Error verificando el jugador eventual");
  }
};

const getJugadoresDestacados = async (req, res) => {
  const { id_categoria, jornada } = req.query;
  try {
    const result = await query(`SELECT 
      jd.id_partido,
      jd.id_equipo,
      jd.id_jugador,
      jd.id_categoria,
      jd.dt,
      jd.posicion,
      p.jornada
  FROM 
      jugadores_destacados jd
  JOIN 
      partidos p
  ON 
      jd.id_partido = p.id_partido
  ORDER BY 
      p.jornada ASC, jd.posicion ASC;
  `, [id_categoria, jornada]);
    res.send(result);
  } catch (error) {
    res.status(500).send("Error interno del servidor");
    console.error("Error en la consulta:", error);
  }
};

const actualizarJugadorDestacado = async (req, res) => {
  const { id_categoria, jornada, id_equipo, id_jugador, posicion } = req.body;

  // Validaciones de datos
  if (!id_categoria || !jornada || !id_equipo || !id_jugador || !posicion) {
    return res.status(400).json({
      error:
        "Faltan datos obligatorios (id_categoria, jornada, id_equipo, id_jugador, posicion)",
    });
  }

  if (
    typeof jornada !== "number" ||
    typeof id_equipo !== "number" ||
    typeof id_jugador !== "number"
  ) {
    return res.status(400).json({
      error: "Los campos jornada, id_equipo e id_jugador deben ser números",
    });
  }

  try {
    // Primero obtenemos el id_partido en el que jugó este jugador en la jornada y categoría
    const getPartidoQuery = `
      SELECT p.id_partido
      FROM partidos AS p
      INNER JOIN formaciones AS f ON f.id_partido = p.id_partido
      WHERE f.id_jugador = ? AND p.jornada = ? AND p.id_categoria = ?
      LIMIT 1;
    `;
    const [partidoResult] = await query(getPartidoQuery, [id_jugador, jornada, id_categoria]);
    const id_partido = partidoResult.length > 0 ? partidoResult[0].id_partido : null;

    // Verificamos si el jugador ya está destacado en la jornada actual
    const checkQuery = `
      SELECT jd.*
      FROM jugadores_destacados AS jd
      INNER JOIN partidos AS p ON p.id_partido = jd.id_partido
      WHERE p.jornada = ? AND jd.id_equipo = ? AND jd.id_jugador = ?;
    `;
    const [result] = await query(checkQuery, [jornada, id_equipo, id_jugador]);

    if (result.length > 0) {
      // Si el jugador ya está destacado, actualizamos la posición y el campo dt
      const updateQuery = `
        UPDATE jugadores_destacados AS jd
        INNER JOIN partidos AS p ON p.id_partido = jd.id_partido
        SET jd.posicion = ?, jd.dt = 'S'
        WHERE jd.id_jugador = ? AND jd.id_equipo = ? AND p.jornada = ? AND p.id_categoria = jd.id_categoria;
      `;
      const [updateResult] = await query(updateQuery, [posicion, id_jugador, id_equipo, jornada]);

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({
          error: "No se encontró el jugador destacado con los datos proporcionados",
        });
      }

      res.status(200).json({
        message: "Jugador destacado actualizado correctamente",
        status: 200,
      });
    } else {
      // Si el jugador NO está en la tabla para la jornada actual, lo insertamos con el id_partido obtenido
      const insertQuery = `
        INSERT INTO jugadores_destacados (id_partido, id_equipo, id_jugador, posicion, dt, id_categoria)
        VALUES (?, ?, ?, ?, 'S', ?);
      `;
      await query(insertQuery, [id_partido, id_equipo, id_jugador, posicion, id_categoria]);

      res.status(201).json({
        status: 200,
        message: "Jugador destacado insertado correctamente",
      });
    }

  } catch (err) {
    console.error("Error en actualizarJugadorDestacado:", err);

    const errorMessage = err.message || "Error desconocido";

    if (errorMessage.includes("obtener el ID del partido")) {
      return res.status(500).json({
        error: "Error al obtener el ID del partido",
        details: err,
      });
    }

    if (errorMessage.includes("verificar si el jugador está destacado")) {
      return res.status(500).json({
        error: "Error al verificar si el jugador está destacado en esta jornada",
        details: err,
      });
    }

    if (errorMessage.includes("actualizar el jugador destacado")) {
      return res.status(500).json({
        error: "Error al actualizar el jugador destacado",
        details: err,
      });
    }

    return res.status(500).json({
      error: "Error al insertar el nuevo jugador destacado",
      details: err,
    });
  }
};

const resetearPosicionesYDT = async (req, res) => {
  const { jornada } = req.query;

  if (!jornada) {
    return res.status(400).json({ error: "La jornada es obligatoria" });
  }

  if (isNaN(jornada)) {
    return res.status(400).json({ error: "La jornada debe ser un número" });
  }

  try {
    const sql = `
      UPDATE jugadores_destacados AS jd
      INNER JOIN partidos AS p ON p.id_partido = jd.id_partido
      SET jd.posicion = NULL, jd.dt = 'N'
      WHERE p.jornada = ?
      AND p.id_categoria = jd.id_categoria;
    `;

    const [result] = await query(sql, [jornada]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "No se encontraron jugadores destacados para la jornada proporcionada",
      });
    }

    res.status(200).json({ message: "Posiciones y DT reseteados correctamente" });

  } catch (err) {
    console.error("Error al resetear posiciones y DT:", err);
    return res.status(500).json({
      error: "Error al resetear posiciones y DT",
      details: err,
    });
  }
};

const traerJugadoresPorCategoria = async (req, res) => {
  const { id_categoria, jornada } = req.query;

  const sql = `
SELECT DISTINCT
    pl.id_equipo,
    j.id_jugador,
    j.nombre,
    j.apellido
FROM jugadores AS j
INNER JOIN planteles AS pl
    ON pl.id_jugador = j.id_jugador
    AND pl.id_categoria = ?
INNER JOIN formaciones AS f
    ON f.id_jugador = j.id_jugador
    AND f.dorsal != 0
INNER JOIN partidos AS p
    ON p.id_partido = f.id_partido
    AND p.jornada = ?
    AND p.id_categoria = ?
LEFT JOIN jugadores_destacados AS jd
    ON j.id_jugador = jd.id_jugador
WHERE pl.sancionado = 'N'
ORDER BY j.apellido, j.nombre;
    `;

  try {
    const result = await query(sql, [id_categoria, jornada, id_categoria]);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send("Error interno del servidor");
    console.error("Error en la consulta:", error);
  }

  db.query(query, [id_categoria, jornada, id_categoria], (err, result) => {
    if (err) return res.status(500).send("Error interno del servidor");
    res.status(200).send(result);
  });
};

const traerDreamTeamFecha = async (req, res) => {
  const { id_categoria, jornada } = req.query;

  if (!id_categoria || !jornada) {
    return res.status(400).json({ mensaje: "Falta parámetros" });
  }

  try {
    const sql = `
      SELECT jd.id_jugador,
      jd.id_partido,
      j.nombre,
      j.apellido,
      jd.id_equipo,
      jd.posicion
      FROM
      jugadores_destacados AS jd
      INNER JOIN jugadores AS j ON j.id_jugador = jd.id_jugador
      INNER JOIN partidos AS p ON p.id_partido = jd.id_partido
      INNER JOIN categorias AS c ON c.id_categoria = p.id_categoria
      WHERE c.id_categoria = ?
      AND p.jornada = ?
      AND jd.dt = 'S'
    `;

    const result = await query(sql, [id_categoria, jornada]);

    res.status(200).json(result);
  } catch (err) {
    console.error("Error al traer el Dream Team:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

const eliminarJugadorDt = async (req, res) => {
  const { id_partido, id_jugador, id_equipo } = req.body;

  if (!id_partido || !id_jugador || !id_equipo) {
    return res.status(400).json({ mensaje: "Datos incompletos" });
  }

  try {
    const sql = `
      UPDATE jugadores_destacados AS jd
      SET dt = 'N', posicion = NULL
      WHERE id_partido = ?
      AND id_jugador = ?
      AND id_equipo = ?
    `;

    const [result] = await query(sql, [id_partido, id_jugador, id_equipo]);

    res.status(200).json({ mensaje: "Jugador eliminado del dreamteam", status: 200 });
  } catch (err) {
    console.error("Error eliminando el jugador del Dream Team:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

module.exports = {
  getJugadores,
  deleteJugador,
  updateJugador,
  importarJugadores,
  crearJugador,
  eliminarJugadorPlantel,
  agregarJugadorPlantel,
  verificarJugadorEventual,
  verificarCategoriaJugadorEventual,
  getJugadoresDestacados,
  actualizarJugadorDestacado,
  resetearPosicionesYDT,
  traerJugadoresPorCategoria,
  traerDreamTeamFecha,
  eliminarJugadorDt,
};
