# Guía de Columnas y Fórmulas para Gestión de Tareas

## 📋 Columnas Base para Controlar el Estado y Progreso

### Columnas Principales (Editable por el usuario)

1. **Progress** (Número)
   - **Qué es**: Progreso actual de la tarea (0-100 o cualquier número)
   - **Cómo usarla**: Ingresa el valor numérico del progreso actual
   - **Ejemplo**: Si una tarea está al 75% completa, ingresa `75`

2. **Objective** (Número)
   - **Qué es**: Meta u objetivo total de la tarea
   - **Cómo usarla**: Ingresa el valor objetivo (normalmente 100)
   - **Ejemplo**: Si quieres que la tarea se complete al 100%, ingresa `100`

3. **Type** (Tags)
   - **Qué es**: Estado de la tarea
   - **Opciones disponibles**:
     - `TO DO` (Gris) - Tarea pendiente
     - `IN PROGRESS` (Azul) - Tarea en progreso
     - `DONE` (Verde) - Tarea completada
     - `STOPPED` (Rojo) - Tarea detenida
     - `REOPENED` (Naranja) - Tarea reabierta
     - `UNDER REVIEW` (Morado) - Tarea en revisión
     - `QA` (Cyan) - Tarea en QA
   - **Cómo usarla**: Haz clic en la columna Type y selecciona el estado correspondiente

4. **Time Spent** (Número)
   - **Qué es**: Tiempo gastado en horas
   - **Cómo usarla**: Ingresa las horas trabajadas
   - **Ejemplo**: Si trabajaste 8 horas, ingresa `8`

5. **Time Estimated** (Número)
   - **Qué es**: Tiempo estimado en horas
   - **Cómo usarla**: Ingresa las horas estimadas para completar la tarea
   - **Ejemplo**: Si estimas 16 horas, ingresa `16`

6. **Priority** (Tags)
   - **Qué es**: Prioridad de la tarea
   - **Opciones disponibles**:
     - `Critical` (Rojo) - Prioridad crítica
     - `Medium` (Amarillo) - Prioridad media
     - `Low` (Verde) - Prioridad baja
   - **Cómo usarla**: Haz clic en la columna Priority y selecciona la prioridad

## 🧮 Fórmulas Calculadas (Automáticas)

### 1. **Percent** (Fórmula)
   - **Qué calcula**: Porcentaje de progreso basado en Progress/Objective
   - **Fórmula**: `if(((prop("Progress") / prop("Objective")) >= 1), "✅", if(and(empty(prop("Progress")), !empty(prop("Objective"))), "0%", substring("➖➖➖➖", 0, floor((prop("Progress") / prop("Objective")) * 10)) + " " + format(round((prop("Progress") / prop("Objective")) * 100)) + "%"))`
   - **Qué muestra**:
     - Si Progress >= Objective: `✅` (completado)
     - Si Progress = 0 y hay Objective: `0%`
     - Si hay progreso: `➖➖ 75%` (barras visuales + porcentaje)
   - **Ejemplo**: Si Progress=75 y Objective=100, muestra `➖➖➖ 75%`

### 2. **Percent Total** (Fórmula)
   - **Qué calcula**: Porcentaje de tiempo usado vs tiempo estimado
   - **Fórmula**: `if((prop("Time Estimated") > 0), format(round((prop("Time Spent") * 100) / prop("Time Estimated"))) + "%", "0%")`
   - **Qué muestra**: Porcentaje de tiempo gastado
   - **Ejemplo**: Si Time Spent=12 y Time Estimated=16, muestra `75%`

### 3. **missing percentage** (Fórmula)
   - **Qué calcula**: Porcentaje faltante (solo si la tarea NO está DONE)
   - **Fórmula**: `if((prop("Type") == "DONE"), 0, if((prop("Time Estimated") > 0), format(round((prop("Time Spent") * 100) / prop("Time Estimated"))) + "%", "0%"))`
   - **Qué muestra**: 
     - Si Type = "DONE": `0`
     - Si Type != "DONE": Porcentaje de tiempo usado
   - **Ejemplo**: Si Type="IN PROGRESS", Time Spent=8, Time Estimated=16, muestra `50%`

## 🔄 Cómo Cambiar el Estado de una Tarea

### Para ver el progreso:

1. **Actualiza Progress**: 
   - Edita la columna "Progress" con el valor actual (ej: 50, 75, 100)
   - La columna "Percent" se actualizará automáticamente mostrando el porcentaje

2. **Actualiza Type**:
   - Haz clic en la columna "Type"
   - Selecciona el estado correspondiente:
     - `TO DO` → Tarea pendiente
     - `IN PROGRESS` → Tarea en progreso
     - `DONE` → Tarea completada
     - `QA` → Tarea en pruebas
     - `UNDER REVIEW` → Tarea en revisión

3. **Actualiza Time Spent**:
   - Edita la columna "Time Spent" con las horas trabajadas
   - La columna "Percent Total" se actualizará automáticamente

### Flujo de trabajo típico:

```
1. Crear tarea → Type: "TO DO", Progress: 0
2. Empezar trabajo → Type: "IN PROGRESS", Progress: 25
3. Avanzar → Type: "IN PROGRESS", Progress: 50, Time Spent: 8
4. Casi terminado → Type: "IN PROGRESS", Progress: 90, Time Spent: 14
5. Completar → Type: "DONE", Progress: 100, Time Spent: 16
```

## 📊 Columnas Adicionales (Opcionales)

- **Start Date**: Fecha de inicio
- **End Date**: Fecha de fin
- **Created**: Fecha de creación
- **Tasks Completed**: Número de subtareas completadas
- **Total Tasks**: Número total de subtareas
- **Assign**: Personas asignadas (tags)
- **Tags**: Etiquetas adicionales (tags)

## 💡 Consejos

1. **Siempre establece Objective**: Para que las fórmulas funcionen correctamente, asegúrate de tener un valor en "Objective" (normalmente 100)

2. **Actualiza Type según el estado real**: La columna Type es la más importante para el seguimiento visual

3. **Time Spent y Time Estimated**: Úsalos para tracking de tiempo. La fórmula "Percent Total" te mostrará si estás dentro del tiempo estimado

4. **Priority**: Úsala para filtrar y ordenar tareas importantes

5. **Las fórmulas se calculan automáticamente**: No necesitas editarlas manualmente, solo actualiza las columnas base (Progress, Objective, Time Spent, Time Estimated, Type)

