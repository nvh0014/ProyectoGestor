const cors = require('cors');

// Se definen los orígenes autorizados para interactuar con la API
const origenesPermitidos = [
  'http://localhost:3000',
  'https://gestorcerronegro.vercel.app'
];

// Se definen las opciones de configuración de CORS
const opcionesCors = {
  origin: function (origin, callback) {
    if (!origin || origenesPermitidos.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por la política CORS del servidor'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Se exporta el middleware ya inicializado
module.exports = cors(opcionesCors);
