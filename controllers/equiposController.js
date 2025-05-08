const { query } = require("../utils/db");

const getEquipos = async (req, res) => {
  const { id_categoria } = req.query;

  let sql;
  let params = [];

  if (id_categoria) {
    sql = `
            SELECT
                e.id_equipo,
                e.nombre,
                e.img,
                e.id_categoria,
                CONCAT(
                    IFNULL((SELECT COUNT(*) 
                            FROM planteles p 
                            WHERE p.id_equipo = e.id_equipo 
                              AND p.id_categoria = e.id_categoria 
                              AND p.eventual = 'N'), 0),
                    ' ',
                    IFNULL(
                        CASE 
                            WHEN c.genero = 'F' THEN 
                                CASE WHEN (SELECT COUNT(*) 
                                            FROM planteles p 
                                            WHERE p.id_equipo = e.id_equipo 
                                              AND p.id_categoria = e.id_categoria 
                                              AND p.eventual = 'N') = 1 
                                    THEN 'jugadora' 
                                    ELSE 'jugadoras' 
                                END
                            ELSE 
                                CASE WHEN (SELECT COUNT(*) 
                                            FROM planteles p 
                                            WHERE p.id_equipo = e.id_equipo 
                                              AND p.id_categoria = e.id_categoria 
                                              AND p.eventual = 'N') = 1 
                                    THEN 'jugador' 
                                    ELSE 'jugadores' 
                                END
                        END,
                        ''
                    )
                ) AS jugadores,
                CONCAT(
                    IFNULL((SELECT COUNT(*) 
                            FROM planteles p 
                            WHERE p.id_equipo = e.id_equipo 
                              AND p.id_categoria = e.id_categoria 
                              AND p.eventual = 'S'), 0),
                    ' ',
                    IFNULL(
                        CASE 
                            WHEN c.genero = 'F' THEN 
                                CASE WHEN (SELECT COUNT(*) 
                                            FROM planteles p 
                                            WHERE p.id_equipo = e.id_equipo 
                                              AND p.id_categoria = e.id_categoria 
                                              AND p.eventual = 'S') = 1 
                                    THEN 'jugadora' 
                                    ELSE 'jugadoras' 
                                END
                            ELSE 
                                CASE WHEN (SELECT COUNT(*) 
                                            FROM planteles p 
                                            WHERE p.id_equipo = e.id_equipo 
                                              AND p.id_categoria = e.id_categoria 
                                              AND p.eventual = 'S') = 1 
                                    THEN 'jugador' 
                                    ELSE 'jugadores' 
                                END
                        END,
                        ''
                    )
                ) AS jugadores_eventuales,
                CONCAT(
                    IFNULL((SELECT COUNT(*) 
                            FROM planteles p 
                            LEFT JOIN jugadores j ON p.id_jugador = j.id_jugador
                            WHERE p.id_equipo = e.id_equipo 
                              AND p.id_categoria = e.id_categoria 
                              AND j.dni IS NULL), 0),
                    ' ',
                    IFNULL(
                        CASE 
                            WHEN c.genero = 'F' THEN 
                                CASE WHEN (SELECT COUNT(*) 
                                            FROM planteles p 
                                            LEFT JOIN jugadores j ON p.id_jugador = j.id_jugador
                                            WHERE p.id_equipo = e.id_equipo 
                                              AND p.id_categoria = e.id_categoria 
                                              AND j.dni IS NULL) = 1 
                                    THEN 'jugadora' 
                                    ELSE 'jugadoras' 
                                END
                            ELSE 
                                CASE WHEN (SELECT COUNT(*) 
                                            FROM planteles p 
                                            LEFT JOIN jugadores j ON p.id_jugador = j.id_jugador
                                            WHERE p.id_equipo = e.id_equipo 
                                              AND p.id_categoria = e.id_categoria 
                                              AND j.dni IS NULL) = 1 
                                    THEN 'jugador' 
                                    ELSE 'jugadores' 
                                END
                        END,
                        ''
                    )
                ) AS jugadores_sin_dni,
                z.id_zona,
                e.descripcion,
                CONCAT(c.nombre, ' ', z.nombre) AS nombre_categoria
            FROM 
                equipos AS e
            LEFT JOIN 
                categorias AS c ON c.id_categoria = e.id_categoria
            LEFT JOIN 
                zonas AS z ON z.id_zona = e.id_zona
            INNER JOIN 
                temporadas AS t ON t.id_equipo = e.id_equipo
            WHERE 
                t.id_categoria = ?
            ORDER BY 
                e.nombre;
        `;
    params = [id_categoria];
  } else {
    sql = `
            SELECT
                e.id_equipo,
                e.nombre,
                e.img,
                e.id_categoria,
                CONCAT(
                    IFNULL((SELECT COUNT(*) 
                            FROM planteles p 
                            WHERE p.id_equipo = e.id_equipo 
                              AND p.id_categoria = e.id_categoria 
                              AND p.eventual = 'N'), 0),
                    ' ',
                    IFNULL(
                        CASE 
                            WHEN c.genero = 'F' THEN 
                                CASE WHEN (SELECT COUNT(*) 
                                            FROM planteles p 
                                            WHERE p.id_equipo = e.id_equipo 
                                              AND p.id_categoria = e.id_categoria 
                                              AND p.eventual = 'N') = 1 
                                    THEN 'jugadora' 
                                    ELSE 'jugadoras' 
                                END
                            ELSE 
                                CASE WHEN (SELECT COUNT(*) 
                                            FROM planteles p 
                                            WHERE p.id_equipo = e.id_equipo 
                                              AND p.id_categoria = e.id_categoria 
                                              AND p.eventual = 'N') = 1 
                                    THEN 'jugador' 
                                    ELSE 'jugadores' 
                                END
                        END,
                        ''
                    )
                ) AS jugadores,
                CONCAT(c.nombre, ' ', z.nombre) AS nombre_categoria
            FROM 
                equipos AS e
            LEFT JOIN 
                categorias AS c ON c.id_categoria = e.id_categoria
            LEFT JOIN 
                zonas AS z ON z.id_zona = e.id_zona
            ORDER BY 
                e.nombre;
        `;
  }

  try {
    const result = await query(sql, params);
    res.send(result);
  } catch (error) {
    res.status(500).json({ mensaje: "Error interno del servidor" });
    console.error(error);
  }
};

