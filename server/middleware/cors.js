const cors = require('cors');

/* Se definen los origenes permitidos para la aplicacion */
const origenesPermitidos = [
  'http://localhost:3000',
  'https://proyecto-gestor-irku.vercel.app'
];

/* Se configura y exporta el middleware de CORS */
const opcionesCors = cors({
  origin: function (origin, callback) {
    if (!origin || origenesPermitidos.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por la politica CORS del servidor'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

module.exports = opcionesCors;