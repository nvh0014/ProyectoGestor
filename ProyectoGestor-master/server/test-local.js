// test-local.js - Script para probar conexión local
require('dotenv').config({ path: '.env.local' });
process.env.NODE_ENV = 'development';

const pool = require('./config/database');

async function testConnection() {
  try {
    console.log('🔄 Probando conexión a MySQL local...');
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa!');
    
    // Probar una query simple
    const [rows] = await connection.execute('SELECT 1 + 1 AS result');
    console.log('✅ Query de prueba exitosa:', rows[0].result);
    
    // Verificar si existe la base de datos
    const [databases] = await connection.execute('SHOW DATABASES');
    const hasGestor = databases.some(db => db.Database === 'gestor');
    console.log('📊 Base de datos "gestor" existe:', hasGestor ? '✅' : '❌');
    
    connection.release();
    
    if (!hasGestor) {
      console.log('⚠️  Necesitas crear la base de datos "gestor"');
      console.log('   Ejecuta: CREATE DATABASE gestor;');
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('💡 Soluciones posibles:');
    console.log('   1. Asegúrate de que MySQL esté ejecutándose');
    console.log('   2. Verifica usuario y contraseña en .env.local');
    console.log('   3. Verifica que el puerto 3306 esté disponible');
  }
  
  process.exit(0);
}

testConnection();
