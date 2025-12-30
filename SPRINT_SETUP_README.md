# 📋 Guía Completa: Configurar un Sprint con 5 Tareas

Esta guía te ayudará a crear un sprint completo desde cero con 5 tareas de ejemplo, utilizando todas las fórmulas disponibles en el sistema.

## 🎯 Objetivo

Crear un sprint de ejemplo que demuestre todas las capacidades del sistema, incluyendo:
- Cálculos de progreso
- Gestión de tiempo
- Análisis de días hábiles
- Seguimiento de subtareas
- Indicadores de sobrecarga

---

## 📝 Paso 1: Crear una Tabla Nueva

1. Crea una nueva tabla usando el comando `/tabla` o `/table`
2. Verás una tabla vacía con la columna "Nombre"

---

## 🏗️ Paso 2: Agregar Columnas Esenciales

Haz clic en el menú de configuración (⋯) en la esquina superior derecha y selecciona:
- **"📋 Columnas Sugeridas para Metodologías Ágiles"**

O agrega manualmente las siguientes columnas usando el botón "➕ Agregar propiedad" en el drawer:

### Columnas Principales (VISIBLES)

| Nombre | Tipo | Descripción | Visible |
|--------|------|-------------|---------|
| **Priority** | tags | Prioridad (Critical, Medium, Low) | ✅ Sí |
| **Type** | tags | Estado (TO DO, IN PROGRESS, DONE, etc.) | ✅ Sí |
| **Percent** | formula | Progreso visual con barras | ✅ Sí |
| **Progress** | number | Progreso actual (0-100) | ✅ Sí |
| **Time Spent** | number | Tiempo gastado (horas) | ✅ Sí |
| **Time Estimated** | number | Tiempo estimado (horas) | ✅ Sí |
| **Percent Total** | formula | % tiempo usado vs estimado | ✅ Sí |
| **Estado** | select | Estado de la tarea | ✅ Sí |
| **Start Date** | date | Fecha de inicio | ✅ Sí |
| **End Date** | date | Fecha de fin | ✅ Sí |

### Columnas de Soporte (OCULTAS inicialmente)

| Nombre | Tipo | Descripción | Visible |
|--------|------|-------------|---------|
| **Objective** | number | Meta total (normalmente 100) | ❌ No |
| **Current Date** | date | Fecha actual (se actualiza) | ❌ No |
| **Days Worked** | number | Días trabajados | ❌ No |
| **Days Elapsed** | number | Días transcurridos | ❌ No |
| **Tasks Completed** | number | Subtareas completadas | ❌ No |
| **Total Tasks** | number | Total de subtareas | ❌ No |

### Columnas con Fórmulas Adicionales (OCULTAS)

| Nombre | Tipo | Fórmula | Descripción |
|--------|------|---------|-------------|
| **Progreso** | formula | `if(((prop("Progress") / prop("Objective")) >= 1), "✅", (if(and(empty(prop("Progress")), !empty(prop("Objective"))), "0%", format(round((prop("Progress") / prop("Objective")) * 100)) + "%")))` | Progreso alternativo |
| **Tiempo Restante** | formula | `if((prop("Time Spent") >= prop("Time Estimated")), "0", prop("Time Estimated") - prop("Time Spent"))` | Horas restantes |
| **Porcentaje Tiempo** | formula | `if((prop("Time Estimated") > 0), format(round((prop("Time Spent") / prop("Time Estimated")) * 100)) + "%", "0%")` | % tiempo usado |
| **Tasa Completitud** | formula | `if((prop("Total Tasks") > 0), format(round((prop("Tasks Completed") / prop("Total Tasks")) * 100)) + "%", "0%")` | % subtareas completadas |
| **Dias Transcurridos Sprint** | formula | `if(and(!empty(prop("Start Date")), !empty(prop("Current Date"))), if((date(prop("Current Date")) >= date(prop("Start Date"))), floor((date(prop("Current Date")) - date(prop("Start Date"))) / 86400000) + 1, 0), 0)` | Días desde inicio |
| **Dias Faltantes Sprint** | formula | `if(and(!empty(prop("End Date")), !empty(prop("Current Date"))), if((date(prop("Current Date")) <= date(prop("End Date"))), floor((date(prop("End Date")) - date(prop("Current Date"))) / 86400000), 0), 0)` | Días faltantes |
| **Horas Disponibles** | formula | `prop("Dias Habiles Transcurridos") * prop("Horas Diarias")` | Horas disponibles |
| **Sobrecarga** | formula | `if((prop("Time Estimated") > prop("Horas Disponibles")), "⚠️ Sobrecarga", "✅ OK")` | Indicador de sobrecarga |

---

## 📊 Paso 3: Datos de las 5 Tareas de Ejemplo

Agrega 5 filas con los siguientes datos:

### Tarea 1: Diseño de UI/UX

