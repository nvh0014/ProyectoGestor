// geo-config.js
// Configuración para el sistema de geobloqueo

module.exports = {
  // Países permitidos (puedes agregar más si es necesario)
  allowedCountries: ['Chile'],
  
  // Configuración de cache
  cache: {
    ttl: 86400, // 24 horas en segundos
    checkPeriod: 3600 // Verificar elementos expirados cada hora
  },
  
  // Configuración de la API de geolocalización
  geoAPI: {
    baseUrl: 'https://get.geojs.io/v1/ip/geo',
    timeout: 5000,
    userAgent: 'GestorApp/1.0',
    retries: 2
  },
  
  // Configuración de logging
  logging: {
    logBlocked: true,
    logAllowed: true,
    logErrors: true,
    logLocal: false // No loggear IPs locales para reducir ruido
  },
  
  // Modo de desarrollo - si está en true, solo logea pero no bloquea
  developmentMode: process.env.NODE_ENV !== 'production',
  
  // Lista blanca de IPs (opcional)
  ipWhitelist: [
    // Puedes agregar IPs específicas que siempre deben ser permitidas
    // '192.168.1.100',
    // '10.0.0.50'
  ],
  
  // Configuración de respuesta para IPs bloqueadas
  blockedResponse: {
    status: 403,
    message: 'Acceso denegado: Solo se permite acceso desde Chile',
    includeCountry: true,
    includeIP: false // Por seguridad, no incluir la IP en la respuesta
  }
};
