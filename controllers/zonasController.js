const { query } = require("../utils/db");

const crearZona = async (req, res) => {
  const { id_categoria, nombre, tipo_zona, cantidad_equipos } = req.body;
  try {
    await query(
      `INSERT INTO 
            zonas(id_categoria, nombre, tipo_zona, cantidad_equipos) 
            VALUES (?, ?, ?, ?)`,
      [id_categoria, nombre, tipo_zona, cantidad_equipos]
    );
    return res.status(200).json({ mensaje: "Categoria registrada con éxito" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error interno del servidor" });
    console.error("Error al crear la zona:", error);
  }
};

const crearZonaVacantesPartidos = async (req, res) => {
  const {
    id_categoria,
    nombre,
    cantidad_equipos,
    id_etapa,
    fase,
    tipo_zona,
    id_edicion,
    campeon,
  } = req.body;

  try {
    if (tipo_zona === "todos-contra-todos") {
      // Insertar en la tabla zonas
      const insertZonaResult = await query(
        `INSERT INTO 
                zonas(id_categoria, nombre, tipo_zona, cantidad_equipos, fase, id_etapa, campeon, terminada) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id_categoria,
          nombre,
          tipo_zona,
          cantidad_equipos,
          fase,
          id_etapa,
          campeon,
          "N",
        ]
      );

      const id_zona = insertZonaResult.insertId;

      const temporadasInserts = [];
      for (let vacante = 1; vacante <= cantidad_equipos; vacante++) {
        temporadasInserts.push([
          id_categoria,
          null,
          id_edicion,
          id_zona,
          vacante,
          null,
          0,
          "N",
        ]);
      }

      await query(
        `INSERT INTO temporadas (id_categoria, id_equipo, id_edicion, id_zona, vacante, pos_zona_previa, apercibimientos, ventaja) 
                        VALUES ?`,
        [temporadasInserts]
      );

      return res.status(200).json({ mensaje: "Zona registrada con éxito" });
    }

    if (
      tipo_zona === "eliminacion-directa" ||
      tipo_zona === "eliminacion-directa-ida-vuelta"
    ) {
      const resultZona = await query(
        `SELECT id_zona FROM zonas WHERE id_categoria = ? AND fase = ? ORDER BY id_zona DESC LIMIT 1`,
        [id_categoria, fase - 1]
      );

      const zonaAnteriorId = resultZona[0]?.id_zona;

      if (!zonaAnteriorId) {
        const nuevaJornada = 1;

        await query(
          `CALL sp_crear_vacantes_partidos_zonas(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id_categoria,
            nombre,
            cantidad_equipos,
            id_etapa,
            fase,
            tipo_zona,
            nuevaJornada,
            id_edicion,
            campeon,
          ]
        );

        return res.send("Zona de vacantes y partidos registrada con éxito");
      } else {
        const resultJornada = await query(
          `SELECT MAX(jornada) AS maxJornada FROM partidos WHERE id_zona = ?`,
          [zonaAnteriorId]
        );

        const maxJornada = resultJornada[0]?.maxJornada || 0;
        const nuevaJornada = maxJornada + 1;

        await query(
          `CALL sp_crear_vacantes_partidos_zonas(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id_categoria,
            nombre,
            cantidad_equipos,
            id_etapa,
            fase,
            tipo_zona,
            nuevaJornada,
            id_edicion,
            campeon,
          ]
        );

        return res.status(200).json({
          mensaje: "Zona de vacantes y partidos registrada con éxito",
        });
      }
    }
  } catch (err) {
    console.error("Error interno al crear zona y vacantes:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

const eliminarZona = async (req, res) => {
  const { id } = req.body;

  try {
    const result = await query(
      "SELECT id_categoria, tipo_zona FROM zonas WHERE id_zona = ?",
      [id]
    );

    if (result.length === 0) {
      return res.status(404).json({ mensaje: "Zona no encontrada" });
    }

    const zona = result[0];

    const deleteFormacionesSql =
      "DELETE FROM formaciones WHERE id_partido IN (SELECT id_partido FROM partidos WHERE id_zona = ?)";
    const deleteGolesSql =
      "DELETE FROM goles WHERE id_partido IN (SELECT id_partido FROM partidos WHERE id_zona = ?)";
    const deleteExpulsadosSql =
      "DELETE FROM expulsados WHERE id_partido IN (SELECT id_partido FROM partidos WHERE id_zona = ?)";
    const deleteAmonestadosSql =
      "DELETE FROM amonestados WHERE id_partido IN (SELECT id_partido FROM partidos WHERE id_zona = ?)";
    const deleteAsistenciasSql =
      "DELETE FROM asistencias WHERE id_partido IN (SELECT id_partido FROM partidos WHERE id_zona = ?)";
    const deleteJugadoresDestacados =
      "DELETE FROM jugadores_destacados WHERE id_partido IN (SELECT id_partido FROM partidos WHERE id_zona = ?)";
    const deletePartidosSql = "DELETE FROM partidos WHERE id_zona = ?";
    const deleteTemporadasSql =
      "DELETE FROM temporadas WHERE id_categoria = ? AND id_zona = ?";
    const deleteZonaSql = "DELETE FROM zonas WHERE id_zona = ?";

    await query(deleteFormacionesSql, [id]);
    await query(deleteGolesSql, [id]);
    await query(deleteExpulsadosSql, [id]);
    await query(deleteAmonestadosSql, [id]);
    await query(deleteAsistenciasSql, [id]);
    await query(deleteJugadoresDestacados, [id]);
    await query(deletePartidosSql, [id]);
    await query(deleteTemporadasSql, [zona.id_categoria, id]);
    await query(deleteZonaSql, [id]);

    return res.status(200).json({ mensaje: "Zona eliminada correctamente" });
  } catch (err) {
    console.error("Error eliminando la zona o registros relacionados:", err);
    return res
      .status(500)
      .json({ mensaje: "Error interno del servidor", error: err });
  }
};

const getEtapas = async (req, res) => {
  const sql = `SELECT * FROM etapas`;
  try {
    const result = await query(sql);
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ mensaje: "Error interno del servidor" });
    console.error("Error obteniendo las etapas:", error);
  }
};

const actualizarZona = async (req, res) => {
  const {
    id_zona,
    nombre_zona,
    tipo_zona,
    etapa,
    cantidad_equipos,
    tipo,
    campeon,
    id_equipo_campeon,
    terminada,
  } = req.body;

  if (
    !id_zona ||
    !nombre_zona ||
    !tipo_zona ||
    !etapa ||
    !cantidad_equipos ||
    !tipo ||
    !campeon
  ) {
    return res.status(400).send("Faltan datos");
  }

  let sql = "";
  let params = [];
  let successMessage = "";
  let errorMessage = "";

  switch (tipo) {
    case "igual":
      sql = `UPDATE zonas SET nombre = ?, tipo_zona = ?, id_etapa = ?, campeon = ?, id_equipo_campeon = ?, terminada = ? WHERE id_zona = ?`;
      params = [
        nombre_zona,
        tipo_zona,
        etapa,
        campeon,
        id_equipo_campeon,
        terminada,
        id_zona,
      ];
      successMessage = "Zona actualizada correctamente.";
      errorMessage = "Error al actualizar la zona.";
      break;
    case "menor":
      sql = `CALL sp_eliminar_vacantes_menor(?, ?, ?, ?, ?, ?, ?, ?)`;
      params = [
        id_zona,
        nombre_zona,
        tipo_zona,
        etapa,
        cantidad_equipos,
        campeon,
        terminada,
        id_equipo_campeon,
      ];
      successMessage = "Vacantes eliminadas correctamente.";
      errorMessage = "Error al eliminar vacantes.";
      break;
    case "mayor":
      sql = "CALL sp_agregar_vacantes_mayor(?, ?, ?, ?, ?, ?, ?, ?)";
      params = [
        id_zona,
        nombre_zona,
        tipo_zona,
        etapa,
        cantidad_equipos,
        campeon,
        terminada,
        id_equipo_campeon,
      ];
      successMessage = "Vacantes agregadas correctamente.";
      errorMessage = "Error al agregar vacantes.";
      break;
    default:
      return res.status(400).json({ mensaje: "Tipo de operación inválido." });
  }

  try {
    await query(sql, params);

    if (terminada === "S") {
      const spSql = "CALL sp_actualizar_vacantes_posiciones(?)";
      await query(spSql, [id_zona]);
      return res.status(200).send({
        mensaje:
          successMessage + " Vacantes y posiciones actualizadas correctamente.",
      });
    } else {
      return res.status(200).send({ mensaje: successMessage });
    }
  } catch (err) {
    console.error("Error en la base de datos:", err);
    return res.status(500).json({ mensaje: errorMessage });
  }
};

//! VERIFICAR ACTUALIZACION EN AMBAS ZONAS
const vaciarVacante = async (req, res) => {
  const { id_zona, vacante, tipo_zona } = req.body;

  if (!id_zona || vacante === undefined || !tipo_zona) {
    return res.status(400).json({ mensaje: "Faltan datos" });
  }

  const sqlTemporadas =
    "UPDATE temporadas SET id_equipo = NULL, pos_zona_previa = NULL, id_zona_previa = NULL WHERE id_zona = ? AND vacante = ?";
  const paramsTemporadas = [id_zona, vacante];

  try {
    await query(sqlTemporadas, paramsTemporadas);

    if (
      tipo_zona !== "todos-contra-todos" &&
      tipo_zona !== "todos-contra-todos-ida-vuelta"
    ) {
      const sqlPartidos = `
        SELECT id_partido, vacante_local, vacante_visita
        FROM partidos
        WHERE id_zona = ? AND (vacante_local = ? OR vacante_visita = ?)
      `;
      const paramsPartidos = [id_zona, vacante, vacante];

      const rows = await query(sqlPartidos, paramsPartidos);

      if (rows.length === 0) {
        return res.status(404).json({
          mensaje:
            "No se encontraron partidos con esa vacante en la zona indicada",
        });
      }

      const updatePromises = rows.map((partido) => {
        const sqlUpdate = `
          UPDATE partidos
          SET 
              id_equipoLocal = CASE WHEN vacante_local = ? THEN NULL ELSE id_equipoLocal END,
              id_equipoVisita = CASE WHEN vacante_visita = ? THEN NULL ELSE id_equipoVisita END,
              res_partido_previo_local = CASE WHEN vacante_local = ? THEN NULL ELSE res_partido_previo_local END,
              res_partido_previo_visita = CASE WHEN vacante_visita = ? THEN NULL ELSE res_partido_previo_visita END,
              id_partido_previo_local = CASE WHEN vacante_local = ? THEN NULL ELSE id_partido_previo_local END,
              id_partido_previo_visita = CASE WHEN vacante_visita = ? THEN NULL ELSE id_partido_previo_visita END
          WHERE id_partido = ?
        `;

        const paramsUpdate = [
          vacante,
          vacante,
          vacante,
          vacante,
          vacante,
          vacante,
          partido.id_partido,
        ];

        return query(sqlUpdate, paramsUpdate);
      });

      await Promise.all(updatePromises);

      return res.status(200).json({
        mensaje: "Vacante vaciada correctamente en todos los partidos",
      });
    } else {
      return res.status(200).json({ mensaje: "Vacante vaciada correctamente" });
    }
  } catch (err) {
    console.error("Error vaciando vacante:", err);
    return res
      .status(500)
      .json({ mensaje: "Error vaciando vacante en temporadas o partidos" });
  }
};

const eliminarVacante = (req, res) => {
  const { id_zona, vacante, tipo_zona } = req.body;

  if (!id_zona || !vacante || !tipo_zona) {
    return res.status(400).json({ mensaje: "Faltan datos" });
  }
};

module.exports = {
  crearZona,
  crearZonaVacantesPartidos,
  eliminarZona,
  getEtapas,
  actualizarZona,
  vaciarVacante,
  eliminarVacante,
};
