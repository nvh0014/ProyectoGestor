// config/database.js
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'gestor',
  port: process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { 
    rejectUnauthorized: false // Temporal para Railway
  }
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
