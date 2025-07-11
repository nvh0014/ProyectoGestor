# Servidor Gestor

## Configuración

### Variables de Entorno

El servidor usa variables de entorno para la configuración de la base de datos. Sigue estos pasos:

1. Copia el archivo `.env.example` y renómbralo a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edita el archivo `.env` con tus credenciales de base de datos:
   ```
   DB_HOST=tu_host_de_base_de_datos
   DB_USER=tu_usuario_de_base_de_datos
   DB_PASSWORD=tu_contraseña_de_base_de_datos
   DB_PORT=tu_puerto_de_base_de_datos
   DB_NAME=gestor
   PORT=3001
   ```

### Instalación

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Inicia el servidor:
   ```bash
   npm start
   ```
   
   O para desarrollo con auto-recarga:
   ```bash
   npm run dev
   ```

## Estructura de la Base de Datos

El servidor espera que la base de datos tenga las siguientes tablas:

- `usuario` - Tabla de usuarios del sistema
- `cliente` - Tabla de clientes
- `producto` - Tabla de productos
- `boleta` - Tabla de boletas/facturas
- `detallesboleta` - Tabla de detalles de boletas

## Rutas API

### Autenticación
- `POST /register` - Registrar nuevo usuario
- `POST /login` - Iniciar sesión

### Clientes
- `GET /clientes` - Obtener todos los clientes
- `GET /clientes/:id` - Obtener cliente por ID
- `POST /clientes` - Crear nuevo cliente
- `PUT /clientes/:id` - Actualizar cliente
- `DELETE /clientes/:id` - Eliminar cliente (soft delete)

### Productos
- `GET /productos` - Obtener todos los productos
- `GET /productos/:id` - Obtener producto por ID
- `POST /productos` - Crear nuevo producto
- `PUT /productos/:id` - Actualizar producto
- `DELETE /productos/:id` - Eliminar producto (soft delete)

### Boletas
- `GET /boletas` - Obtener todas las boletas
- `GET /boletas/:numero` - Obtener boleta por número
- `POST /boletas` - Crear nueva boleta

### Auxiliares
- `GET /articulos` - Obtener productos activos (alias para productos)
- `GET /usuarios` - Obtener todos los usuarios
- `GET /test` - Verificar que el servidor funciona

## Notas de Seguridad

- El archivo `.env` contiene información sensible y no debe ser incluido en el control de versiones
- Asegúrate de que `.env` esté en tu archivo `.gitignore`
- Usa contraseñas seguras para tu base de datos
- Considera usar conexiones SSL para producción
