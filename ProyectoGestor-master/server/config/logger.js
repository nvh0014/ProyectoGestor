// config/logger.js
const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  // Información general del sistema
  info: (message, data = null) => {
    if (isDevelopment && data) {
      console.log(`ℹ️ ${message}`, data);
    } else {
      console.log(`ℹ️ ${message}`);
    }
  },

  // Éxito en operaciones
  success: (message, data = null) => {
    if (isDevelopment && data) {
      console.log(`✅ ${message}`, data);
    } else {
      console.log(`✅ ${message}`);
    }
  },

  // Errores (con detalles solo en desarrollo)
  error: (message, error = null) => {
    if (isDevelopment && error) {
      console.error(`❌ ${message}`, error);
    } else {
      console.error(`❌ ${message}`);
    }
  },

  // Advertencias
  warning: (message, data = null) => {
    if (isDevelopment && data) {
      console.warn(`⚠️ ${message}`, data);
    } else {
      console.warn(`⚠️ ${message}`);
    }
  },

  // Operaciones de base de datos
  database: (message, data = null) => {
    if (isDevelopment) {
      console.log(`🗄️ ${message}`, data || '');
    } else {
      console.log(`🗄️ ${message}`);
    }
  },

  // Autenticación y seguridad
  auth: (message, username = null) => {
    if (isDevelopment && username) {
      console.log(`🔐 ${message} - Usuario: ${username}`);
    } else {
      console.log(`🔐 ${message}`);
    }
  },

  // Operaciones de API
  api: (message, method = null, endpoint = null) => {
    if (isDevelopment && method && endpoint) {
      console.log(`🌐 ${message} - ${method} ${endpoint}`);
    } else {
      console.log(`🌐 ${message}`);
    }
  }
};

module.exports = logger;
