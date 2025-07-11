# Scripts de administración para el sistema de geobloqueo

## Verificar estado del servidor
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*server*" }

## Iniciar servidor con logs de geobloqueo
cd "c:\Users\Andy\Desktop\Gestor\server"
$env:NODE_ENV="production"  # Para activar bloqueo real
node server.js

## Verificar geolocalización de una IP específica (ejemplo)
# Invoke-RestMethod -Uri "https://get.geojs.io/v1/ip/geo/200.14.86.1.json" | ConvertTo-Json

## Probar el sistema de geobloqueo local
# Invoke-RestMethod -Uri "http://localhost:5000/api/geo-status" | ConvertTo-Json

## Obtener estadísticas de administración
# Invoke-RestMethod -Uri "http://localhost:5000/api/geo-admin" | ConvertTo-Json

## Limpiar cache de geolocalización
# Invoke-RestMethod -Uri "http://localhost:5000/api/geo-admin/clear-cache" -Method POST | ConvertTo-Json
