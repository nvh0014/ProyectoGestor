require('dotenv').config();
const express = require('express');
const { corsMiddleware, additionalCorsHeaders } = require('./middleware/cors');
const logger = require('./config/logger');
const { startServer } = require('./config/server');

const app = express();

// =============================================
// 1. Middlewares
// =============================================

// Aplicar CORS
app.use(corsMiddleware);
app.use(additionalCorsHeaders);

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger de solicitudes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// =============================================
// 2. Rutas
// =============================================

// Importar rutas
const authRoutes = require('./routes/auth');
const clienteRoutes = require('./routes/clientes');
const productoRoutes = require('./routes/productos');
const boletaRoutes = require('./routes/boletas');
const apiRoutes = require('./routes/api');

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: 'Gestor Cerro Negro - API Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    status: 'running'
  });
});

// Ruta de prueba básica
app.get('/test', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente' });
});

// Usar las rutas
app.use('/', authRoutes);
app.use('/clientes', clienteRoutes);
app.use('/productos', productoRoutes);
app.use('/boletas', boletaRoutes);
app.use('/api', apiRoutes);

// =============================================
// 3. Manejo de Errores y Inicio del Servidor
// =============================================

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err.stack);
  res.status(500).json({ 
    error: 'Algo salió mal',
    message: err.message
  });
});

// Iniciar servidor
startServer(app);
