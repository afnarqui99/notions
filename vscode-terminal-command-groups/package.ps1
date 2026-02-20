# Script para empaquetar la extensión VS Code
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "=== Empaquetando extensión VS Code ===" -ForegroundColor Cyan
Write-Host ""

# Compilar TypeScript
Write-Host "1. Compilando TypeScript..." -ForegroundColor Yellow
npm run compile
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en la compilación" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Compilación exitosa" -ForegroundColor Green
Write-Host ""

# Empaquetar
Write-Host "2. Empaquetando extensión..." -ForegroundColor Yellow
npx @vscode/vsce package --allow-missing-repository
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al empaquetar" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Verificar archivo creado
Write-Host "3. Verificando archivo creado..." -ForegroundColor Yellow
$vsixFile = Get-ChildItem -Filter "terminal-command-groups-0.1.5.vsix" -ErrorAction SilentlyContinue
if ($vsixFile) {
    Write-Host "✓ Archivo creado exitosamente:" -ForegroundColor Green
    Write-Host "  Nombre: $($vsixFile.Name)" -ForegroundColor White
    Write-Host "  Tamaño: $([math]::Round($vsixFile.Length/1KB, 2)) KB" -ForegroundColor White
    Write-Host "  Ubicación: $($vsixFile.FullName)" -ForegroundColor White
    Write-Host ""
    Write-Host "=== ¡Listo para subir a VS Code Marketplace! ===" -ForegroundColor Green
} else {
    Write-Host "✗ Archivo no encontrado" -ForegroundColor Red
    exit 1
}

