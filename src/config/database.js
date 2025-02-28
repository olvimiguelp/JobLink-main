const mysql = require('mysql2');
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

const config = parseConnectionString(process.env.DB_HOST);
const pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();
