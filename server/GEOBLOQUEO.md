# Sistema de Geobloqueo - Gestor App

Este sistema implementa geobloqueo basado en IP para permitir solo conexiones desde Chile, aumentando la seguridad del servidor.

## Características

- **Geolocalización por IP**: Utiliza la API de GeoJS para determinar el país de origen de cada IP
- **Cache inteligente**: Las consultas se cachean por 24 horas para mejorar el rendimiento
- **Manejo de errores**: Si la API falla, permite el acceso pero registra el evento
- **IPs locales**: Automáticamente permite IPs locales/privadas para desarrollo
- **Lista blanca**: Soporte para IPs específicas que siempre deben ser permitidas
- **Modo desarrollo**: Configurable para solo loggear sin bloquear durante desarrollo

## Configuración

El archivo `geo-config.js` contiene todas las configuraciones:

```javascript
{
  allowedCountries: ['Chile'],        // Países permitidos
  developmentMode: false,             // Modo desarrollo (solo log, no bloqueo)
  ipWhitelist: [],                   // IPs siempre permitidas
  cache: {
    ttl: 86400                       // Cache por 24 horas
  }
}
```

## Rutas de API

### `/api/geo-status`
Muestra información sobre la IP actual:
```json
{
  "ip": "190.xxx.xxx.xxx",
  "country": "Chile", 
  "allowed": true,
  "source": "cache",
  "allowedCountries": ["Chile"],
  "developmentMode": false
}
```

### `/api/geo-admin`
Estadísticas y administración (solo para administradores):
```json
{
  "configuration": {
    "allowedCountries": ["Chile"],
    "developmentMode": false,
    "cacheTimeout": 86400,
    "ipWhitelistCount": 0
  },
  "cache": {
    "totalCachedIPs": 5,
    "cacheHits": 12,
    "cacheMisses": 5
  },
  "cachedEntries": {
    "190.xxx.xxx.xxx": {
      "country": "Chile",
      "timestamp": "2025-07-10T15:30:00.000Z",
      "allowed": true
    }
  }
}
```

### `/api/geo-admin/clear-cache`
Limpia el cache de geolocalización (POST).

## Logs

El sistema registra eventos importantes:

- ✅ **IPs permitidas**: De Chile o en lista blanca
- ❌ **IPs bloqueadas**: De otros países
- ⚠️ **Errores**: Fallos en API o configuración
- 🔧 **Modo desarrollo**: Cuando permite acceso que normalmente sería bloqueado

## Variables de Entorno

- `NODE_ENV=production`: Activa el bloqueo real (en desarrollo solo logea)

## Seguridad

- Las respuestas de error no incluyen la IP del cliente por defecto
- El sistema es tolerante a fallos (permite acceso si no puede verificar)
- Reintentos automáticos en caso de fallo temporal de la API
- Cache distribuido para mejorar rendimiento y reducir consultas

## API Utilizada

- **GeoJS** (https://get.geojs.io/): Servicio gratuito de geolocalización por IP
- Límite: Sin límites documentados para uso normal
- Precisión: País nivel, suficiente para geobloqueo

## Monitoreo

Recomendaciones para producción:

1. Monitorear logs de IPs bloqueadas para detectar patrones
2. Revisar estadísticas de cache regularmente
3. Configurar alertas si la API de geolocalización falla frecuentemente
4. Considerar implementar rate limiting adicional
