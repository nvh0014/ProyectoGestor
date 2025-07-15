// config/database.js
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10,
  acquireTimeout: 60000,  // 60 segundos
  timeout: 60000,         // 60 segundos  
  reconnect: true,
  ssl: { 
    rejectUnauthorized: false
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
