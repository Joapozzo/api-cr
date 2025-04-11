const mysql = require('mysql');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
  connectionLimit: 10, // Número máximo de conexiones en el pool
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectTimeout: 10000, // Tiempo máximo para conectar
  acquireTimeout: 10000, // Tiempo máximo para adquirir conexión
  waitForConnections: true, // Esperar si el pool está lleno
  queueLimit: 0, // Sin límite de peticiones en espera
  timeout: 30000, // Tiempo máximo de inactividad antes de cerrar la conexión
};

const pool = mysql.createPool(dbConfig);

pool.on('connection', (connection) => {
    console.log('✅ Nueva conexión establecida a MySQL.');
    
    // Evitar que se cierren conexiones inactivas en Railway
    // connection.query('SET SESSION wait_timeout = 28800;'); 
    // connection.query('SET SESSION interactive_timeout = 28800;');

    connection.on('error', (err) => {
        console.error('❌ Error en la conexión MySQL:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
            console.log('🔄 Intentando reconectar a MySQL...');
            handleDisconnect();
        }
    });

    connection.on('end', () => {
        console.warn('⚠️ Conexión MySQL terminada.');
    });
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Error obteniendo conexión:", err);
        return;
    }

    connection.query("SELECT * FROM etapas", (error, results) => {
        if (error) {
            console.error("Error en la consulta:", error);
        } else {
            console.log(results);
        }

        if (connection.threadId) {
            console.log(`🛑 Cerrando conexión inactiva ${connection.threadId}`);
            connection.destroy(); // 🔴 Esto elimina completamente la conexión si ya no se necesita
        } else {
            connection.release(); // ✅ Si la conexión aún se necesita, solo la liberamos
        }
    });
});

function handleDisconnect() {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error("❌ Error en la conexión a MySQL, reintentando en 5s:", err);
            setTimeout(handleDisconnect, 5000);
            return;
        }

        console.log("✅ Conexión a MySQL activa.");
        connection.release();
    });
}

handleDisconnect();

// 🔄 Cada 5 minutos (300000ms) revisa conexiones inactivas y las cierra
setInterval(() => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error("❌ Error obteniendo conexión:", err);
            return;
        }

        connection.query("SELECT 1", (error) => {
            if (error) {
                console.error("❌ Error en la conexión, cerrando...");
                connection.destroy(); // 🔴 Cerrar la conexión si está fallando
            } else {
                connection.release(); // ✅ Mantener viva la conexión si funciona
            }
        });
    });
}, 300000); 

module.exports = pool;