```
Nombre: Diseño de UI/UX
Priority: Medium (tag amarillo)
Type: IN PROGRESS (tag azul)
Progress: 80
Objective: 100
Time Spent: 12
Time Estimated: 16
Days Worked: 2
Start Date: 2025-01-15
End Date: 2025-01-20
Estado: En progreso
Tasks Completed: 4
Total Tasks: 5
Current Date: 2025-01-17 (usa la fecha actual de tu sistema)
```

### Tarea 2: Implementación API Backend

```
Nombre: Implementación API Backend
Priority: Critical (tag rojo)
Type: IN PROGRESS (tag azul)
Progress: 60
Objective: 100
Time Spent: 20
Time Estimated: 32
Days Worked: 3
Start Date: 2025-01-15
End Date: 2025-01-25
Estado: En progreso
Tasks Completed: 6
Total Tasks: 10
Current Date: 2025-01-17
```

### Tarea 3: Integración Base de Datos

```
Nombre: Integración Base de Datos
Priority: Medium (tag amarillo)
Type: IN PROGRESS (tag azul)
Progress: 40
Objective: 100
Time Spent: 8
Time Estimated: 24
Days Worked: 1
Start Date: 2025-01-16
End Date: 2025-01-24
Estado: En progreso
Tasks Completed: 2
Total Tasks: 5
Current Date: 2025-01-17
```

### Tarea 4: Pruebas Unitarias

```
Nombre: Pruebas Unitarias
Priority: Medium (tag amarillo)
Type: QA (tag cyan)
Progress: 30
Objective: 100
Time Spent: 6
Time Estimated: 20
Days Worked: 1
Start Date: 2025-01-17
End Date: 2025-01-26
Estado: Pendiente
Tasks Completed: 3
Total Tasks: 10
Current Date: 2025-01-17
```

### Tarea 5: Documentación Técnica

```
Nombre: Documentación Técnica
Priority: Low (tag verde)
Type: UNDER REVIEW (tag morado)
Progress: 50
Objective: 100
Time Spent: 4
Time Estimated: 8
Days Worked: 1
Start Date: 2025-01-18
End Date: 2025-01-27
Estado: Pendiente
Tasks Completed: 2
Total Tasks: 4
Current Date: 2025-01-17
```

---

## 🎨 Paso 4: Configurar Visibilidad de Columnas

Después de agregar los datos, configura qué columnas quieres ver:

1. Haz clic en el menú **⋯** → **"👁️ Propiedades visibles"**
2. **Marca como VISIBLES** las siguientes columnas esenciales:

### Columnas Recomendadas para Visualizar

#### Vista Principal del Sprint:
- ✅ **Nombre** (siempre visible)
- ✅ **Priority** - Ver prioridades de tareas
- ✅ **Type** - Ver estados de trabajo
- ✅ **Percent** - Ver progreso visual con barras
- ✅ **Progress** - Ver progreso numérico
- ✅ **Estado** - Ver estado general
- ✅ **Time Spent** / **Time Estimated** - Ver tiempos
- ✅ **Percent Total** - Ver % tiempo usado

#### Columnas Opcionales (útil para análisis detallado):
- **Start Date** / **End Date** - Ver fechas
- **Tiempo Restante** - Ver horas restantes
- **Tasa Completitud** - Ver % de subtareas
- **Dias Transcurridos Sprint** - Ver días desde inicio
- **Dias Faltantes Sprint** - Ver días restantes

#### Columnas Ocultas (usadas solo por fórmulas):
- **Objective** - Necesario para cálculos
- **Current Date** - Se actualiza automáticamente
- **Days Worked** - Datos de entrada
- **Tasks Completed** / **Total Tasks** - Datos de entrada

---

## 📐 Paso 5: Fórmulas Explicadas

### Fórmulas de Progreso

#### Percent (Progreso Visual)
```
if(((prop("Progress") / prop("Objective")) >= 1), "✅", 
   if(and(empty(prop("Progress")), !empty(prop("Objective"))), "0%", 
      substring("➖➖➖➖", 0, floor((prop("Progress") / prop("Objective")) * 10)) + " " + 
      format(round((prop("Progress") / prop("Objective")) * 100)) + "%"))
```
**Qué hace:** Muestra barras visuales (➖) y porcentaje. Si está completo, muestra ✅.

**Ejemplo:** Si Progress=80 y Objective=100 → Muestra "➖➖➖➖➖➖➖➖ 80%"

#### Progreso (Alternativa)
```
if(((prop("Progress") / prop("Objective")) >= 1), "✅", 
   (if(and(empty(prop("Progress")), !empty(prop("Objective"))), "0%", 
       format(round((prop("Progress") / prop("Objective")) * 100)) + "%")))
```
**Qué hace:** Versión simplificada que solo muestra porcentaje o ✅.

---

### Fórmulas de Tiempo

#### Percent Total (% Tiempo Usado)
```
if((prop("Time Estimated") > 0), 
   format(round((prop("Time Spent") * 100) / prop("Time Estimated"))) + "%", 
   "0%")
```
**Qué hace:** Calcula qué porcentaje del tiempo estimado se ha usado.

