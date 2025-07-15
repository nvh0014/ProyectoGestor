// Configuración de la API
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: 'https://gestorcerronegrobackend.up.railway.app',
  timeout: 30000,
  withCredentials: true
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
    }

    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      console.error('❌ Error de red - Verifique la conexión');
    }

    return Promise.reject(error);
  }
);

// Función para probar la conexión con el backend
export const testConnection = async () => {
  try {
    console.log('🧪 Probando conexión con:', API_BASE_URL);

    // Usar la ruta de test que sabemos que funciona
    const response = await api.get('/test', {
      timeout: 5000 // 5 segundos de timeout específico para esta prueba
    });

    console.log('✅ Conexión exitosa con el backend');
    console.log('📊 Respuesta del servidor:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con el backend:', error.message);
    console.error('🔧 URL que se está probando:', `${API_BASE_URL}/test`);

    // Información detallada del error para debugging
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 El servidor no está ejecutándose');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🌐 No se puede resolver el dominio');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⏰ Tiempo de espera agotado');
    } else if (error.message.includes('CORS')) {
      console.error('🚫 Error de CORS - Problema de configuración del servidor');
    }

    return false;
  }
};

// Función específica para probar CORS
export const testCORS = async () => {
  try {
    console.log('🧪 Probando CORS con:', API_BASE_URL);
    
    const response = await api.get('/api/cors-test', {
      timeout: 5000
    });

    console.log('✅ CORS funcionando correctamente');
    console.log('📊 Respuesta:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Error en prueba CORS:', error.message);
    return false;
  }
};

// Servicio API simplificado
export const apiService = {
  async getUsers() {
    try {
      const response = await api.get('/api/users');
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  },

  async createUser(userData) {
    try {
      const response = await api.post('/api/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
  }
};

export { API_BASE_URL, api };
export default api;