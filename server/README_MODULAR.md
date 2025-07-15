# Estructura Modular del Servidor

## Descripción
Este proyecto ha sido reorganizado para mejorar la mantenibilidad y los tiempos de carga. El archivo `server.js` original ha sido dividido en módulos específicos.

## Estructura de Directorios

```
server/
├── config/
│   ├── database.js          # Configuración de base de datos
│   ├── logger.js            # Configuración de logging
│   └── server.js            # Configuración del servidor
├── controllers/
│   ├── authController.js    # Controlador de autenticación
│   ├── clienteController.js # Controlador de clientes
│   ├── productoController.js# Controlador de productos
│   └── boletaController.js  # Controlador de boletas
├── middleware/
│   └── cors.js              # Middleware CORS
├── routes/
│   ├── auth.js              # Rutas de autenticación
│   ├── clientes.js          # Rutas de clientes
│   ├── productos.js         # Rutas de productos
│   ├── boletas.js           # Rutas de boletas
│   └── api.js               # Rutas API generales
├── utils/
│   └── modules.js           # Utilidades de importación
├── server.js                # Archivo principal (modularizado)
└── package.json
```

## Ventajas de la Modularización

### 1. **Separación de Responsabilidades**
- **Controladores**: Lógica de negocio
- **Rutas**: Definición de endpoints
- **Middleware**: Funciones intermedias
- **Configuración**: Ajustes del servidor

### 2. **Mejores Tiempos de Carga**
- Carga bajo demanda de módulos
- Reducción del tiempo de inicialización
- Mejor uso de memoria

### 3. **Mantenibilidad**
- Código más organizado
- Fácil localización de errores
- Actualizaciones más sencillas

### 4. **Escalabilidad**
- Fácil adición de nuevas funcionalidades
- Código reutilizable
- Mejor estructura para testing

## Cómo Usar

### Archivo Principal (server.js)
```javascript
require('dotenv').config();
const express = require('express');
const { corsMiddleware, additionalCorsHeaders } = require('./middleware/cors');
const { startServer } = require('./config/server');

const app = express();

// Middlewares
app.use(corsMiddleware);
app.use(additionalCorsHeaders);

// Rutas
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);

// Iniciar servidor
startServer(app);
```

### Crear Nuevos Controladores
```javascript
const pool = require('../config/database');

const nuevoController = {
  metodo: async (req, res) => {
    try {
      // Lógica aquí
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = nuevoController;
```

### Crear Nuevas Rutas
```javascript
const express = require('express');
const router = express.Router();
const controller = require('../controllers/nuevoController');

router.get('/', controller.metodo);

module.exports = router;
```

## Configuración del Servidor

La configuración del servidor se encuentra en `config/server.js` y incluye:
- Configuración de puerto
- Inicialización de base de datos
- Logging de variables de entorno
- Manejo de errores de inicialización

## Middleware CORS

El middleware CORS está configurado en `middleware/cors.js` con:
- Orígenes permitidos
- Métodos HTTP permitidos
- Headers permitidos
- Configuración de preflight

## Controladores

Cada controlador maneja una entidad específica:
- `authController.js`: Registro, login, usuarios
- `clienteController.js`: CRUD de clientes
- `productoController.js`: CRUD de productos
- `boletaController.js`: CRUD de boletas

## Rutas

Las rutas están organizadas por funcionalidad:
- `auth.js`: `/register`, `/login`, `/usuarios`
- `clientes.js`: `/clientes/*`
- `productos.js`: `/productos/*`
- `boletas.js`: `/boletas/*`
- `api.js`: `/api/*` (rutas generales)

## Comandos Útiles

```bash
# Iniciar servidor en desarrollo
npm run dev

# Iniciar servidor en producción
npm start

# Verificar estructura
ls -la server/
```

## Migración desde el Archivo Original

El archivo `server.js` original ha sido dividido manteniendo toda la funcionalidad:
- ✅ Todas las rutas funcionan igual
- ✅ Misma configuración CORS
- ✅ Misma lógica de base de datos
- ✅ Mismos endpoints disponibles
- ✅ Compatibilidad total con el frontend

## Próximos Pasos

1. Agregar tests unitarios para cada controlador
2. Implementar middleware de autenticación
3. Agregar validación de datos
4. Implementar rate limiting
5. Agregar documentación Swagger
