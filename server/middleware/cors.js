// Se importa la librería cors requerida para el control de acceso
const cors = require('cors');

// Se establece la lista de dominios autorizados para interactuar con la API
const origenesPermitidos = [
  'http://localhost:3000',
  'https://proyecto-gestor-irku.vercel.app'
];

// Se configuran las directivas de acceso evaluando el origen de la petición
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

// Se aplica el middleware a la instancia de la aplicación
app.use(cors(opcionesCors));