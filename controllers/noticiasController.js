const { query } = require("../utils/db");

//! INSERTAR EN TABLA NOTICIAS-CATEGORIAS TAMBIEN
const createNoticia = async (req, res) => {
  try {
    const { title, content, img, categorias } = req.body;

    // Validar los datos recibidos
    if (!title || !content || !categorias || !img) {
      return res.status(400).json({
        mensaje:
          "El título, el contenido, la imagen y las categorías son obligatorios.",
      });
    }

    if (!Array.isArray(categorias) || categorias.length === 0) {
      return res.status(400).json({
        mensaje:
          "Las categorías deben ser un arreglo con al menos un elemento.",
      });
    }

    // Insertar la noticia
    const sqlNoticia = `INSERT INTO noticias (titulo, contenido, img) VALUES (?, ?, ?)`;
    const noticiaValues = [title, content, img];

    const result = await query(sqlNoticia, noticiaValues);
    const noticiaId = result.insertId; // ID de la noticia creada

    // Insertar las categorías relacionadas
    const sqlCategorias = `INSERT INTO noticias_categorias (id_noticia, id_categoria) VALUES ?`;
    const categoriaValues = categorias.map((categoriaId) => [
      noticiaId,
      categoriaId,
    ]);

    await query(sqlCategorias, [categoriaValues]);

    // Respuesta exitosa
    return res.status(201).json({
      mensaje: "Noticia creada exitosamente y categorías asociadas.",
      noticiaId: noticiaId,
    });
  } catch (error) {
    console.error("Error en el servidor:", error);
    return res.status(500).json({
      mensaje: "Error inesperado en el servidor.",
    });
  }
};

const getNoticias = async (req, res) => {
  const sql = `
    SELECT 
        n.id_noticia AS id_noticia,
        n.titulo AS noticia_titulo,
        n.contenido AS noticia_contenido,
        n.img AS noticia_img,
        n.fecha_creacion AS noticia_fecha_creacion,
        n.publicada AS noticia_publicada,
        GROUP_CONCAT(CONCAT(c.id_categoria, '_', c.nombre) SEPARATOR ', ') AS categorias,
        e.id_edicion AS id_edicion,
        e.nombre AS edicion_nombre
    FROM 
        noticias n
    INNER JOIN 
        noticias_categorias nc ON n.id_noticia = nc.id_noticia
    INNER JOIN 
        categorias c ON nc.id_categoria = c.id_categoria
    LEFT JOIN 
        ediciones e ON c.id_edicion = e.id_edicion
    GROUP BY 
        n.id_noticia, e.id_edicion, e.nombre
    ORDER BY 
        n.fecha_creacion DESC;
    `;
  try {
    const result = await query(sql);
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).send("Error obteniendo las noticias");
    console.error("Error obteniendo las noticias:", error);
  }
};

const getNoticiasId = async (req, res) => {
  const { id_noticia } = req.query;
  const sql = `
    SELECT 
        n.id_noticia AS id_noticia,
        n.titulo AS noticia_titulo,
        n.contenido AS noticia_contenido,
        n.img AS noticia_img,
        n.fecha_creacion AS noticia_fecha_creacion,
        n.publicada AS noticia_publicada,
        GROUP_CONCAT(CONCAT(c.id_categoria, '_', c.nombre) SEPARATOR ', ') AS categorias,
        e.id_edicion AS id_edicion,
        e.nombre AS edicion_nombre
    FROM 
        noticias n
    INNER JOIN 
        noticias_categorias nc ON n.id_noticia = nc.id_noticia
    INNER JOIN 
        categorias c ON nc.id_categoria = c.id_categoria
    LEFT JOIN 
        ediciones e ON c.id_edicion = e.id_edicion
    WHERE
        n.id_noticia = ?
    GROUP BY 
        n.id_noticia, e.id_edicion, e.nombre
    ORDER BY 
        n.fecha_creacion DESC;
    `;
  try {
    if (!id_noticia) {
      return res.status(400).json({ mensaje: "Falta el id de la noticia" });
    }
    const result = await query(sql, [id_noticia]);
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).send("Error obteniendo las noticias");
    console.error("Error obteniendo las noticias:", error);
  }
};

const eliminarNoticia = async (req, res) => {
  const { id_noticia: idNoticia } = req.query;
  const sql = `DELETE FROM noticias WHERE id_noticia = ?`;

  if (!idNoticia) {
    return res.status(400).json({ mensaje: "Falta el id de la noticia" });
  }

  console.log(idNoticia);

  try {
    await query(sql, [idNoticia]);

    await query(
      `DELETE FROM noticias_categorias WHERE id_noticia = ?`,
      [idNoticia]
    );

    return res.status(200).json({ mensaje: "Noticia eliminada correctamente" });
  } catch (err) {
    console.error("Error eliminando la noticia:", err);
    return res.status(500).json({ mensaje: "Error eliminando la noticia" });
  }
};

const updateNoticia = async (req, res) => {
  const { id_noticia, title, content, categorias, img } = req.body;

  const sql = `
    UPDATE noticias
    SET titulo = ?, contenido = ?, img = ?
    WHERE id_noticia = ?
  `;

  if (!id_noticia || !title || !content || !categorias || !img) {
    return res.status(400).json({ mensaje: "Falta algún dato" });
  }

  try {
    await query(sql, [title, content, img, id_noticia]);
    return res.status(200).json({ mensaje: "Noticia actualizada correctamente" });
  } catch (err) {
    console.error("Error actualizando la noticia:", err);
    return res.status(500).json({ mensaje: "Error actualizando la noticia" });
  }
};

module.exports = {
  createNoticia,
  getNoticias,
  getNoticiasId,
  eliminarNoticia,
  updateNoticia,
};
