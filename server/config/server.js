const pool = require('./database');

// Configuración del servidor
const config = {
  PORT: process.env.PORT || 3001,
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://gestorcerronegro.vercel.app'
};

// Conexión a la Base de Datos
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log('✅ Base de datos conectada');
  } catch (error) {
    console.error('❌ Fallo al conectar a la base de datos:', error);
    process.exit(1);
  }
}

// Inicialización del servidor
async function startServer(app) {
  try {
    // Log de variables de entorno importantes (sin mostrar passwords)
    console.log('🔧 Configuración del servidor:');
    console.log('- Puerto:', config.PORT);
    console.log('- Frontend URL:', config.FRONTEND_URL);
    console.log('- MySQL Host:', process.env.MYSQLHOST || 'localhost');
    console.log('- MySQL Port:', process.env.MYSQLPORT || 3306);
    console.log('- MySQL Database:', process.env.MYSQLDATABASE || 'gestor');
    console.log('- MySQL User:', process.env.MYSQLUSER || 'root');
    console.log('- Node Version:', process.version);
    
    console.log('🔄 Inicializando base de datos...');
    await initializeDatabase();
    
    console.log('🚀 Iniciando servidor...');
    app.listen(config.PORT, () => {
      console.log(`✅ Servidor escuchando en puerto ${config.PORT}`);
      console.log(`🔗 Frontend permitido: ${config.FRONTEND_URL}`);
      console.log(`🌐 URL del servidor: http://localhost:${config.PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

module.exports = {
  config,
  startServer
};
