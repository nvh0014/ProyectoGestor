#!/usr/bin/env node

// Script para iniciar el servidor en Railway
console.log('🚀 Iniciando servidor para Railway...');
console.log('📍 Configuración: MySQL Railway, SSL habilitado');
console.log('🔧 Conectando a mysql.railway.internal');
console.log('');

// Cargar variables de entorno de Railway
require('dotenv').config();

// Asegurar que esté en modo Railway
process.env.RAILWAY_ENVIRONMENT = 'true';
process.env.NODE_ENV = 'production';

// Iniciar servidor
require('./server.js');
