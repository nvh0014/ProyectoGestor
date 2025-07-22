#!/usr/bin/env node

// Script de debugging para Railway
console.log('🔍 DEBUGGING RAILWAY STARTUP');
console.log('============================');

// Verificar todas las variables
console.log('📊 VARIABLES DE ENTORNO:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('- MYSQLHOST:', process.env.MYSQLHOST);
console.log('- MYSQLDATABASE:', process.env.MYSQLDATABASE);
console.log('- MYSQLUSER:', process.env.MYSQLUSER);
console.log('- MYSQLPORT:', process.env.MYSQLPORT);
console.log('- MYSQLPASSWORD:', process.env.MYSQLPASSWORD ? '✅ CONFIGURADA' : '❌ FALTA');

console.log('\n🔧 CONFIGURACIÓN ACTUAL:');
console.log('- Modo Railway:', process.env.MYSQLHOST === 'mysql.railway.internal' ? '✅' : '❌');
console.log('- SSL habilitado:', process.env.RAILWAY_ENVIRONMENT === 'true' ? '✅' : '❌');

console.log('\n📁 ARCHIVOS CRÍTICOS:');
const fs = require('fs');
const files = ['server.js', 'package.json', 'config/database.js', 'config/server.js'];
files.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`- ${file}: ${exists ? '✅' : '❌'}`);
});

console.log('\n🚀 INTENTANDO INICIAR SERVIDOR...');

// Cargar variables
require('dotenv').config();

// Forzar modo Railway
process.env.RAILWAY_ENVIRONMENT = 'true';
process.env.NODE_ENV = 'production';

// Intentar iniciar
try {
  require('./server.js');
  console.log('✅ Servidor iniciado correctamente');
} catch (error) {
  console.error('❌ ERROR AL INICIAR SERVIDOR:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
