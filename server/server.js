/* Se cargan las variables de entorno dependiendo del contexto de ejecucion */
require('dotenv').config({ 
  path: process.env.NODE_ENV === 'production' ? '.env' : '.env.local' 
});

const express = require('express');
const corsMiddleware = require('./middleware/cors');
const logger = require('./config/logger');
const { startServer } = require('./config/server');

const app = express();

/* Se aplican los middlewares de seguridad y formato de datos */
app.use(corsMiddleware);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* Se registra en consola el metodo y la ruta de cada solicitud entrante */
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

/* Se definen e importan las rutas principales del sistema */
const authRoutes = require('./routes/auth');
const clienteRoutes = require('./routes/clientes');
const productoRoutes = require('./routes/productos');
const boletaRoutes = require('./routes/boletas');
const apiRoutes = require('./routes/api');
const articulosRoutes = require('./routes/articulos');
const debugRoutes = require('./routes/debug');

app.get('/', (req, res) => {
  res.json({ 
    message: 'Gestor Cerro Negro - API Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    status: 'running'
  });
});

app.get('/test', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente' });
});

/* Se asocian las rutas importadas a sus endpoints correspondientes */
app.use('/', authRoutes);
app.use('/clientes', clienteRoutes);
app.use('/productos', productoRoutes);
app.use('/boletas', boletaRoutes);
app.use('/articulos', articulosRoutes);
app.use('/api', apiRoutes);
app.use('/debug', debugRoutes);

/* Se interceptan las rutas no definidas para retornar un error 404 */
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

/* Se capturan y formatean los errores globales del servidor */
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err.stack);
  res.status(500).json({ 
    error: 'Algo salio mal',
    message: err.message
  });
});

/* Se inicia la ejecucion del servidor web */
startServer(app);