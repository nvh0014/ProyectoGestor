#!/usr/bin/env node

// Script para iniciar el servidor en modo desarrollo local
console.log('🚀 Iniciando servidor en modo desarrollo LOCAL...');
console.log('📍 Configuración: MySQL local, CORS permisivo');
console.log('🔧 Asegúrate de que tu MySQL local esté ejecutándose');
console.log('');

// Cargar variables de entorno local
require('dotenv').config({ path: '.env.local' });

// Configurar modo desarrollo
process.env.NODE_ENV = 'development';

// Iniciar servidor
require('./server.js');
