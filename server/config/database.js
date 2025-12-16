// config/database.js
const mysql = require('mysql2/promise');

// Detectar entorno automáticamente
const isProduction = process.env.NODE_ENV === 'production';
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'true' || process.env.MYSQLHOST === 'mysql.railway.internal';
const isLocal = !isRailway && !isProduction;

// Configuración adaptativa
const dbConfig = {
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'gestor',
  port: process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  // Configuración específica para Railway
  ...(isRailway && {
    ssl: { rejectUnauthorized: false },
    socketPath: null,
    flags: '-FOUND_ROWS'
  })
};

const pool = mysql.createPool(dbConfig);

// Verificación de conexión con información detallada
pool.getConnection()
  .then(connection => {
    let environment = 'Local';
    if (isRailway) environment = 'Railway';
    else if (isProduction) environment = 'Production';
    
    console.log(`✅ Conectado a MySQL ${environment}`);
    console.log(`📍 Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`📊 Database: ${dbConfig.database}`);
    console.log(`👤 User: ${dbConfig.user}`);
    console.log(`🔐 SSL: ${isRailway ? 'Habilitado' : 'Deshabilitado'}`);
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error de conexión a MySQL:', err.message);
    console.error('Configuración usada:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      ssl: isRailway ? 'enabled' : 'disabled'
    });
  });

module.exports = pool;
