#!/usr/bin/env node

// Script inteligente que detecta el entorno automáticamente
console.log('🔍 Detectando entorno de ejecución...');

// Verificar si estamos en Railway
const isRailway = process.env.MYSQLHOST === 'mysql.railway.internal' || 
                  process.env.RAILWAY_ENVIRONMENT === 'true' ||
                  process.env.RAILWAY_STATIC_URL;

// Verificar si estamos en desarrollo local
const isLocal = !isRailway && (
  process.env.MYSQLHOST === 'localhost' || 
  !process.env.MYSQLHOST
);

if (isRailway) {
  console.log('🚀 Modo: RAILWAY');
  console.log('📍 MySQL: mysql.railway.internal');
  console.log('🔐 SSL: Habilitado');
  process.env.RAILWAY_ENVIRONMENT = 'true';
  process.env.NODE_ENV = 'production';
  require('dotenv').config();
} else if (isLocal) {
  console.log('🏠 Modo: LOCAL');
  console.log('📍 MySQL: localhost');
  console.log('🔐 SSL: Deshabilitado');
  process.env.NODE_ENV = 'development';
  require('dotenv').config({ path: '.env.local' });
} else {
  console.log('⚠️  Modo: PRODUCCIÓN (otro proveedor)');
  process.env.NODE_ENV = 'production';
  require('dotenv').config();
}

console.log('');
console.log('📊 Variables de entorno:');
console.log('- MYSQLHOST:', process.env.MYSQLHOST);
console.log('- MYSQLPORT:', process.env.MYSQLPORT);
console.log('- MYSQLDATABASE:', process.env.MYSQLDATABASE);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('');

// Iniciar servidor
require('./server.js');