**Ejemplo:** Time Spent=12, Time Estimated=16 → "75%"

#### Tiempo Restante
```
if((prop("Time Spent") >= prop("Time Estimated")), "0", 
   prop("Time Estimated") - prop("Time Spent"))
```
**Qué hace:** Calcula horas restantes. Si ya se gastó más, muestra 0.

**Ejemplo:** Time Spent=12, Time Estimated=16 → 4 horas restantes

#### Porcentaje Tiempo
```
if((prop("Time Estimated") > 0), 
   format(round((prop("Time Spent") / prop("Time Estimated")) * 100)) + "%", 
   "0%")
```
**Qué hace:** Similar a Percent Total, pero con formato diferente.

---

### Fórmulas de Subtareas

#### Tasa Completitud
```
if((prop("Total Tasks") > 0), 
   format(round((prop("Tasks Completed") / prop("Total Tasks")) * 100)) + "%", 
   "0%")
```
**Qué hace:** Calcula el porcentaje de subtareas completadas.

**Ejemplo:** Tasks Completed=4, Total Tasks=5 → "80%"

---

### Fórmulas de Fechas del Sprint

#### Dias Transcurridos Sprint
```
if(and(!empty(prop("Start Date")), !empty(prop("Current Date"))), 
   if((date(prop("Current Date")) >= date(prop("Start Date"))), 
      floor((date(prop("Current Date")) - date(prop("Start Date"))) / 86400000) + 1, 
      0), 
   0)
```
**Qué hace:** Calcula cuántos días han pasado desde el inicio del sprint.

**Ejemplo:** Start Date=2025-01-15, Current Date=2025-01-17 → 3 días

#### Dias Faltantes Sprint
```
if(and(!empty(prop("End Date")), !empty(prop("Current Date"))), 
   if((date(prop("Current Date")) <= date(prop("End Date"))), 
      floor((date(prop("End Date")) - date(prop("Current Date"))) / 86400000), 
      0), 
   0)
```
**Qué hace:** Calcula cuántos días quedan hasta el fin del sprint.

**Ejemplo:** End Date=2025-01-25, Current Date=2025-01-17 → 8 días

---

### Fórmulas de Análisis

#### Horas Disponibles
```
prop("Dias Habiles Transcurridos") * prop("Horas Diarias")
```
**Qué hace:** Calcula horas disponibles multiplicando días hábiles por horas diarias.

**Ejemplo:** Dias Habiles Transcurridos=3, Horas Diarias=8 → 24 horas

#### Sobrecarga
```
if((prop("Time Estimated") > prop("Horas Disponibles")), 
   "⚠️ Sobrecarga", 
   "✅ OK")
```
**Qué hace:** Indica si la tarea está sobrecargada comparando tiempo estimado vs horas disponibles.

**Ejemplo:** Time Estimated=32, Horas Disponibles=24 → "⚠️ Sobrecarga"

---

## 🎯 Resultado Esperado

Después de completar estos pasos, tendrás:

1. ✅ **5 tareas** con datos completos
2. ✅ **Fórmulas calculando** automáticamente:
   - Progreso visual con barras
   - Porcentajes de tiempo usado
   - Días transcurridos/faltantes
   - Tasas de completitud
   - Indicadores de sobrecarga
3. ✅ **Vista optimizada** mostrando las columnas más importantes
4. ✅ **Análisis completo** del sprint en un vistazo

---

## 💡 Tips Adicionales

### Para Usar la Vista Timeline:
1. Cambia la vista a **"Timeline"** usando los botones en la parte superior
2. Necesitas que las tareas tengan **Start Date** y **End Date** configuradas
3. La timeline mostrará las tareas como barras horizontales

### Para Ver Estadísticas del Sprint:
1. Haz clic en **⋯** → **"📊 Estadísticas del Sprint"**
2. Verás un resumen completo con:
   - Total de tareas
   - Tareas completadas/en progreso/pendientes
   - Porcentajes de cumplimiento
   - Tiempo gastado vs estimado

### Para Ordenar Columnas:
1. Haz clic en el encabezado de cualquier columna
2. Se ordenará automáticamente (ascendente/descendente)
3. El icono ↑ o ↓ indica el orden actual

---

## 🔧 Troubleshooting

### Las fórmulas no se calculan:
- Verifica que los campos base (Progress, Objective, Time Spent, etc.) tengan valores
- Asegúrate de que Objective tenga valor (normalmente 100)
- Revisa que las fechas estén en formato correcto (YYYY-MM-DD)

### Los porcentajes muestran "0%" o "Error":
- Verifica que el divisor no sea 0 (ej: Objective > 0, Time Estimated > 0)
- Asegúrate de que los valores numéricos sean números válidos

### Las fechas no se calculan correctamente:
- Usa formato de fecha: YYYY-MM-DD (ej: 2025-01-17)
- Verifica que Current Date tenga un valor válido

---

¡Listo! Ahora tienes un sprint completo configurado con todas las fórmulas funcionando. 🎉

