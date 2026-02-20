# 🔐 Cómo Convertir Clave OpenSSH a PEM - Guía Paso a Paso

## 📋 Resumen
Esta guía te ayudará a convertir tu clave privada OpenSSH a formato PEM para que funcione con la aplicación SFTP.

---

## 🎯 Paso 1: Guardar tu Clave OpenSSH en un Archivo

### Opción A: Si tienes la clave como texto (pegada)
1. Abre el **Bloc de notas** (Notepad) o cualquier editor de texto
2. Pega tu clave OpenSSH completa (debe incluir `-----BEGIN OPENSSH PRIVATE KEY-----` y `-----END OPENSSH PRIVATE KEY-----`)
3. Guarda el archivo como:
   - **Nombre**: `mi_clave_openssh.txt` (o el nombre que prefieras)
   - **Ubicación**: `C:\Users\TuUsuario\.ssh\` (crea la carpeta `.ssh` si no existe)
   - **Extensión**: Puede ser `.txt`, `.key`, o **SIN extensión** (ssh-keygen lee el contenido, no importa la extensión)
   - **Tipo**: "Todos los archivos" o "Documento de texto" (ambos funcionan)
   
   **✅ IMPORTANTE**: ssh-keygen puede leer archivos `.txt` sin problema. Lo importante es el contenido, no la extensión.

### Opción B: Si ya tienes la clave en un archivo
- Copia la ruta completa del archivo (ejemplo: `C:\Users\TuUsuario\.ssh\id_ed25519`)

---

## 🎯 Paso 2: Verificar que Tienes ssh-keygen

### En PowerShell o CMD, ejecuta:
```powershell
ssh-keygen -V
```

**Si funciona:**
- Verás la versión de ssh-keygen
- Puedes continuar al Paso 3

**Si NO funciona:**
- Necesitas instalar Git para Windows: https://git-scm.com/download/win
- O instalar OpenSSH desde Windows (Configuración > Aplicaciones > Características opcionales)

---

## 🎯 Paso 3: Convertir la Clave a PEM

### Abre PowerShell o CMD y ejecuta:

```powershell
# Reemplaza "ruta_a_tu_clave" con la ruta completa de tu archivo
ssh-keygen -p -N "" -m pem -f "C:\Users\TuUsuario\.ssh\mi_clave_openssh"
```

**Ejemplo real (con archivo .txt):**
```powershell
ssh-keygen -p -N "" -m pem -f "C:\Users\Juan\.ssh\mi_clave_openssh.txt"
```

**Nota**: Si tu archivo tiene extensión `.txt`, inclúyela en la ruta. ssh-keygen funciona con cualquier extensión.

### ¿Qué hace este comando?
- `-p`: Cambia la frase de contraseña (o formato en este caso)
- `-N ""`: Sin nueva frase de contraseña (vacía)
- `-m pem`: Convierte al formato PEM
- `-f`: Ruta al archivo de clave

### Resultado:
- El mismo archivo se convertirá a formato PEM
- Verás un mensaje: "Your identification has been saved with the new passphrase."

---

## 🎯 Paso 4: Verificar la Conversión

### Abre el archivo convertido y verifica:
- **ANTES (OpenSSH):** `-----BEGIN OPENSSH PRIVATE KEY-----`
- **DESPUÉS (PEM):** `-----BEGIN RSA PRIVATE KEY-----` o `-----BEGIN PRIVATE KEY-----`

---

## 🎯 Paso 5: Usar la Clave Convertida en la Aplicación

### Opción A: Pegar el Contenido
1. Abre el archivo PEM convertido con el Bloc de notas
2. Copia **TODO** el contenido (incluyendo `-----BEGIN` y `-----END`)
3. En la aplicación SFTP, pega el contenido completo en el campo "Clave privada SSH"

### Opción B: Usar la Ruta del Archivo
1. En la aplicación SFTP, en el campo "Clave privada SSH"
2. Pega la ruta completa del archivo convertido:
   ```
   C:\Users\TuUsuario\.ssh\mi_clave_openssh
   ```

---

## 📝 Ejemplo Completo

### 1. Guardar clave OpenSSH:
```
Archivo: C:\Users\Juan\.ssh\mi_clave_openssh.txt
Contenido:
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
... (resto de la clave)
-----END OPENSSH PRIVATE KEY-----
```

### 2. Convertir (con extensión .txt):
```powershell
ssh-keygen -p -N "" -m pem -f "C:\Users\Juan\.ssh\mi_clave_openssh.txt"
```

**✅ Nota**: Si tu archivo es `.txt`, incluye la extensión en el comando. ssh-keygen funciona perfectamente con archivos `.txt`.

### 3. Resultado (mismo archivo, ahora en PEM):
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
... (clave en formato PEM)
-----END RSA PRIVATE KEY-----
```

El archivo `mi_clave_openssh.txt` ahora contiene la clave en formato PEM.

### 4. Usar en la aplicación:
- Copia todo el contenido del archivo convertido
- Pégalo en el campo "Clave privada SSH" de la aplicación

---

## ⚠️ Notas Importantes

1. **El archivo original se sobrescribe**: El comando `ssh-keygen -p` modifica el archivo original. Si quieres conservar el original, haz una copia primero.

2. **Permisos**: En Windows no es crítico, pero en Linux/Mac el archivo debe tener permisos 600.

3. **Frase de contraseña**: Si tu clave tiene frase de contraseña, el comando te la pedirá. Si no tiene, usa `-N ""`.

4. **Ubicación recomendada**: Guarda las claves en `C:\Users\TuUsuario\.ssh\` para mantenerlas organizadas.

---

## 🔍 Verificar que Funcionó

Después de convertir y usar la clave en la aplicación:
- Deberías poder conectarte sin el error de "formato no compatible"
- La conexión SFTP debería establecerse correctamente

---

## 🆘 Si Algo Sale Mal

### Error: "ssh-keygen no se reconoce"
- Instala Git para Windows: https://git-scm.com/download/win
- O instala OpenSSH desde Windows

### Error: "Permission denied"
- En Windows, esto es raro. Asegúrate de tener permisos de escritura en el archivo.

### Error: "Invalid key format"
- Verifica que el archivo contenga la clave completa (con BEGIN y END)
- Asegúrate de no tener espacios extra o caracteres raros

---

## ✅ Checklist Final

- [ ] Clave OpenSSH guardada en un archivo
- [ ] ssh-keygen instalado y funcionando
- [ ] Clave convertida a PEM exitosamente
- [ ] Archivo convertido verificado (tiene BEGIN RSA PRIVATE KEY o BEGIN PRIVATE KEY)
- [ ] Clave PEM usada en la aplicación SFTP
- [ ] Conexión exitosa

---

¡Listo! Con estos pasos deberías poder convertir tu clave y usarla en la aplicación. 🎉

