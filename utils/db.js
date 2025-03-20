const mysql = require('mysql');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
    connectionLimit: 100,  // Número máximo de conexiones en el pool
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectTimeout: 10000, // Tiempo máximo para conectar
    acquireTimeout: 10000, // Tiempo máximo para adquirir conexión
    waitForConnections: true, // Esperar si el pool está lleno
    queueLimit: 0, // Sin límite de peticiones en espera
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
        connection.release();  // 🔴 IMPORTANTE: Liberar la conexión
        if (error) {
            console.error('Error en la consulta:', error);
            return;
        }
        console.log(results);
    });
});

// Función para manejar reconexión automática
function handleDisconnect() {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('❌ Error conectando a MySQL:', err);
            setTimeout(handleDisconnect, 5000); // Espera 5s antes de intentar nuevamente
        } else {
            console.log('✅ Conexión exitosa a MySQL.');
            if (connection) connection.release();
        }
    });
}

handleDisconnect();

module.exports = pool;
