// Archivo de utilidad para importar todos los módulos necesarios
const authController = require('./controllers/authController');
const clienteController = require('./controllers/clienteController');
const productoController = require('./controllers/productoController');
const boletaController = require('./controllers/boletaController');

const authRoutes = require('./routes/auth');
const clienteRoutes = require('./routes/clientes');
const productoRoutes = require('./routes/productos');
const boletaRoutes = require('./routes/boletas');
const apiRoutes = require('./routes/api');

const { corsMiddleware, additionalCorsHeaders } = require('./middleware/cors');
const { config, startServer } = require('./config/server');

module.exports = {
  controllers: {
    auth: authController,
    cliente: clienteController,
    producto: productoController,
    boleta: boletaController
  },
  routes: {
    auth: authRoutes,
    cliente: clienteRoutes,
    producto: productoRoutes,
    boleta: boletaRoutes,
    api: apiRoutes
  },
  middleware: {
    cors: corsMiddleware,
    corsHeaders: additionalCorsHeaders
  },
  config,
  startServer
};
