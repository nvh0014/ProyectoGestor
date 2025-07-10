# Gestor - Guía de Solución de Problemas

## 🚨 Problema: "No carga el backend"

### Síntomas
- Error de conexión en la aplicación
- Mensaje: "No se puede conectar con el servidor backend"
- La aplicación no puede cargar datos

### Soluciones

#### 1. **Verificación Rápida**
```bash
# Verificar si el servidor está ejecutándose
curl http://localhost:3001/usuarios
```

#### 2. **Iniciar Servidores Automáticamente**
- Ejecutar el archivo `start-servers.bat` desde la carpeta raíz del proyecto
- Esto iniciará tanto el backend (puerto 3001) como el frontend (puerto 3000)

#### 3. **Inicio Manual del Backend**
```bash
cd server
npm start
```

#### 4. **Inicio Manual del Frontend**
```bash
cd client
npm start
```

### Puertos Utilizados
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:3000

### Verificación del Estado
1. **Backend funcionando**: Debe responder con datos JSON en http://localhost:3001/usuarios
2. **Frontend funcionando**: Debe abrir automáticamente en http://localhost:3000

### Problemas Comunes

#### Error de Puerto Ocupado
```bash
# Si el puerto 3001 está ocupado, encontrar qué proceso lo usa:
netstat -ano | findstr :3001

# Terminar el proceso (reemplazar PID con el número real):
taskkill /PID [PID] /F
```

#### Error de Base de Datos
- Verificar que MySQL esté ejecutándose
- Comprobar las credenciales en `server/server.js`
- Asegurar que la base de datos existe

#### Error de Dependencias
```bash
# Reinstalar dependencias del servidor
cd server
npm install

# Reinstalar dependencias del cliente
cd client
npm install
```

### Logs Útiles
- **Backend**: Los errores aparecen en la consola del servidor
- **Frontend**: Los errores aparecen en la consola del navegador (F12)

### Contacto
Si el problema persiste, revisar:
1. Consola del navegador (F12)
2. Consola del servidor backend
3. Estado de la base de datos MySQL
