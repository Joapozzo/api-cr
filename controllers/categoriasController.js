const { query } = require("../utils/db");

const getCategorias = async (req, res) => {
  const { id_edicion } = req.query;
  let sql;
  let values = [];

  if (!id_edicion) {
    sql = `
    SELECT
        c.publicada,
        c.genero,
        c.tipo_futbol,
        c.duracion_tiempo,
        c.duracion_entretiempo,
        c.id_categoria,
        c.id_edicion, 
        c.nombre AS nombre,
        e.temporada,
        c.puntos_victoria,
        c.puntos_empate,
        c.puntos_derrota,
        c.publicada,
        CONCAT(
            IFNULL((SELECT COUNT(*) FROM partidos p WHERE p.id_categoria = c.id_categoria AND p.estado = 'F'), 0),
            ' / ',
            IFNULL((SELECT COUNT(*) FROM partidos p WHERE p.id_categoria = c.id_categoria), 0)
        ) AS partidos,
        IFNULL((SELECT COUNT(*) FROM temporadas t WHERE t.id_categoria = c.id_categoria), 0) AS equipos,
        CONCAT(
            IFNULL((SELECT COUNT(*) FROM planteles pl WHERE pl.id_categoria = c.id_categoria), 0),
            ' ',
            IFNULL(
                CASE 
                    WHEN c.genero = 'F' THEN 
                        CASE WHEN (SELECT COUNT(*) FROM planteles pl WHERE pl.id_categoria = c.id_categoria) = 1 THEN 'jugadora' ELSE 'jugadoras' END
                    ELSE 
                        CASE WHEN (SELECT COUNT(*) FROM planteles pl WHERE pl.id_categoria = c.id_categoria) = 1 THEN 'jugador' ELSE 'jugadores' END
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
    JOIN
        ediciones e ON c.id_edicion = e.id_edicion
    ORDER BY 
        c.id_categoria DESC
  `;
  } else {
    sql = `
      SELECT
          c.publicada,
          c.genero,
          c.tipo_futbol,
          c.duracion_tiempo,
          c.duracion_entretiempo,
          c.id_categoria,
          c.id_edicion, 
          c.nombre AS nombre,
          c.puntos_victoria,
          c.puntos_empate,
          c.puntos_derrota,
          c.publicada,
          CONCAT(
              IFNULL((SELECT COUNT(*) FROM partidos p WHERE p.id_categoria = c.id_categoria AND p.estado = 'F'), 0),
              ' / ',
              IFNULL((SELECT COUNT(*) FROM partidos p WHERE p.id_categoria = c.id_categoria), 0)
          ) AS partidos,
          IFNULL((SELECT COUNT(*) FROM temporadas t WHERE t.id_categoria = c.id_categoria), 0) AS equipos,
          CONCAT(
              IFNULL((SELECT COUNT(*) FROM planteles pl WHERE pl.id_categoria = c.id_categoria), 0),
              ' ',
              IFNULL(
                  CASE 
                      WHEN c.genero = 'F' THEN 
                          CASE WHEN (SELECT COUNT(*) FROM planteles pl WHERE pl.id_categoria = c.id_categoria) = 1 THEN 'jugadora' ELSE 'jugadoras' END
                      ELSE 
                          CASE WHEN (SELECT COUNT(*) FROM planteles pl WHERE pl.id_categoria = c.id_categoria) = 1 THEN 'jugador' ELSE 'jugadores' END
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
      WHERE c.id_edicion = ?
      ORDER BY 
          c.id_categoria DESC
    `;
    values = [id_edicion];
  }

  try {
    const result = await query(sql, values);
    res.json(result);
  } catch (err) {
    console.error("❌ Error en getCategorias:", err.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const crearCategoria = async (req, res) => {
  const {
    id_edicion,
    nombre,
    genero,
    tipo_futbol,
    duracion_tiempo,
    duracion_entretiempo,
    puntos_victoria,
    puntos_empate,
    puntos_derrota,
  } = req.body;

  const sql = `
    INSERT INTO 
        categorias(id_edicion, nombre, genero, tipo_futbol, duracion_tiempo, duracion_entretiempo, puntos_victoria, puntos_empate, puntos_derrota) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  try {
    await query(sql, [
      id_edicion,
      nombre,
      genero,
      tipo_futbol,
      duracion_tiempo,
      duracion_entretiempo,
      puntos_victoria,
      puntos_empate,
      puntos_derrota,
    ]);
    res.send("Categoria registrada con éxito");
  } catch (err) {
    console.error("❌ Error en crearCategoria:", err.message);
    res.status(500).send("Error interno del servidor");
  }
};

const actualizarCategoria = async (req, res) => {
  const {
    nombre,
    genero,
    tipo_futbol,
    duracion_tiempo,
    duracion_entretiempo,
    id_categoria,
    puntos_victoria,
    puntos_empate,
    puntos_derrota,
  } = req.body;

  if (!id_categoria) {
    return res.status(400).send("ID de edicion es requerido");
  }

  const sql = `
    UPDATE categorias
    SET 
        nombre = ?, 
        genero = ?, 
        tipo_futbol = ?, 
        duracion_tiempo = ?, 
        duracion_entretiempo = ?,
        puntos_victoria = ?,
        puntos_empate = ?,
        puntos_derrota = ?
    WHERE id_categoria = ?
  `;

  try {
    await query(sql, [
      nombre,
      genero,
      tipo_futbol,
      duracion_tiempo,
      duracion_entretiempo,
      puntos_victoria,
      puntos_empate,
      puntos_derrota,
      id_categoria,
    ]);
    res.send("Categoria actualizada exitosamente");
  } catch (err) {
    console.error("❌ Error en actualizarCategoria:", err.message);
    res.status(500).send("Error interno del servidor");
  }
};

const publicarCategoria = async (req, res) => {
  const { publicada, id_categoria } = req.body;

  if (!id_categoria) {
    return res.status(400).send("ID de edicion es requerido");
  }

  const sql = `
    UPDATE categorias
    SET publicada = ?
    WHERE id_categoria = ?
  `;

  try {
    await query(sql, [publicada, id_categoria]);
    res.send("Categoria actualizada exitosamente");
  } catch (err) {
    console.error("❌ Error en publicarCategoria:", err.message);
    res.status(500).send("Error interno del servidor");
  }
};

const eliminarCategoria = async (req, res) => {
  const { id } = req.body;
  console.log(id);

  const sql = "DELETE FROM categorias WHERE id_categoria = ?";

  try {
    await query(sql, [id]);
    res.status(200).send("Categoria eliminada correctamente");
  } catch (err) {
    console.error("❌ Error en eliminarCategoria:", err.message);
    res.status(500).send("Error eliminando la categoria");
  }
};

module.exports = {
  getCategorias,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
  publicarCategoria,
};
