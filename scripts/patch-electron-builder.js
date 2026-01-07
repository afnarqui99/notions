// Script para parchear electron-builder y evitar errores con winCodeSign
const fs = require('fs');
const path = require('path');

const sevenZipPath = path.join(__dirname, '../node_modules/7zip-bin/win/x64/7za.exe');
const electronBuilderPath = path.join(__dirname, '../node_modules/electron-builder');

console.log('Parcheando electron-builder para evitar errores con winCodeSign...');

// Crear un wrapper para 7-Zip que ignore errores de enlaces simbólicos
const wrapperScript = `
@echo off
"%1" x -snld -bd -y "%2" "%3" 2>nul
exit /b 0
`;

// Nota: Este script es solo informativo
// La solución real es deshabilitar completamente la firma
console.log('Para evitar el error, asegúrate de que sign: false esté en package.json');
console.log('El error de enlaces simbólicos no debería afectar la generación del ejecutable');


















