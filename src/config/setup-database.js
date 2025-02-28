const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

function parseConnectionString(connectionString) {
    try {
        // mysql://user:password@host:port/database
        const url = new URL(connectionString);
        return {
            host: url.hostname,
            port: url.port,
            user: url.username,
            password: url.password,
            database: url.pathname.slice(1),
            ssl: {
                rejectUnauthorized: false
            }
        };
    } catch (error) {
        console.error('Error parsing connection string:', error);
        throw error;
    }
}

async function setupDatabase() {
    let connection;
    try {
        // Crear conexión inicial usando la cadena de conexión parseada
        const connectionString = process.env.DB_HOST;
        const config = parseConnectionString(connectionString);
        connection = await mysql.createConnection({
            ...config,
            multipleStatements: true
        });
        console.log('Conectado a MySQL');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'database.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Dividir el SQL en comandos individuales y ejecutarlos uno por uno
        const commands = sql.split(';').filter(cmd => cmd.trim());
        
        for (const command of commands) {
            if (!command.trim()) continue;
            try {
                await connection.query(command);
                console.log('Comando SQL ejecutado:', command.substring(0, 50) + '...');
            } catch (err) {
                console.error('Error ejecutando comando SQL:', command.substring(0, 100));
                console.error('Error detallado:', err);
                throw err;
            }
        }
        
        // Verificar que las tablas existen
        const [tables] = await connection.query('SHOW TABLES');
        console.log('Tablas en la base de datos:', tables.map(t => Object.values(t)[0]));

        console.log('Tablas creadas exitosamente');

    } catch (error) {
        console.error('Error al configurar la base de datos:', error);
        process.exit(1);
    } finally {
        if (connection) {
            // Cerrar conexión
            await connection.end();
            console.log('Conexión cerrada');
        }
    }
}

// Ejecutar la configuración
setupDatabase();
