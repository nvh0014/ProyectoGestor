// Configuración de la API
import axios from 'axios';

// IMPORTANTE: Verifica que esta URL sea exactamente la misma que aparece en Railway
const API_BASE_URL = 'https://gestorcerronegrobackend.up.railway.app'; // Cambiado según tu error

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // Mantener false para evitar problemas CORS
  timeout: 10000, // Reducido a 10 segundos
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para requests (agregar logs)
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Enviando petición a:', config.baseURL + config.url);
    return config;
  },
  (error) => {
    console.error('❌ Error en request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => {
    console.log('✅ Respuesta exitosa:', response.status);
    return response;
  },
  (error) => {
    console.error('❌ Error en la API:', error.message);
    console.error('🔧 URL completa:', error.config?.url);
    
    // Información detallada del error
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Data:', error.response.data);
    } else if (error.request) {
      console.error('🌐 No response received:', error.request);
    }

    return Promise.reject(error);
  }
);

// Función para probar la conexión con el backend
export const testConnection = async () => {
  try {
    console.log('🧪 Probando conexión con:', API_BASE_URL);
    
    const response = await api.get('/test');
    console.log('✅ Conexión exitosa:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Error al conectar:', error.message);
    return false;
  }
};

// Función para login
export const login = async (credentials) => {
  try {
    console.log('🔐 Intentando login para:', credentials.NombreUsuario);
    const response = await api.post('/login', credentials);
    return response.data;
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    throw error;
  }
};

// Función para registro
export const register = async (userData) => {
  try {
    console.log('📝 Registrando usuario:', userData.NombreUsuario);
    const response = await api.post('/register', userData);
    return response.data;
  } catch (error) {
    console.error('❌ Error en registro:', error.message);
    throw error;
  }
};

// Servicio API mejorado
export const apiService = {
  // Usuarios
  async getUsers() {
    const response = await api.get('/usuarios');
    return response.data;
  },

  // Clientes
  async getClientes() {
    const response = await api.get('/clientes');
    return response.data;
  },

  async createCliente(clienteData) {
    const response = await api.post('/clientes', clienteData);
    return response.data;
  },

  async updateCliente(id, clienteData) {
    const response = await api.put(`/clientes/${id}`, clienteData);
    return response.data;
  },

  async deleteCliente(id) {
    const response = await api.delete(`/clientes/${id}`);
    return response.data;
  },

  // Productos
  async getProductos() {
    const response = await api.get('/productos');
    return response.data;
  },

  async createProducto(productoData) {
    const response = await api.post('/productos', productoData);
    return response.data;
  },

  async updateProducto(id, productoData) {
    const response = await api.put(`/productos/${id}`, productoData);
    return response.data;
  },

  async deleteProducto(id) {
    const response = await api.delete(`/productos/${id}`);
    return response.data;
  },

  // Boletas
  async getBoletas() {
    const response = await api.get('/boletas');
    return response.data;
  },

  async getBoleta(numero) {
    const response = await api.get(`/boletas/${numero}`);
    return response.data;
  },

  async createBoleta(boletaData) {
    const response = await api.post('/boletas', boletaData);
    return response.data;
  },

  // Artículos (para boletas)
  async getArticulos() {
    const response = await api.get('/articulos');
    return response.data;
  }
};

export { API_BASE_URL, api };
export default api;