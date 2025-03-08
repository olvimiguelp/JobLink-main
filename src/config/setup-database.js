import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import mysql from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function parseConnectionString(connectionString) {
  try {
    const url = new URL(connectionString)
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
    }
  } catch (error) {
    console.error("Error parsing connection string:", error)
    throw error
  }
}

async function setupDatabase() {
  let connection
  try {
    let config
    if (process.env.DB_URL) {
      config = parseConnectionString(process.env.DB_URL)
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
      }
    }

    const connectionConfig = {
      ...config,
      multipleStatements: true,
    }

    console.log("Conectando a MySQL...")

    const tempConfig = { ...connectionConfig }
    delete tempConfig.database

    connection = await mysql.createConnection(tempConfig)

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.database}`)
    console.log(`Base de datos ${config.database} verificada/creada`)

    await connection.end()

    connection = await mysql.createConnection(connectionConfig)
    console.log(`Conectado a la base de datos ${config.database}`)

    const sqlPath = path.join(__dirname, "database.sql")
    const sql = fs.readFileSync(sqlPath, "utf8")

    const commands = sql.split(";").filter((cmd) => cmd.trim())

    for (const command of commands) {
      if (!command.trim()) continue
      try {
        await connection.query(command)
        console.log("Comando SQL ejecutado con éxito")
      } catch (err) {
        if (err.code === "ER_TABLE_EXISTS_ERROR") {
          console.log(`La tabla ya existe: ${err.sqlMessage}`)
        } else {
          console.error("Error ejecutando comando SQL:", err)
          throw err
        }
      }
    }

    const [tables] = await connection.query("SHOW TABLES")
    console.log(
      "Tablas en la base de datos:",
      tables.map((t) => Object.values(t)[0]),
    )

    console.log("Configuración de la base de datos completada con éxito")
  } catch (error) {
    console.error("Error al configurar la base de datos:", error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log("Conexión cerrada")
    }
  }
}

setupDatabase()

