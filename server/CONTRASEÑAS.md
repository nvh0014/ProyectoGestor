# Sistema de Contraseñas Seguras - Gestor App

Este sistema implementa hasheo seguro de contraseñas usando bcrypt para proteger las credenciales de usuario.

## Características de Seguridad

### 🔐 **Hasheo de Contraseñas**
- **Algoritmo**: bcrypt con 12 rondas de salt
- **Resistencia**: Protege contra ataques de fuerza bruta y rainbow tables
- **Performance**: ~300ms por hash (balance seguridad/velocidad)

### 🛡️ **Validaciones**
- **Longitud mínima**: 6 caracteres (configurable)
- **Longitud máxima**: 128 caracteres
- **Contraseñas prohibidas**: Lista de contraseñas comunes bloqueadas

### 🔄 **Migración Segura**
- Migración automática de contraseñas existentes
- Detección automática de contraseñas ya hasheadas
- Proceso reversible y seguro

## Nuevas Rutas de API

### `POST /register`
Registro con contraseña hasheada:
```json
{
  "NombreUsuario": "usuario",
  "Password": "miContraseña123"
}
```

**Respuesta exitosa:**
```json
{
  "message": "Usuario registrado exitosamente."
}
```

**Validaciones:**
- ✅ Nombre de usuario único
- ✅ Contraseña mínimo 6 caracteres
- ✅ Hash automático con bcrypt

### `POST /login`
Login con verificación de hash:
```json
{
  "NombreUsuario": "usuario",
  "Password": "miContraseña123"
}
```

**Respuesta exitosa:**
```json
{
  "status": "success",
  "message": "Inicio de sesión exitoso",
  "user": {
    "CodigoUsuario": 1,
    "NombreUsuario": "usuario"
  }
}
```

### `POST /change-password`
Cambio de contraseña para usuarios existentes:
```json
{
  "NombreUsuario": "usuario",
  "CurrentPassword": "contraseñaActual",
  "NewPassword": "nuevaContraseña123"
}
```

### `POST /admin/migrate-passwords`
Migración de contraseñas existentes (solo admin):
```json
{
  "adminKey": "MIGRATE_PASSWORDS_2025"
}
```

**Respuesta:**
```json
{
  "message": "Migración completada",
  "totalUsers": 10,
  "migratedPasswords": 8,
  "errors": 0,
  "timestamp": "2025-07-10T15:30:00.000Z"
}
```

## Configuración

### Variables de Entorno
```bash
# Clave para migración de contraseñas (opcional, usa default si no está definida)
ADMIN_MIGRATION_KEY=tu_clave_secreta_aqui
```

### Archivo de Configuración
Edita `password-config.js` para personalizar:

```javascript
{
  bcrypt: {
    saltRounds: 12  // Ajusta según necesidades de performance
  },
  validation: {
    minLength: 6,
    requireUppercase: false,  // Cambiar a true para más seguridad
    requireNumbers: false,    // Cambiar a true para más seguridad
    // ... más opciones
  }
}
```

## Proceso de Migración

### Para Usuarios Existentes

1. **Identificar usuarios con contraseñas sin hashear**
2. **Ejecutar migración una sola vez**:
   ```bash
   curl -X POST http://localhost:5000/admin/migrate-passwords \
        -H "Content-Type: application/json" \
        -d '{"adminKey": "MIGRATE_PASSWORDS_2025"}'
   ```
3. **Verificar logs del servidor**
4. **Confirmar que la migración fue exitosa**

### ⚠️ **Importante**
- **Backup**: Hacer respaldo de la base de datos antes de migrar
- **Una sola vez**: La migración solo debe ejecutarse una vez
- **Ambiente seguro**: Ejecutar en ambiente controlado
- **Verificación**: Verificar que usuarios pueden hacer login después

## Seguridad Adicional

### Logs de Seguridad
El sistema registra:
- ✅ Logins exitosos
- ❌ Intentos de login fallidos
- 🔄 Cambios de contraseña
- 📊 Resultados de migración

### Mejores Prácticas

1. **Usar HTTPS**: Siempre en producción
2. **Rate Limiting**: Implementar para prevenir ataques de fuerza bruta
3. **Monitoreo**: Vigilar intentos de login sospechosos
4. **Rotación**: Considerar expiración de contraseñas para usuarios críticos
5. **2FA**: Implementar autenticación de dos factores para administradores

## Validación en Frontend

Usa las utilidades proporcionadas:

```javascript
import { validatePasswordStrength, changePassword } from './utils/geoUtils';

// Validar fortaleza de contraseña
const validation = validatePasswordStrength('miPassword123');
console.log(validation.strength); // "Moderada", "Fuerte", etc.

// Cambiar contraseña
const result = await changePassword('usuario', 'actual', 'nueva');
if (result.success) {
  console.log('Contraseña cambiada exitosamente');
}
```

## Troubleshooting

### Error: "Usuario no encontrado"
- Verificar que el usuario existe en la base de datos
- Verificar ortografía del nombre de usuario

### Error: "Contraseña actual incorrecta"
- El usuario ingresó mal su contraseña actual
- Verificar que la migración se ejecutó correctamente

### Error en migración
- Verificar conexión a base de datos
- Verificar permisos de escritura
- Revisar logs del servidor para detalles

### Performance lenta
- Considerar reducir `saltRounds` en `password-config.js`
- Balancear seguridad vs velocidad según necesidades
