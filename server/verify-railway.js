#!/usr/bin/env node

// Script para verificar TODO lo necesario para Railway
console.log('🔍 VERIFICACIÓN COMPLETA PARA RAILWAY');
console.log('=====================================');

// 1. Verificar archivos necesarios
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'server.js',
  'package.json',
  'server-auto.js',
  'config/database.js',
  'config/server.js',
  'routes/auth.js',
  'controllers/authController.js',
  'middleware/cors.js'
];

console.log('\n📁 VERIFICANDO ARCHIVOS:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

// 2. Verificar package.json
console.log('\n📦 VERIFICANDO PACKAGE.JSON:');
const packageJson = require('./package.json');
console.log(`   ✅ Nombre: ${packageJson.name}`);
console.log(`   ✅ Versión: ${packageJson.version}`);
console.log(`   ✅ Script start: ${packageJson.scripts.start}`);
console.log(`   ✅ Main: ${packageJson.main}`);

// 3. Verificar dependencias críticas
console.log('\n🔧 VERIFICANDO DEPENDENCIAS:');
const criticalDeps = ['express', 'mysql2', 'cors', 'bcrypt', 'dotenv'];
criticalDeps.forEach(dep => {
  const exists = packageJson.dependencies[dep];
  console.log(`   ${exists ? '✅' : '❌'} ${dep}: ${exists || 'FALTA'}`);
});

// 4. Verificar variables de entorno
console.log('\n🌍 VERIFICANDO VARIABLES DE ENTORNO:');
require('dotenv').config();
const requiredVars = ['MYSQLHOST', 'MYSQLUSER', 'MYSQLPASSWORD', 'MYSQLDATABASE', 'MYSQLPORT'];
requiredVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`   ${value ? '✅' : '❌'} ${varName}: ${value ? 'CONFIGURADA' : 'FALTA'}`);
});

// 5. Verificar sintaxis del servidor
console.log('\n🔍 VERIFICANDO SINTAXIS:');
try {
  require('./server-auto.js');
  console.log('   ✅ server-auto.js: SINTAXIS OK');
} catch (err) {
  console.log('   ❌ server-auto.js: ERROR -', err.message);
}

console.log('\n🎯 RESUMEN:');
console.log('1. Sube tu código a GitHub');
console.log('2. Conecta Railway a tu repositorio');
console.log('3. Agrega las variables de entorno en Railway');
console.log('4. Redeploya el servicio');
console.log('');
console.log('📝 Variables para Railway (copia y pega):');
console.log('MYSQLDATABASE=gestor');
console.log('MYSQLHOST=mysql.railway.internal');
console.log('MYSQLPASSWORD=hFLvosNAYJNeDQXUwCWmsMYooljUkJaw');
console.log('MYSQLPORT=3306');
console.log('MYSQLUSER=root');
console.log('PORT=3001');
console.log('FRONTEND_URL=https://gestorcerronegro.vercel.app');
console.log('RAILWAY_ENVIRONMENT=true');
console.log('NODE_ENV=production');

process.exit(0);
