const { query } = require("../utils/db");

const insertarGol = async (req, res) => {
  const { id_partido, id_jugador, id_equipo, action, detail, minute } = req.body;

  if (!id_partido || !id_jugador || !id_equipo || !action || detail === undefined || !minute) {
    return res.status(400).json({ mensaje: 'Faltan datos necesarios' });
  }

  try {
    await query(`CALL sp_insertar_gol(?, ?, ?, ?, ?, ?)`, [id_partido, id_jugador, id_equipo, action, detail, minute]);
    res.status(200).json({ status: 200, mensaje: 'Gol registrado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const insertarAmarilla = async (req, res) => {
  const { id_partido, id_jugador, id_equipo, action, minute } = req.body;

  if (!id_partido || !id_jugador || !id_equipo || !action || !minute) {
    return res.status(400).json({ mensaje: 'Faltan datos necesarios' });
  }

  try {
    await query(`CALL sp_insertar_amarilla(?, ?, ?, ?)`, [id_partido, id_jugador, id_equipo, minute]);
    res.status(200).json({ status: 200, mensaje: 'Amarilla registrada exitosamente' });

    const result = await query('SELECT amarillas FROM formaciones WHERE id_partido = ? AND id_jugador = ?', [id_partido, id_jugador]);
    // const amarillas = result[0].amarillas;
    // if (amarillas == 2) { 
    //   req.io.emit('insertar-roja', { id_partido, id_jugador, id_equipo, action, minute });
    // }
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al registrar la amarilla o consultar amarillas' });
  }
};

const insertarRoja = async (req, res) => {
  const { id_partido, id_jugador, id_equipo, action, minute, detail } = req.body;

  if (!id_partido || !id_jugador || !id_equipo || !action || !minute || detail === undefined) {
    return res.status(400).json({ mensaje: 'Faltan datos necesarios' });
  }

  try {
    await query(`CALL sp_insertar_roja(?, ?, ?, ?, ?)`, [id_partido, id_jugador, id_equipo, detail, minute]);
    res.status(200).json({ status: 200, mensaje: 'Roja registrada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al registrar la roja' });
  }
};

const actualizarGol = async (req, res) => {
  const { id_accion, minute } = req.body;

  if (!id_accion || !minute) {
    return res.status(400).json({ mensaje: "Faltan parámetros obligatorios" });
  }

  try {
    const sql = `UPDATE goles SET minuto = ? WHERE id_gol = ?`;
    const result = await query(sql, [minute, id_accion]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Gol no encontrado" });
    }
    res.status(200).json({ mensaje: "Gol actualizado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al actualizar el gol" });
  }
};

const actualizarAmarilla = async (req, res) => {
  const { id_accion, minute } = req.body;
  const id_action = id_accion;

  if (!id_action || !minute) {
    return res.status(400).json({ mensaje: "Faltan parámetros obligatorios" });
  }

  try {
    const sql = `UPDATE amonestados SET minuto = ? WHERE id_amonestacion = ?`;
    const result = await query(sql, [minute, id_action]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Amarilla no encontrada" });
    }
    res.status(200).json({ mensaje: "Amarilla actualizada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al actualizar la amarilla" });
  }
};

const actualizarRoja = async (req, res) => {
  const { id_accion, minute } = req.body;
  const id_action = id_accion;

  if (!id_action || !minute) {
    return res.status(400).json({ mensaje: "Faltan parámetros obligatorios" });
  }

  try {
    const sql = `UPDATE expulsados SET minuto = ? WHERE id_expulsion = ?`;
    const result = await query(sql, [minute, id_action]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Roja no encontrada" });
    }
    res.status(200).json({ mensaje: "Roja actualizada correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al actualizar la roja" });
  }
};

const eliminarGol = async (req, res) => {
  const { id_partido, id_accion, id_equipo } = req.query;

  if (!id_partido || !id_accion || !id_equipo) {
    return res.status(400).json({ mensaje: "Faltan parámetros obligatorios" });
  }

  try {
    await query('CALL sp_eliminar_gol(?, ?, ?)', [id_partido, id_accion, id_equipo]);
    res.status(200).json({ mensaje: 'Gol eliminado con éxito' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error al eliminar el gol' });
  }
};

const eliminarAmarilla = async (req, res) => {
  const { id_partido, id_accion: id_action, id_equipo, id_jugador } = req.query;
  const id_accion = id_action;

  if (!id_partido || !id_accion || !id_equipo || !id_jugador) {
    return res.status(400).json({ mensaje: "Faltan parámetros obligatorios" });
  }

  try {
    await query(`DELETE FROM amonestados WHERE id_partido = ? AND id_jugador = ? AND id_amonestacion = ?`, [id_partido, id_jugador, id_accion]);
    await query(`UPDATE formaciones SET amarillas = GREATEST(amarillas - 1, 0) WHERE id_partido = ? AND id_jugador = ?`, [id_partido, id_jugador]);

    const results = await query(`SELECT amarillas FROM formaciones WHERE id_partido = ? AND id_jugador = ?`, [id_partido, id_jugador]);

    if (results[0].amarillas <= 2) {
      await query(`DELETE FROM expulsados WHERE id_partido = ? AND id_jugador = ?`, [id_partido, id_jugador]);

      const categoria = await query(`SELECT id_categoria FROM partidos WHERE id_partido = ?`, [id_partido]);
      const idCategoria = categoria[0].id_categoria;

      await query(`
        UPDATE planteles 
        SET sancionado = 'N' 
        WHERE id_jugador = ? AND id_equipo = ? AND id_categoria = ?`, [id_jugador, id_equipo, idCategoria]);
    }

    res.json({ mensaje: "Acción eliminada exitosamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

const eliminarRoja = async (req, res) => {
  const { id_partido, id_accion, id_jugador, id_equipo } = req.query;
  const id_action = id_accion;

  if (!id_partido || !id_accion || !id_jugador || !id_equipo) {
    return res.status(400).json({ mensaje: "Faltan parámetros obligatorios" });
  }

  try {
    const categoria = await query(`SELECT id_categoria FROM partidos WHERE id_partido = ?`, [id_partido]);

    if (categoria.length === 0) {
      return res.status(404).json({ mensaje: "No se encontró la categoría para el partido especificado" });
    }

    const id_categoria = categoria[0].id_categoria;

    await query(`DELETE FROM expulsados WHERE id_partido = ? AND id_jugador = ? AND id_expulsion = ?`, [id_partido, id_jugador, id_action]);
    await query(`UPDATE formaciones SET rojas = GREATEST(rojas - 1, 0) WHERE id_partido = ? AND id_jugador = ?`, [id_partido, id_jugador]);
    await query(`
      UPDATE planteles 
      SET sancionado = 'N' 
      WHERE id_jugador = ? AND id_equipo = ? AND id_categoria = ?`, [id_jugador, id_equipo, id_categoria]);

    res.status(200).json({ mensaje: "Expulsión eliminada exitosamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

const insertarJugadorDestacado = async (req, res) => {
  const { id_categoria, id_partido, id_equipo, id_jugador } = req.body;

  if (!id_jugador || !id_equipo || !id_partido || !id_categoria) {
    return res.status(400).json({ error: "Faltan datos del jugador, id_partido o id_categoria." });
  }

  try {
    await query(`
      INSERT INTO jugadores_destacados (id_partido, id_equipo, id_jugador, id_categoria, dt)
      VALUES (?, ?, ?, ?, ?)`, [id_partido, id_equipo, id_jugador, id_categoria, 'N']);

    const result = await query(`
      SELECT jd.id_partido, jd.id_jugador, CONCAT(j.nombre, ' ', j.apellido, ' - ', e.nombre) AS nombre_completo, jd.id_jugador AS jugador_destacado, jd.posicion
      FROM jugadores_destacados AS jd
      JOIN jugadores AS j ON jd.id_jugador = j.id_jugador
      JOIN equipos AS e ON jd.id_equipo = e.id_equipo
      WHERE jd.id_partido = ? AND jd.id_jugador = ?
      LIMIT 1`, [id_partido, id_jugador]);

    if (result.length === 0) {
      return res.status(404).json({ error: "Jugador destacado no encontrado después de insertar." });
    }

    res.status(201).json({ message: "Jugador destacado insertado correctamente.", jugador: result[0] });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "El jugador ya está destacado en este partido." });
    }
    console.error(error);
    res.status(500).json({ error: "Error inesperado al insertar el jugador destacado." });
  }
};

const eliminarJugadorDestacado = async (req, res) => {
  const { id_partido, id_categoria, id_jugador } = req.query;

  if (!id_jugador || !id_partido || !id_categoria) {
    return res.status(400).json({ error: "Faltan datos del jugador, id_partido o id_categoria." });
  }

  try {
    await query(`
      DELETE FROM jugadores_destacados 
      WHERE id_partido = ? AND id_jugador = ? AND id_categoria = ?`, [id_partido, id_jugador, id_categoria]);

    res.status(200).json({ message: "Jugador destacado eliminado correctamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el jugador destacado." });
  }
};

const borrarFirmaJugador = async (req, res) => {
  const { id_partido, id_jugador } = req.query;

  if (!id_partido || !id_jugador) {
    return res.status(400).send("Faltan datos necesarios");
  }

  try {
    await query(`CALL sp_borrar_firma_jugador(?, ?)`, [id_jugador, id_partido]);
    res.status(200).json({ status: 200, mensaje: "Dorsal eliminado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: "Error al borrar el dorsal del jugador" });
  }
};

module.exports = {
  insertarGol,
  insertarAmarilla,
  insertarRoja,
  actualizarGol,
  actualizarAmarilla,
  actualizarRoja,
  eliminarGol,
  eliminarAmarilla,
  eliminarRoja,
  insertarJugadorDestacado,
  eliminarJugadorDestacado,
  borrarFirmaJugador
};
