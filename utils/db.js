const mysql = require('mysql');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
  connectionLimit: 20, // Número máximo de conexiones en el pool
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectTimeout: 10000, // Tiempo máximo para conectar
  acquireTimeout: 10000, // Tiempo máximo para adquirir conexión
  waitForConnections: true, // Esperar si el pool está lleno
  queueLimit: 0, // Sin límite de peticiones en espera
  timmeout: 30000, // Tiempo máximo de inactividad antes de cerrar la conexión
};

// const dbConfig = {
//     connectionLimit: 50,
//     waitForConnections: true,
//     queueLimit: 0,
//     connectTimeout: 10000,
//     acquireTimeout: 10000,
//     timeout: 30000 // 🔴 Asegura que las conexiones inactivas se cierren
// };

const pool = mysql.createPool(dbConfig);

pool.on('connection', (connection) => {
    console.log('✅ Nueva conexión establecida a MySQL.');
    
    // Evitar que se cierren conexiones inactivas en Railway
    connection.query('SET SESSION wait_timeout = 28800;'); 
    connection.query('SET SESSION interactive_timeout = 28800;');

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
        console.error('❌ Error obteniendo conexión:', err);
        return;
    }

    connection.query('SELECT * FROM etapas', (error, results) => {
        if (error) {
            console.error('Error en la consulta:', error);
        } else {
            console.log(results);
        }
        connection.release();  // 🔴 SIEMPRE liberar la conexión aquí
    });
});

function handleDisconnect() {
    pool.query('SELECT 1', (err) => {
        if (err) {
            console.error('❌ Error en la conexión a MySQL, reintentando en 5s:', err);
            setTimeout(handleDisconnect, 5000);
        } else {
            console.log('✅ Conexión a MySQL activa.');
        }
    });
}

handleDisconnect();

module.exports = pool;
