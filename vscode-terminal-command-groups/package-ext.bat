@echo off
cd /d "%~dp0"
echo Compilando TypeScript...
call npm run compile
if %ERRORLEVEL% NEQ 0 (
    echo Error en la compilacion
    exit /b 1
)
echo Empaquetando extension...
call npx @vscode/vsce package --allow-missing-repository
if %ERRORLEVEL% EQU 0 (
    echo Extension empaquetada correctamente
    dir *.vsix | findstr "0.1.5"
) else (
    echo Error al empaquetar
    exit /b 1
)

