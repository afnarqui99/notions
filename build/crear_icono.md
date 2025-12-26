# Crear Icono .ico desde SVG

## Opción 1: Usar herramienta online (Recomendado)

1. Abre el archivo `build/icon.svg` en un navegador
2. Visita https://convertio.co/es/svg-ico/ o https://cloudconvert.com/svg-to-ico
3. Sube el archivo `icon.svg`
4. Descarga el archivo `icon.ico` resultante
5. Colócalo en `build/icon.ico`

## Opción 2: Usar ImageMagick (Línea de comandos)

Si tienes ImageMagick instalado:

```bash
magick convert -background none -resize 256x256 build/icon.svg build/icon.ico
```

## Opción 3: Usar Inkscape (Gratis)

1. Descarga Inkscape: https://inkscape.org/
2. Abre `build/icon.svg` en Inkscape
3. Archivo > Exportar como PNG (256x256)
4. Usa una herramienta online para convertir PNG a ICO

## Opción 4: Usar Python con PIL/Pillow

```python
from PIL import Image
import cairosvg

# Convertir SVG a PNG
cairosvg.svg2png(url='build/icon.svg', write_to='build/icon.png', output_width=256, output_height=256)

# Convertir PNG a ICO
img = Image.open('build/icon.png')
img.save('build/icon.ico', format='ICO', sizes=[(256,256), (128,128), (64,64), (32,32), (16,16)])
```

## Verificar

Una vez creado el `icon.ico`, colócalo en `build/icon.ico` y el instalador de Electron lo usará automáticamente.

