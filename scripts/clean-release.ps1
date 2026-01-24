# Script para limpiar completamente la carpeta release
Write-Host "Limpiando carpeta release..."

# 1. Cerrar todos los procesos relacionados
Write-Host "Cerrando procesos..."
Get-Process | Where-Object {
    $_.ProcessName -like "*electron*" -or 
    $_.ProcessName -like "*Notas*" -or
    $_.Path -like "*release*" -or
    $_.Path -like "*app-builder*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

# 2. Eliminar carpeta release con metodo mas agresivo
Write-Host "Eliminando carpeta release..."
$releasePath = Join-Path $PSScriptRoot "..\release"

if (Test-Path $releasePath) {
    # Intentar eliminar con robocopy (metodo mas agresivo en Windows)
    $emptyDir = Join-Path $env:TEMP "empty_$(Get-Random)"
    New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
    
    try {
        & robocopy $emptyDir $releasePath /MIR /R:0 /W:0 /NFL /NDL /NJH /NJS | Out-Null
        Remove-Item $emptyDir -Force -ErrorAction SilentlyContinue
        Remove-Item $releasePath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Carpeta release eliminada"
    } catch {
        Write-Host "Error al eliminar release: $_"
    }
} else {
    Write-Host "La carpeta release no existe"
}

Write-Host "Limpieza completada"
