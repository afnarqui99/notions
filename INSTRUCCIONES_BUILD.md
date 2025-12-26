# Instrucciones para Generar el Ejecutable de Windows

## Requisitos Previos

1. **Node.js instalado** (solo en tu máquina de desarrollo)
2. **Windows** (para generar el instalador de Windows)

## Pasos para Generar el Ejecutable

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Generar el Ejecutable

```bash
npm run electron:build:win
```

Este comando:
- Compila la aplicación React
- Empaqueta todo con Electron
- Genera un instalador `.exe` en la carpeta `release/`

### 3. Encontrar el Instalador

El instalador se generará en:
```
release/Notion Local Editor Setup 1.0.0.exe
```

## Características del Instalador

✅ **No requiere Node.js** - Todo está empaquetado  
✅ **Instalación simple** - Solo hacer doble clic en el `.exe`  
✅ **Auto-inicio** - Se ejecuta automáticamente al iniciar Windows  
✅ **Acceso directo** - Crea iconos en el escritorio y menú de inicio  
✅ **Desinstalación fácil** - Desde el Panel de Control de Windows  

## Distribuir la Aplicación

1. Comparte el archivo `Notion Local Editor Setup 1.0.0.exe`
2. El usuario solo necesita:
   - Hacer doble clic en el instalador
   - Seguir las instrucciones de instalación
   - La aplicación se abrirá automáticamente
   - Se ejecutará al iniciar Windows

## Notas Importantes

- El instalador es grande (~100-150 MB) porque incluye Node.js y todas las dependencias
- La primera vez que se ejecuta puede tardar unos segundos en iniciar
- La aplicación se ejecuta en segundo plano y se puede minimizar a la bandeja del sistema

## Desarrollo

Para probar la aplicación en modo desarrollo con Electron:

```bash
npm run electron:dev
```

## Solución de Problemas

### Error: "Cannot find module 'electron'"
```bash
npm install electron --save-dev
```

### Error: "Cannot find module 'auto-launch'"
```bash
npm install auto-launch --save
```

### El auto-inicio no funciona
- Verifica que la aplicación tenga permisos de administrador
- Revisa la configuración de inicio de Windows

