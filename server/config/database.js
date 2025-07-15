// config/database.js
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.MYSQLHOST,      // "mysql.railway.internal"
  user: process.env.MYSQLUSER,      // "root"
  password: process.env.MYSQLPASSWORD, // El password de tu imagen
  database: process.env.MYSQLDATABASE, // "gestor" (¡importante!)
  port: process.env.MYSQLPORT || 3306, // 3306
  waitForConnections: true,
  connectionLimit: 10,
  ssl: { rejectUnauthorized: false }  // Obligatorio
};

const pool = mysql.createPool(dbConfig);

// Verificación de conexión
pool.getConnection()
  .then(connection => {
    console.log('✅ Conectado a MySQL en Railway');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error de conexión a MySQL:', err.message);
    console.error('Configuración usada:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user
    });
  });

module.exports = pool;
