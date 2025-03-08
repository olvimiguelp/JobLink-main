import mysql from "mysql2/promise";
import dotenv from "dotenv";
// Si no usas MongoDB, puedes comentar el siguiente import:
// import mongoose from "mongoose";

dotenv.config();

// Configuración MySQL
function parseConnectionString(connectionString) {
  try {
    // mysql://user:password@host:port/database
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      port: url.port || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl:
        process.env.NODE_ENV === "production"
          ? {
              rejectUnauthorized: false,
            }
          : undefined,
    };
  } catch (error) {
    console.error("Error parsing connection string:", error);
    throw error;
  }
}

// Si existe una cadena de conexión, usarla; de lo contrario, usar parámetros individuales
let config;
if (process.env.DB_URL) {
  config = parseConnectionString(process.env.DB_URL);
} else {
  config = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "joblink",
    ssl:
      process.env.NODE_ENV === "production"
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
  };
}

const pool = mysql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Prueba de conexión a la base de datos
pool.getConnection()
  .then(connection => {
    console.log('Conexión exitosa a la base de datos.');
    connection.release();
  })
  .catch(error => {
    console.error('Error de conexión a la base de datos:', error);
  });

// Función para probar la conexión
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Conexión a la base de datos establecida con éxito.");
    connection.release();
    return true;
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error);
    return false;
  }
}

// Configuración MongoDB (comentar o eliminar si no se usa)
// const connectMongoDB = async () => {
//   try {
//     if (!process.env.MONGODB_URI) {
//       throw new Error('La URL de MongoDB no está definida en las variables de entorno');
//     }
//     await mongoose.connect(process.env.MONGODB_URI);
//     console.log('Conexión a MongoDB establecida correctamente');
//   } catch (error) {
//     console.error('Error al conectar con MongoDB:', error);
//     throw error;
//   }
// };

// Exportaciones
export { 
  pool, 
  testConnection, 
  // connectMongoDB 
};

