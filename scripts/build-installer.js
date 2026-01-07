// Script para generar el instalador sin usar winCodeSign
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Generando instalador sin firma de código...');

// Crear un directorio temporal para el instalador
const tempDir = path.join(__dirname, '../release/temp-installer');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Copiar el ejecutable empaquetado
const exePath = path.join(__dirname, '../release/win-unpacked/Notion Local Editor.exe');
const targetExe = path.join(tempDir, 'Notion Local Editor.exe');

if (fs.existsSync(exePath)) {
  console.log('✅ Ejecutable encontrado, copiando...');
  fs.copyFileSync(exePath, targetExe);
  console.log('✅ Ejecutable copiado');
} else {
  console.error('❌ Ejecutable no encontrado en:', exePath);
  process.exit(1);
}

console.log('\n📦 El ejecutable está listo en:');
console.log('   release/win-unpacked/Notion Local Editor.exe');
console.log('\n💡 Para crear un instalador, puedes:');
console.log('   1. Usar Inno Setup (gratis): https://jrsoftware.org/isinfo.php');
console.log('   2. Usar NSIS (gratis): https://nsis.sourceforge.io/');
console.log('   3. Comprimir la carpeta win-unpacked en un ZIP');
console.log('   4. El ejecutable funciona directamente sin instalador');



















