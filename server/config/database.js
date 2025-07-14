// config/database.js
const mysql = require('mysql2/promise'); // Usa promises para mejor manejo

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
    rejectUnauthorized: true // Habilita SSL para producción
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
    console.error('Configuración usada:', dbConfig); // Debug
  });

module.exports = pool;

// Función para verificar y corregir el tamaño de la columna Password
const verificarEstructuraTablas = () => {
  return new Promise((resolve, reject) => {
    // Verificar el tamaño actual de la columna Password
    const checkPasswordColumnQuery = `
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'usuario' AND COLUMN_NAME = 'Password'
    `;
    
    db.query(checkPasswordColumnQuery, [dbConfig.database], (err, results) => {
      if (err) {
        console.error('❌ Error al verificar estructura de tablas:', err.message);
        reject(err);
        return;
      }
      
      if (results.length === 0) {
        console.error('❌ No se encontró la columna Password en la tabla usuario');
        reject(new Error('Columna Password no encontrada'));
        return;
      }
      
      const passwordColumn = results[0];
      const currentLength = passwordColumn.CHARACTER_MAXIMUM_LENGTH;
      
      // Las contraseñas hasheadas con bcrypt necesitan al menos 60 caracteres
      if (currentLength < 60) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`⚠️ Columna Password tiene ${currentLength} caracteres, necesita al menos 60`);
          console.log('🔧 Corrigiendo estructura de la base de datos...');
        } else {
          console.log('🔧 Actualizando estructura de la base de datos...');
        }
        
        // Modificar la columna para que pueda almacenar contraseñas hasheadas
        const alterTableQuery = 'ALTER TABLE usuario MODIFY COLUMN Password VARCHAR(255)';
        db.query(alterTableQuery, (err) => {
          if (err) {
            console.error('❌ Error al modificar columna Password:', err.message);
            reject(err);
            return;
          }
          
          console.log('✅ Estructura de base de datos actualizada correctamente');
          resolve();
        });
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Columna Password tiene el tamaño correcto (${currentLength} caracteres)`);
        }
        resolve();
      }
    });
  });
};

// Función para conectar a la base de datos
const connectDatabase = () => {
  return new Promise((resolve, reject) => {
    db.connect(async (err) => {
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

      try {
        // Verificar y corregir estructura de tablas
        await verificarEstructuraTablas();
        
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
      } catch (structureError) {
        console.error('❌ Error en la estructura de la base de datos');
        reject(structureError);
      }
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
  verificarEstructuraTablas,
  dbConfig
};
