// config/database.js
const mysql = require('mysql2');

// Configuración de la base de datos usando variables de entorno
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '141205',
  database: process.env.DB_NAME || 'gestor',
  port: process.env.DB_PORT || 3306, // Puerto estándar de MySQL
  // Configuraciones adicionales para producción
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Crear conexión a la base de datos
const db = mysql.createConnection(dbConfig);

// Función para conectar a la base de datos
const connectDatabase = () => {
  return new Promise((resolve, reject) => {
    db.connect((err) => {
      if (err) {
        // Logging para desarrollo/debugging
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Error de conexión a la base de datos:', err.message);
          console.error('🔧 Configuración:', {
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbConfig.database,
            user: dbConfig.user
          });
        } else {
          // Logging para producción (sin exponer detalles sensibles)
          console.error('❌ Error de conexión a la base de datos. Verificar configuración.');
        }
        reject(err);
        return;
      }
      
      // Mensajes apropiados según el entorno
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Conexión establecida con la base de datos');
        console.log(`📊 Base de datos: ${dbConfig.database}`);
      } else {
        console.log('✅ Sistema de base de datos inicializado correctamente');
      }

      // Verificar si existe al menos un usuario
      const checkUserQuery = 'SELECT COUNT(*) as count FROM usuario';
      db.query(checkUserQuery, (err, results) => {
        if (err) {
          console.error('❌ Error al verificar la integridad de la base de datos');
          reject(err);
          return;
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Base de datos verificada correctamente');
          console.log(`👥 Usuarios registrados: ${results[0].count}`);
        } else {
          console.log('✅ Sistema de autenticación inicializado');
        }
        resolve();
      });
    });
  });
};

// Manejar errores de conexión
db.on('error', (err) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error en la base de datos:', err.message);
  } else {
    console.error('❌ Error del sistema de base de datos');
  }
  
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('🔄 Reestableciendo conexión...');
    connectDatabase().catch(() => {
      console.error('❌ No se pudo restablecer la conexión');
    });
  } else {
    throw err;
  }
});

module.exports = {
  db,
  connectDatabase,
  dbConfig
};
