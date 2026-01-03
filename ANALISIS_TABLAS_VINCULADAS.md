# Análisis: Sistema de Tablas Vinculadas y Fórmulas Cruzadas

## Objetivo
Permitir crear múltiples tablas con diferentes plantillas (Ingresos, Egresos, Gastos, Costos, Deudas) y vincularlas entre sí para crear fórmulas y gráficas que combinen datos de múltiples tablas.

## Ejemplos de Uso Deseados
1. **Pago de Deuda**: Si pago una deuda desde la tabla "Deudas", debería reflejarse como egreso en la tabla "Egresos"
2. **Balance Total**: Fórmula que calcule `Ingresos - Egresos - Gastos = Balance Disponible`
3. **Gráficas Combinadas**: Visualizar ingresos vs egresos en una sola gráfica
4. **Vínculos Automáticos**: Al crear un registro en una tabla, automáticamente afectar otras tablas relacionadas

## Viabilidad Técnica

### ✅ FACTIBLE pero requiere cambios significativos

### Aspectos Positivos:
1. **Estructura Actual**: Las tablas ya tienen:
   - Identificación única (nodo en el editor)
   - Sistema de comportamientos/plantillas
   - Fórmulas funcionales (`FormulaEvaluator`)
   - Sistema de persistencia (LocalStorageService)

2. **Extensibilidad**: La arquitectura permite agregar:
   - Nuevos atributos a los nodos de tabla
   - Nuevas funciones al `FormulaEvaluator`
   - Nuevos sistemas de visualización

### Desafíos Técnicos:

#### 1. Identificación de Tablas
**Problema**: Actualmente las tablas no tienen un ID único persistente
**Solución**: Agregar atributo `tableId` (UUID) al nodo `TablaNotionNode`

#### 2. Registro Global de Tablas
**Problema**: No hay forma de saber qué tablas existen y sus tipos
**Solución**: 
- Crear un registro en `localStorage` o en un archivo JSON separado
- Mapeo: `{ tableId: { tipo: 'ingresos', nombre: 'Ingresos 2024', paginaId: '...' } }`
- Actualizar este registro cuando se crea/elimina/modifica una tabla

#### 3. Referencias Cruzadas
**Problema**: Las fórmulas solo acceden a datos de la tabla actual
**Solución**: Extender `FormulaEvaluator` con funciones como:
- `tabla("ingresos", "Monto")` - Suma de columna "Monto" de tabla "ingresos"
- `tablaFiltrada("egresos", "Categoria", "Deuda", "Monto")` - Suma filtrada
- `tablaCount("gastos", "Estado", "Pagado")` - Contar filas

#### 4. Sincronización de Datos
**Problema**: Si una tabla referencia otra, los datos deben actualizarse cuando cambian
**Solución**:
- Sistema de eventos/subscripciones
- Re-evaluar fórmulas cuando se detecta cambio en tabla relacionada
- Usar `useEffect` para escuchar cambios en tablas relacionadas

#### 5. UI para Vincular Tablas
**Problema**: Necesitamos una interfaz para vincular tablas
**Solución**:
- Modal "Vincular Tablas" en el menú de 3 puntos
- Selector de tablas disponibles (por tipo/comportamiento)
- Configuración de relaciones (unidireccional/bidireccional)

#### 6. Gráficas Combinadas
**Problema**: Las gráficas actuales solo muestran datos de una tabla
**Solución**:
- Crear componente `GraficaCombinada`
- Permitir seleccionar múltiples tablas y columnas
- Librerías como Chart.js o Recharts para visualización

## Viabilidad de Usabilidad

### ✅ USABLE con diseño cuidadoso

### Ventajas:
1. **Familiar**: Similar a Notion, Excel, Google Sheets
2. **Potente**: Permite análisis financiero avanzado
3. **Flexible**: El usuario decide qué vincular

### Consideraciones de UX:
1. **Curva de Aprendizaje**: Requiere explicación/guía
2. **Complejidad Visual**: Necesita diseño claro para no abrumar
3. **Feedback Visual**: Indicadores claros de tablas vinculadas
4. **Validación**: Prevenir referencias circulares o inválidas

## Arquitectura Propuesta

### 1. Estructura de Datos

```javascript
// En TablaNotionNode
{
  tableId: "uuid-unico",
  comportamiento: "ingresos",
  nombreTabla: "Ingresos 2024", // Opcional, para referencia
  tablasVinculadas: [
    {
      tableId: "uuid-egresos",
      relacion: "balance", // balance, transferencia, etc.
      columnas: {
        origen: "Monto",
        destino: "Monto"
      }
    }
  ]
}
```

### 2. Registro Global de Tablas

