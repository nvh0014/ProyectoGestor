# Scripts de administración completos para Gestor App
# Incluye geobloqueo y sistema de contraseñas

Write-Host "🔧 Scripts de Administración - Gestor App" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# Función para verificar estado del servidor
function Test-ServerStatus {
    Write-Host "`n📊 Verificando estado del servidor..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/test" -Method GET -TimeoutSec 5
        Write-Host "✅ Servidor funcionando: $($response.message)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Servidor no responde" -ForegroundColor Red
        return $false
    }
}

# Función para verificar geolocalización
function Test-Geolocation {
    Write-Host "`n🌍 Verificando sistema de geobloqueo..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/geo-status" -Method GET
        Write-Host "✅ País detectado: $($response.country)" -ForegroundColor Green
        Write-Host "✅ Acceso permitido: $($response.allowed)" -ForegroundColor Green
        Write-Host "✅ Fuente: $($response.source)" -ForegroundColor Green
        if ($response.developmentMode) {
            Write-Host "⚠️  Modo desarrollo activo" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Error verificando geolocalización" -ForegroundColor Red
    }
}

# Función para obtener estadísticas
function Get-AdminStats {
    Write-Host "`n📈 Obteniendo estadísticas..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/geo-admin" -Method GET
        Write-Host "✅ IPs en cache: $($response.cache.totalCachedIPs)" -ForegroundColor Green
        Write-Host "✅ Cache hits: $($response.cache.cacheHits)" -ForegroundColor Green
        Write-Host "✅ Cache misses: $($response.cache.cacheMisses)" -ForegroundColor Green
        Write-Host "✅ Países permitidos: $($response.configuration.allowedCountries -join ', ')" -ForegroundColor Green
        Write-Host "✅ Modo desarrollo: $($response.configuration.developmentMode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error obteniendo estadísticas" -ForegroundColor Red
    }
}

# Función para migrar contraseñas
function Start-PasswordMigration {
    Write-Host "`n🔐 Iniciando migración de contraseñas..." -ForegroundColor Yellow
    Write-Host "⚠️  IMPORTANTE: Asegúrate de tener un backup de la base de datos" -ForegroundColor Red
    
    $confirm = Read-Host "¿Continuar con la migración? (y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "❌ Migración cancelada" -ForegroundColor Yellow
        return
    }
    
    try {
        $body = @{ adminKey = "MIGRATE_PASSWORDS_2025" } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "http://localhost:5000/admin/migrate-passwords" -Method POST -Body $body -ContentType "application/json"
        
        Write-Host "✅ Migración completada:" -ForegroundColor Green
        Write-Host "   - Total usuarios: $($response.totalUsers)" -ForegroundColor White
        Write-Host "   - Contraseñas migradas: $($response.migratedPasswords)" -ForegroundColor White
        Write-Host "   - Errores: $($response.errors)" -ForegroundColor White
        Write-Host "   - Timestamp: $($response.timestamp)" -ForegroundColor White
    } catch {
        Write-Host "❌ Error en migración: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Función para limpiar cache
function Clear-GeoCache {
    Write-Host "`n🧹 Limpiando cache de geolocalización..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/geo-admin/clear-cache" -Method POST -ContentType "application/json"
        Write-Host "✅ $($response.message)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error limpiando cache" -ForegroundColor Red
    }
}

# Función para iniciar servidor
function Start-ProductionServer {
    Write-Host "`n🚀 Iniciando servidor en modo producción..." -ForegroundColor Yellow
    
    Set-Location "c:\Users\Andy\Desktop\Gestor\server"
    $env:NODE_ENV = "production"
    
    Write-Host "✅ Variables configuradas:" -ForegroundColor Green
    Write-Host "   - NODE_ENV: $($env:NODE_ENV)" -ForegroundColor White
    Write-Host "   - Directorio: $(Get-Location)" -ForegroundColor White
    
    Write-Host "`n🔥 Iniciando servidor... (Ctrl+C para detener)" -ForegroundColor Cyan
    node server.js
}

# Menú principal
function Show-AdminMenu {
    Write-Host "`n📋 Menú de Administración" -ForegroundColor Cyan
    Write-Host "=========================" -ForegroundColor Cyan
    Write-Host "1. Verificar estado del servidor" -ForegroundColor White
    Write-Host "2. Verificar geolocalización" -ForegroundColor White
    Write-Host "3. Obtener estadísticas" -ForegroundColor White
    Write-Host "4. Migrar contraseñas (solo una vez)" -ForegroundColor White
    Write-Host "5. Limpiar cache de geolocalización" -ForegroundColor White
    Write-Host "6. Iniciar servidor en producción" -ForegroundColor White
    Write-Host "0. Salir" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Selecciona una opción"
    
    switch ($choice) {
        "1" { Test-ServerStatus }
        "2" { Test-Geolocation }
        "3" { Get-AdminStats }
        "4" { Start-PasswordMigration }
        "5" { Clear-GeoCache }
        "6" { Start-ProductionServer }
        "0" { 
            Write-Host "`n👋 ¡Hasta luego!" -ForegroundColor Green
            return 
        }
        default { 
            Write-Host "`n❌ Opción no válida" -ForegroundColor Red
            Show-AdminMenu
        }
    }
    
    if ($choice -ne "0" -and $choice -ne "6") {
        Read-Host "`nPresiona Enter para continuar"
        Show-AdminMenu
    }
}

# Ejecutar menú principal
Show-AdminMenu
