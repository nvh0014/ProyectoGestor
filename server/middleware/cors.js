const cors = require('cors');

const allowedOrigins = [
  'https://gestorcerronegro.vercel.app',
  'https://gestorcerronegrobackend.vercel.app', // Por si tienes ambas URLs
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://localhost:3001', // Para pruebas locales
  'http://127.0.0.1:3001'  // Para pruebas locales
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // En desarrollo local, ser más permisivo
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    console.log(`🔍 Verificando origen: ${origin}`);
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ Origen permitido: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ Origen no permitido: ${origin}`);
      console.log(`📋 Orígenes permitidos:`, allowedOrigins);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200, // Para navegadores legacy
  maxAge: 86400 // 24 horas
};

const corsMiddleware = cors(corsOptions);

const additionalCorsHeaders = (req, res, next) => {
  const origin = req.headers.origin;
  
  // Aplicar headers adicionales solo si el origen está permitido
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  }
  
  // Log de la petición
  console.log(`${req.method} ${req.path} - Origin: ${origin || 'No origin'}`);
  
  // Responder inmediatamente a peticiones OPTIONS
  if (req.method === 'OPTIONS') {
    console.log('🔄 Respondiendo a petición OPTIONS');
    return res.status(200).end();
  }
  
  next();
};

module.exports = {
  corsMiddleware,
  additionalCorsHeaders
};
