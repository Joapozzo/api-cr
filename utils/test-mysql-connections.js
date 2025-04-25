const mysql = require("mysql2");

// Configuración de la base de datos
const connectionConfig = {
  host: "srv1843.hstgr.io",
  user: "u117252722_admin",
  password: "gQ3!RYjep",
  database: "u117252722_bdcr",
};

// Función para crear una nueva conexión y realizar una consulta
const testConnection = (id) => {
  const connection = mysql.createConnection(connectionConfig);

  return new Promise((resolve, reject) => {
    connection.query("SELECT * FROM etapas", (error, results) => {
      if (error) {
        reject(error);
      } else {
        console.log(`Conexión ${id} completada`);
        resolve(results);
      }
      connection.end(); // Cierra la conexión
    });
  });
};

// Simula múltiples conexiones concurrentes
const testMultipleConnections = async (numConnections) => {
  const promises = [];
  for (let i = 0; i < numConnections; i++) {
    promises.push(testConnection(i + 1));
  }

  try {
    await Promise.all(promises); // Espera a que todas las conexiones terminen
    console.log("Todas las conexiones se completaron");
  } catch (err) {
    console.error("Error en alguna conexión:", err);
  }
};

// Ejecuta 50 conexiones concurrentes
testMultipleConnections(50);
