const FTPClient = require("ftp");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

const uploadToFTP = (filePath, remotePath) => {
  return new Promise((resolve, reject) => {
    const client = new FTPClient();

    client.on("ready", () => {
      client.put(filePath, remotePath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve("Archivo subido exitosamente.");
        }
        client.end();
      });
    });

    client.on("error", (err) => {
      reject(err);
    });

    client.connect({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
    });
  });
};

// exports.uploadImage = async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ error: "No se ha enviado ningún archivo." });
//         }

//         const directory = req.body.directory;
//         if (!directory) {
//             return res.status(400).json({ error: "El nombre del directorio es obligatorio." });
//         }

//         const localPath = req.file.path;
//         const remotePath = `/public_html/uploads/${directory}/${req.file.originalname}`;

//         console.log("Subiendo archivo...");
//         const result = await uploadToFTP(localPath, remotePath);

//         fs.unlinkSync(localPath);

//         res.status(200).json({ message: result, path: remotePath });
//     } catch (error) {
//         console.error("Error en la subida de imagen:", error);
//         res.status(500).json({ error: "Error al subir la imagen." });
//     }
// }

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No se ha enviado ningún archivo." });
    }

    const directory = req.body.directory;
    if (!directory) {
      return res
        .status(400)
        .json({ error: "El nombre del directorio es obligatorio." });
    }

    const remotePath = `/public_html/uploads/${directory}/${req.file.originalname}`;

    const client = new FTPClient();

    client.on("ready", () => {
      client.put(req.file.buffer, remotePath, (err) => {
        if (err) {
          console.error("Error subiendo a FTP:", err);
          client.end();
          return res
            .status(500)
            .json({ error: "Error al subir la imagen al FTP." });
        }
        client.end();
        res
          .status(200)
          .json({ message: "Archivo subido exitosamente.", path: remotePath });
      });
    });

    client.on("error", (err) => {
      console.error("Error en FTP:", err);
      return res.status(500).json({ error: "Error en la conexión FTP." });
    });

    client.connect({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
    });
  } catch (error) {
    console.error("Error general en upload:", error);
    res.status(500).json({ error: "Error al procesar la imagen." });
  }
};

exports.deleteImage = async (req, res) => {
  const { directory, fileName } = req.body;

  if (!directory || !fileName) {
    return res.status(400).json({ error: "Faltan datos requeridos." });
  }

  // ✅ Evitar path traversal
  if (fileName.includes("..") || directory.includes("..")) {
    return res
      .status(400)
      .json({ error: "Nombre de archivo o directorio inválido." });
  }

  // ✅ Validar extensión permitida
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return res
      .status(400)
      .json({ error: "Extensión de archivo no permitida." });
  }

  const remotePath = `/public_html/uploads/${directory}/${fileName}`;
  const client = new FTPClient();

  try {
    client.on("ready", () => {
      client.delete(remotePath, (err) => {
        if (err) {
          console.error("Error al eliminar archivo:", err);
          client.end();
          return res
            .status(500)
            .json({ error: "Error al eliminar el archivo." });
        }
        client.end();
        res
          .status(200)
          .json({ mensaje: "Imagen eliminada exitosamente.", status: 200 });
      });
    });

    client.on("error", (err) => {
      console.error("Error en FTP:", err);
      return res.status(500).json({ error: "Error en la conexión FTP." });
    });

    client.connect({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
    });
  } catch (error) {
    console.error("Error general en delete:", error);
    res.status(500).json({ error: "Error al eliminar la imagen." });
  }
};
