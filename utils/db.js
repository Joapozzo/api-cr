// const mysql = require("mysql");
// const dotenv = require("dotenv");

// dotenv.config();

// const dbConfig = {
//   connectionLimit: 10, // Número máximo de conexiones en el pool
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_DATABASE,
//   connectTimeout: 10000, // Tiempo máximo para conectar
//   acquireTimeout: 10000, // Tiempo máximo para adquirir conexión
//   waitForConnections: true, // Esperar si el pool está lleno
//   queueLimit: 0, // Sin límite de peticiones en espera
//   timeout: 30000, // Tiempo máximo de inactividad antes de cerrar la conexión
// };

// const pool = mysql.createPool(dbConfig);

// // Evento cuando se establece una nueva conexión
// pool.on("connection", (connection) => {
//   console.log("✅ Nueva conexión establecida a MySQL.");

//   // Ajustes de sesión (puedes ajustarlos si usas Railway o servidores con timeouts específicos)
//   // connection.query('SET SESSION wait_timeout = 28800;');
//   // connection.query('SET SESSION interactive_timeout = 28800;');

//   // Manejo de errores en la conexión
//   connection.on("error", (err) => {
//     console.error("❌ Error en la conexión MySQL:", err);
//     if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET") {
//       console.log("🔄 Intentando reconectar a MySQL...");
//       handleDisconnect();
//     }
//   });

//   // Evento cuando la conexión termina
//   connection.on("end", () => {
//     console.warn("⚠️ Conexión MySQL terminada.");
//   });
// });

// // Función para obtener y usar una conexión
// function useConnection(callback) {
//   pool.getConnection((err, connection) => {
//     if (err) {
//       console.error("❌ Error obteniendo conexión:", err);
//       return;
//     }

//     callback(connection);

//     // Liberamos la conexión después de la consulta
//     if (connection.threadId) {
//       console.log(`🛑 Cerrando conexión inactiva ${connection.threadId}`);
//       connection.release();
//     } else {
//       connection.release(); // Si la conexión aún se necesita, solo liberarla
//     }
//   });
// }

// // Ejemplo de uso de la conexión
// useConnection((connection) => {
//   connection.query("SELECT * FROM etapas", (error, results) => {
//     if (error) {
//       console.error("Error en la consulta:", error);
//     } else {
//       console.log(results);
//     }
//   });
// });

// // Función para manejar la desconexión y reconexión
// function handleDisconnect() {
//   pool.getConnection((err, connection) => {
//     if (err) {
//       console.error(
//         "❌ Error en la conexión a MySQL, reintentando en 5s:",
//         err
//       );
//       setTimeout(handleDisconnect, 5000); // Reintentar después de 5 segundos
//       return;
//     }

//     console.log("✅ Conexión a MySQL activa.");
//     connection.release(); // Liberamos la conexión una vez reconectados
//   });
// }

// // Función para verificar conexiones inactivas cada 5 minutos
// setInterval(() => {
//   pool.getConnection((err, connection) => {
//     if (err) {
//       console.error("❌ Error obteniendo conexión:", err);
//       return;
//     }

//     // Hacemos una consulta ligera para verificar la conexión
//     connection.query("SELECT 1", (error) => {
//       if (error) {
//         console.error("❌ Error en la conexión, cerrando...");
//         connection.release(); // Liberar conexión si hay error
//       } else {
//         connection.release(); // Mantener viva la conexión si está activa
//       }
//     });
//   });
// }, 300000); // Verificar cada 5 minutos

// module.exports = pool;

const mysql = require('mysql');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  queueLimit: 0
});

// Reutilizar pool usando Promesas
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (error, results) => {
      if (error) {
        console.error('❌ Error en consulta:', error);
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

module.exports = {
  pool,
  query,
};
