// test-railway.js - Script para probar conexión Railway
require('dotenv').config();

// Configurar modo Railway
process.env.RAILWAY_ENVIRONMENT = 'true';
process.env.NODE_ENV = 'production';

const pool = require('./config/database');

async function testRailwayConnection() {
  try {
    console.log('🔄 Probando conexión a Railway MySQL...');
    console.log('📍 Host:', process.env.MYSQLHOST);
    console.log('📊 Database:', process.env.MYSQLDATABASE);
    console.log('👤 User:', process.env.MYSQLUSER);
    console.log('');
    
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa a Railway!');
    
    // Probar una query simple
    const [rows] = await connection.execute('SELECT 1 + 1 AS result');
    console.log('✅ Query de prueba exitosa:', rows[0].result);
    
    // Verificar si existe la base de datos
    const [databases] = await connection.execute('SHOW DATABASES');
    const hasGestor = databases.some(db => db.Database === 'gestor');
    console.log('📊 Base de datos "gestor" existe:', hasGestor ? '✅' : '❌');
    
    // Verificar tablas
    if (hasGestor) {
      const [tables] = await connection.execute('SHOW TABLES FROM gestor');
      console.log('📋 Tablas encontradas:', tables.length);
      tables.forEach(table => {
        console.log(`   - ${Object.values(table)[0]}`);
      });
    }
    
    connection.release();
    console.log('');
    console.log('🎉 ¡Conexión a Railway exitosa!');
    
  } catch (error) {
    console.error('❌ Error de conexión a Railway:', error.message);
    console.log('');
    console.log('💡 Verificaciones:');
    console.log('   1. Variables de entorno correctas en .env');
    console.log('   2. Servicio MySQL activo en Railway');
    console.log('   3. Red interna accesible');
    console.log('   4. Credenciales válidas');
  }
  
  process.exit(0);
}

testRailwayConnection();