```javascript
// En localStorage o archivo JSON separado
{
  "tables-registry": {
    "uuid-ingresos": {
      tableId: "uuid-ingresos",
      tipo: "ingresos",
      nombre: "Ingresos 2024",
      paginaId: "pagina-123",
      columnas: ["Concepto", "Monto", "Fecha"],
      createdAt: "2024-01-01",
      updatedAt: "2024-01-15"
    },
    "uuid-egresos": {
      tableId: "uuid-egresos",
      tipo: "egresos",
      nombre: "Egresos 2024",
      paginaId: "pagina-124",
      columnas: ["Concepto", "Monto", "Fecha", "Categoria"],
      createdAt: "2024-01-01",
      updatedAt: "2024-01-15"
    }
  }
}
```

### 3. Funciones de Fórmula Extendidas

```javascript
// En FormulaEvaluator
tabla(tableId, columna) // Suma de columna en tabla
tablaFiltrada(tableId, columnaFiltro, valor, columnaSuma) // Suma filtrada
tablaCount(tableId, columnaFiltro?, valor?) // Contar filas
tablaPromedio(tableId, columna) // Promedio de columna
```

### 4. Sistema de Eventos

```javascript
// Cuando se actualiza una tabla
window.dispatchEvent(new CustomEvent('tablaActualizada', {
  detail: { tableId, cambios }
}));

// Las tablas vinculadas escuchan
useEffect(() => {
  const handler = (e) => {
    if (tablasVinculadas.includes(e.detail.tableId)) {
      recalcularFormulas();
    }
  };
  window.addEventListener('tablaActualizada', handler);
  return () => window.removeEventListener('tablaActualizada', handler);
}, [tablasVinculadas]);
```

## Plan de Implementación (Fases)

### Fase 1: Fundamentos (2-3 días)
1. ✅ Agregar `tableId` UUID a cada tabla
2. ✅ Crear registro global de tablas
3. ✅ Guardar/cargar registro desde localStorage
4. ✅ Actualizar registro al crear/eliminar tablas

### Fase 2: Referencias Básicas (3-4 días)
1. ✅ Modal "Vincular Tablas"
2. ✅ Selección de tablas disponibles
3. ✅ Guardar vínculos en atributo `tablasVinculadas`
4. ✅ Mostrar indicador visual de tablas vinculadas

### Fase 3: Fórmulas Cruzadas (4-5 días)
1. ✅ Extender `FormulaEvaluator` con funciones `tabla()`
2. ✅ Cargar datos de otras tablas desde el registro
3. ✅ Evaluar fórmulas con referencias cruzadas
4. ✅ Cachear resultados para performance

### Fase 4: Sincronización (2-3 días)
1. ✅ Sistema de eventos para cambios en tablas
2. ✅ Re-evaluación automática de fórmulas vinculadas
3. ✅ Optimización para evitar loops infinitos

### Fase 5: Gráficas Combinadas (3-4 días)
1. ✅ Componente de gráficas combinadas
2. ✅ Selector de tablas/columnas para gráfica
3. ✅ Tipos de gráficas (línea, barra, área)
4. ✅ Actualización en tiempo real

### Fase 6: Refinamiento (2-3 días)
1. ✅ Validación de referencias
2. ✅ Manejo de errores
3. ✅ Documentación/guías
4. ✅ Testing

**Total Estimado: 16-22 días de desarrollo**

## Alternativas Más Simples

### Opción A: Tabla Maestra (MÁS SIMPLE)
- Una sola tabla con todas las transacciones
- Columna "Tipo" (Ingreso/Egreso/Gasto/Deuda)
- Fórmulas y gráficas filtradas por tipo
- **Pros**: Más simple, menos complejidad
- **Contras**: Menos flexible, puede ser confuso con muchos registros

### Opción B: Página de Dashboard (INTERMEDIO)
- Cada tabla en su propia página
- Página especial "Dashboard Financiero" con fórmulas/gráficas
- Fórmulas manuales que referencian páginas específicas
- **Pros**: Separación clara, fácil de entender
- **Contras**: Menos automático, requiere configuración manual

### Opción C: Sistema Completo (PROPUESTO)
- Múltiples tablas vinculadas automáticamente
- Fórmulas y gráficas cruzadas
- Sincronización automática
- **Pros**: Muy potente y flexible
- **Contras**: Más complejo de implementar y usar

## Recomendación

### Para Usuario Final:
**Opción B (Dashboard)** es un buen punto medio:
- Fácil de entender
- Flexible
- No requiere cambios arquitectónicos grandes
- Permite análisis combinado

### Para Sistema Completo:
**Opción C** es viable pero requiere:
- Planificación cuidadosa
- Testing exhaustivo
- Documentación clara
- Iteración basada en feedback

## Conclusión

✅ **VIABLE TÉCNICAMENTE**: Sí, con cambios arquitectónicos significativos
✅ **USABLE**: Sí, con diseño cuidadoso de UX
⚠️ **COMPLEJIDAD**: Alta, requiere 16-22 días de desarrollo
💡 **RECOMENDACIÓN**: Empezar con Opción B (Dashboard), luego evolucionar a Opción C si hay demanda

