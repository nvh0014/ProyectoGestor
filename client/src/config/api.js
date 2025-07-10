// Configuración de la API
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Crear instancia de axios con configuración base

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en la API:', error);
    console.error('URL base configurada:', API_BASE_URL);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ No se puede conectar al servidor backend');
      console.error('🔧 Verifique que el servidor esté ejecutándose en:', API_BASE_URL);
      console.error('💡 Comando para iniciar el servidor: cd server && npm start');
    }
    
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      console.error('❌ Error de red - Verifique la conexión');
      console.error('🔧 Si está accediendo desde Android, verifique:');
      console.error('   - Que ambos dispositivos estén en la misma red WiFi');
      console.error('   - Que el firewall permita conexiones al puerto 3001');
      console.error('   - Que la URL en .env.local tenga la IP correcta');
    }
    
    return Promise.reject(error);
  }
);

// Función para probar la conexión con el backend
export const testConnection = async () => {
  try {
    console.log('🧪 Probando conexión con:', API_BASE_URL);
    
    // Usar una ruta simple que siempre esté disponible
    const response = await api.get('/usuarios', {
      timeout: 5000 // 5 segundos de timeout específico para esta prueba
    });
    
    console.log('✅ Conexión exitosa con el backend');
    console.log('📊 Respuesta del servidor:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con el backend:', error.message);
    
    // Información detallada del error para debugging
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 El servidor no está ejecutándose en el puerto 3001');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🌐 No se puede resolver localhost');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⏰ Tiempo de espera agotado');
    }
    
    return false;
  }
};

export { API_BASE_URL, api };
export default api;