const crearEquipo = async (req, res) => {
  const { nombre, id_categoria, id_edicion, id_zona, vacante } = req.body;

  try {
    await query(`CALL sp_crear_equipo(?, ?, ?, ?, ?)`, [nombre, id_categoria, id_edicion, id_zona, vacante]);
    res.status(200).json({ mensaje: "Equipo registrado con éxito" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error interno del servidor" });
    console.error(error);
  }
};

const updateEquipo = async (req, res) => {
  const { id_equipo, nombre, img } = req.body;

  // Validar que el id esté presente
  if (!id_equipo) {
    return res.status(400).send("ID de equipo es requerido");
  }

  // Construir la consulta SQL
  const sql = `
    UPDATE equipos
    SET 
      nombre = ?,
      img = ?
    WHERE id_equipo = ?;
  `;

  try {
    await query(sql, [nombre, img, id_equipo]);
    res.status(200).send("Equipo actualizado exitosamente");
  } catch (err) {
    console.error("Error al actualizar equipo:", err);
    res.status(500).send("Error interno del servidor");
  }
};

const getJugadoresEquipo = async (req, res) => {
  const { id_equipo, id_categoria } = req.query;
  try {
    if (!id_equipo) {
      return res.status(400).send("ID de equipo es requerido");
    }
    if (!id_categoria) {
      return res.status(400).send("ID de categoria es requerido");
    }
    const result = await query("CALL sp_jugadores_equipo(?, ?)", [id_equipo, id_categoria]);
    if (result.length === 0) {
      return res.status(404).send("No se encontraron jugadores en el equipo especificado.");
    }
    const rows = result[0];
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).send("Error interno del servidor");
    console.error(error);
  }
};

const getParticipacionesEquipo = async (req, res) => {
  const { id_equipo } = req.query;

  try {
    const result = await query("CALL sp_obtener_estadisticas_equipo_categoria(?)", [id_equipo]);

    if (!result || result.length === 0) {
      return res.status(404).send("No se encontraron estadisticas.");
    }

    const [rows] = result;

    res.status(200).json(rows);
  } catch (err) {
    console.error("Error al ejecutar el procedimiento almacenado:", err);

    if (err.sqlState === "45000") {
      return res.status(400).send(err.sqlMessage);
    }

    res.status(500).send("Error interno del servidor");
  }
};

const eliminarEquipo = async (req, res) => {
  const { id } = req.body;

  const sql = "DELETE FROM equipos WHERE id_equipo = ?";

  try {
    await query(sql, [id]);
    res.status(200).send("Edición eliminada correctamente");
  } catch (err) {
    console.error("Error eliminando la edición:", err);
    res.status(500).send("Error eliminando la edición");
  }
};

const actualizarCategoriaEquipo = async (req, res) => {
  const { id_categoriaNueva, id_equipo } = req.body;

  if (!id_equipo) {
    return res.status(400).send("ID de equipo es requerido");
  }

  const sql = `
    UPDATE equipos
    SET id_categoria = ?
    WHERE id_equipo = ?;
  `;

  try {
    await query(sql, [id_categoriaNueva, id_equipo]);
    res.send("Equipo actualizado exitosamente");
  } catch (err) {
    console.error("Error actualizando equipo:", err);
    res.status(500).send("Error interno del servidor");
  }
};

const actualizarApercibimientos = async (req, res) => {
  const { id_categoria, id_equipo, id_zona, apercibimientos } = req.body;

  if (!id_equipo) {
    return res.status(400).send("ID de equipo es requerido");
  }

  const sql = `
    UPDATE temporadas
    SET apercibimientos = ?
    WHERE id_equipo = ? AND id_categoria = ? AND id_zona = ?;
  `;

  try {
    await query(sql, [apercibimientos, id_equipo, id_categoria, id_zona]);
    res.send("Equipo actualizado exitosamente");
  } catch (err) {
    console.error("Error actualizando apercibimientos:", err);
    res.status(500).send("Error interno del servidor");
  }
};

module.exports = {
  getEquipos,
  crearEquipo,
  updateEquipo,
  actualizarCategoriaEquipo,
  getJugadoresEquipo,
  eliminarEquipo,
  actualizarApercibimientos,
  getParticipacionesEquipo,
};
