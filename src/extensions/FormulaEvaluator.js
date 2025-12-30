/**
 * Evaluador de fórmulas estilo Notion
 * Soporta funciones como prop(), if(), and(), empty(), format(), round(), etc.
 */

export class FormulaEvaluator {
  constructor(fila, todasLasFilas = [], sprintConfig = null) {
    this.fila = fila;
    this.todasLasFilas = todasLasFilas;
    this.sprintConfig = sprintConfig;
  }

  // Función principal para evaluar una fórmula
  evaluate(formula) {
    if (!formula || typeof formula !== 'string') {
      return '';
    }

    try {
      console.log('🔍 Evaluando fórmula original:', formula);
      
      // Reemplazar prop("Campo") con los valores reales
      let processed = this.processProps(formula);
      console.log('📝 Después de processProps:', processed);
      
      // Evaluar funciones especiales (iterativamente para manejar anidamiento)
      processed = this.evaluateFunctions(processed);
      console.log('⚙️ Después de evaluateFunctions:', processed);
      
      // Evaluar expresiones matemáticas básicas
      let result = this.evaluateMath(processed);
      console.log('✅ Resultado final antes de limpiar:', result);
      
      // Si el resultado todavía parece una fórmula sin evaluar, intentar evaluarlo de nuevo
      if (typeof result === 'string' && (result.includes('if(') || result.includes('prop(') || result.includes('format('))) {
        console.warn('⚠️ Fórmula no completamente evaluada, reintentando:', result);
        // Intentar una evaluación más agresiva
        const retry = this.evaluateFunctions(result);
        result = this.evaluateMath(retry);
        console.log('🔄 Resultado después de reintento:', result);
      }
      
      // Limpiar comillas y paréntesis extra del resultado final
      if (typeof result === 'string') {
        result = result.trim();
        
        // Limpiar patrones problemáticos como "%")" al final - hacerlo primero
        result = result.replace(/"%\)+"$/g, '%'); // Elimina "%")", "%"))", etc.
        result = result.replace(/\)+"%\)+"$/g, '%'); // Elimina )"%")", ))"%"))", etc.
        result = result.replace(/\)+$/g, ''); // Elimina cualquier paréntesis de cierre al final
        
        // Quitar comillas externas si existen
        if (result.startsWith('"') && result.endsWith('"')) {
          result = result.slice(1, -1);
        }
        
        // Quitar paréntesis externos si existen y no son necesarios
        result = result.trim();
        while (result.startsWith('(') && result.endsWith(')')) {
          // Verificar que los paréntesis sean un par completo
          let depth = 0;
          let shouldRemove = true;
          for (let i = 1; i < result.length - 1; i++) {
            if (result[i] === '(') depth++;
            else if (result[i] === ')') {
              depth--;
              if (depth < 0) {
                shouldRemove = false;
                break;
              }
            }
          }
          if (shouldRemove && depth === 0) {
            result = result.slice(1, -1).trim();
          } else {
            break;
          }
        }
        
        // Limpiar cualquier patrón restante de "%")" o similar después de quitar comillas
        result = result.replace(/"%\)+"$/g, '%');
        result = result.replace(/\)+"%\)+"$/g, '%');
        result = result.replace(/\)+$/g, ''); // Elimina cualquier paréntesis de cierre al final
        result = result.replace(/^\)+/g, ''); // Elimina cualquier paréntesis de apertura al inicio
      }
      
      console.log('✅ Resultado final limpio:', result);
      return result;
    } catch (error) {
      console.error('❌ Error evaluando fórmula:', error, formula);
      return `Error: ${error.message}`;
    }
  }

  // Procesar prop("Campo") y reemplazarlos con valores
  processProps(formula) {
    // Buscar todas las ocurrencias de prop("Campo")
    const propRegex = /prop\s*\(\s*"([^"]+)"\s*\)/g;
    
    return formula.replace(propRegex, (match, campo) => {
      const valor = this.getPropValue(campo);
      console.log(`  📊 prop("${campo}") =`, valor, `(tipo: ${typeof valor})`);
      
      // Si es un número, devolverlo directamente
      if (typeof valor === 'number') {
        return valor.toString();
      }
      // Si es un booleano, convertirlo a número (true=1, false=0)
      if (typeof valor === 'boolean') {
        return valor ? '1' : '0';
      }
      // Si es string, intentar convertir a número si es posible
      if (typeof valor === 'string') {
        const num = parseFloat(valor);
        if (!isNaN(num)) {
          return num.toString();
        }
        return `"${valor}"`;
      }
      // Si está vacío, devolver 0
      console.warn(`  ⚠️ prop("${campo}") está vacío o es null, usando 0`);
      return '0';
    });
  }

  // Obtener el valor de una propiedad
  getPropValue(campo) {
    // Propiedades globales del sprint (desde sprintConfig)
    if (this.sprintConfig) {
      const campoLower = campo.toLowerCase();
      
      // Sprint Start Date
      if (campoLower === 'sprint start date' || campoLower === 'fecha inicio sprint') {
        return this.sprintConfig.sprintStartDate || null;
      }
      
      // Sprint End Date
      if (campoLower === 'sprint end date' || campoLower === 'fecha fin sprint') {
        return this.sprintConfig.sprintEndDate || null;
      }
      
      // Horas Diarias (también puede ser "Horas Diarias Sprint")
      if (campoLower === 'horas diarias' || campoLower === 'horas diarias sprint' || campoLower === 'horas por dia') {
        return this.sprintConfig.horasDiarias || 8;
      }
      
      // Puntos Totales Sprint
      if (campoLower === 'puntos totales sprint' || campoLower === 'puntos totales' || campoLower === 'story points total') {
        return this.sprintConfig.puntosTotalesSprint || null;
      }
    }
    
    // Current Date siempre devuelve la fecha actual
    if (campo.toLowerCase() === 'current date' || campo.toLowerCase() === 'fecha actual') {
      const hoy = new Date();
      const año = hoy.getFullYear();
      const mes = String(hoy.getMonth() + 1).padStart(2, '0');
      const dia = String(hoy.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    }
    
    // Buscar en las propiedades de la fila
    if (!this.fila || !this.fila.properties) {
      return null;
    }

    const prop = this.fila.properties[campo];
    if (!prop) {
      return null;
    }

    // Si es un array (tags), devolver el label del primer elemento
    if (Array.isArray(prop.value) && prop.value.length > 0) {
      const firstTag = prop.value[0];
      return firstTag.label || firstTag.value || firstTag;
    }

    return prop.value;
  }

  // Parser mejorado para encontrar el final de una función con paréntesis anidados
  findMatchingParen(str, startPos) {
    let depth = 0;
    let pos = startPos;
    let inString = false;
    let escapeNext = false;
    
    while (pos < str.length) {
      const char = str[pos];
      
      if (escapeNext) {
        escapeNext = false;
        pos++;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        pos++;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        pos++;
        continue;
      }
      
      if (!inString) {
        if (char === '(') {
          depth++;
        } else if (char === ')') {
          depth--;
          if (depth === 0) {
            return pos;
          }
        }
      }
      pos++;
    }
    return -1;
  }

  // Dividir una expresión en partes separadas por comas, respetando paréntesis y strings
  splitByCommas(str) {
    const parts = [];
    let currentPart = '';
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      
      if (escapeNext) {
        escapeNext = false;
        currentPart += char;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        currentPart += char;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        currentPart += char;
        continue;
      }
      
      if (!inString) {
        if (char === '(') {
          depth++;
          currentPart += char;
        } else if (char === ')') {
          depth--;
          currentPart += char;
        } else if (char === ',' && depth === 0) {
          parts.push(currentPart.trim());
          currentPart = '';
        } else {
          currentPart += char;
        }
      } else {
        currentPart += char;
      }
    }
    
    if (currentPart.trim()) {
      parts.push(currentPart.trim());
    }
    
    return parts;
  }

  // Evaluar funciones especiales (if, and, or, empty, format, round, floor, substring, etc.)
  evaluateFunctions(formula) {
    let result = formula;
    let changed = true;
    let iterations = 0;
    const maxIterations = 50; // Prevenir bucles infinitos

      // Iterar hasta que no haya más funciones que evaluar
      while (changed && iterations < maxIterations) {
        iterations++;
        const before = result;
        
        // IMPORTANTE: Evaluar empty() y !empty() ANTES que and() y or()
        // para que los valores booleanos estén correctamente evaluados
        
        // Evaluar empty() - empty(expr)
        const emptyRegex = /empty\s*\(\s*([^)]+)\s*\)/g;
        result = result.replace(emptyRegex, (match, expr) => {
          const evalExpr = this.evaluateFunctions(expr.trim());
          const valor = this.evaluateExpression(evalExpr);
          // empty() devuelve true solo si el valor es null, undefined, string vacío, o el número 0
          // Pero NO si es cualquier otro número (como 10)
          const isEmpty = valor === null || valor === undefined || valor === '' || (typeof valor === 'number' && valor === 0);
          console.log(`  🔍 empty(${expr.trim()}) = ${valor} (tipo: ${typeof valor}) => ${isEmpty ? '1' : '0'}`);
          return isEmpty ? '1' : '0';
        });

        // Evaluar !empty() - !empty(expr)
        const notEmptyRegex = /!\s*empty\s*\(\s*([^)]+)\s*\)/g;
        result = result.replace(notEmptyRegex, (match, expr) => {
          const evalExpr = this.evaluateFunctions(expr.trim());
          const valor = this.evaluateExpression(evalExpr);
          // !empty() devuelve true si el valor NO está vacío
          const isEmpty = valor === null || valor === undefined || valor === '' || (typeof valor === 'number' && valor === 0);
          const result = isEmpty ? '0' : '1';
          console.log(`  🔍 !empty(${expr.trim()}) = ${valor} (tipo: ${typeof valor}) => ${result}`);
          return result;
        });
        
        // Evaluar if() anidados - usar parser mejorado
      const ifRegex = /if\s*\(/g;
      let ifMatch;
      const ifMatches = [];
      
      // Encontrar todos los if()
      while ((ifMatch = ifRegex.exec(result)) !== null) {
        ifMatches.push(ifMatch.index);
      }
      
      // Procesar desde el último hacia el primero (para manejar anidamiento)
      for (let i = ifMatches.length - 1; i >= 0; i--) {
        const startPos = ifMatches[i];
        const openParenPos = result.indexOf('(', startPos);
        const closeParenPos = this.findMatchingParen(result, openParenPos);
        
        if (closeParenPos === -1) continue;
        
        const ifExpression = result.substring(startPos, closeParenPos + 1);
        const innerContent = result.substring(openParenPos + 1, closeParenPos);
        
        // Dividir en partes
        const parts = this.splitByCommas(innerContent);
        
        if (parts.length >= 3) {
          const condicion = parts[0];
          const verdadero = parts.slice(1, -1).join(','); // Todo lo del medio
          let falso = parts[parts.length - 1];
          
          // Remover paréntesis externos del falso si los tiene (para if() anidados)
          falso = falso.trim();
          if (falso.startsWith('(') && falso.endsWith(')')) {
            // Verificar que los paréntesis externos sean un par completo
            let depth = 0;
            let shouldRemove = true;
            for (let i = 1; i < falso.length - 1; i++) {
              if (falso[i] === '(') depth++;
              else if (falso[i] === ')') {
                depth--;
                if (depth < 0) {
                  shouldRemove = false;
                  break;
                }
              }
            }
            if (shouldRemove && depth === 0) {
              falso = falso.slice(1, -1).trim();
            }
          }
          
          console.log(`  🔀 if() encontrado: condicion="${condicion}", verdadero="${verdadero}", falso="${falso}"`);
          
          // Evaluar la condición
          let condEval = condicion.trim();
          condEval = this.evaluateFunctions(condEval);
          const condResult = this.evaluateCondition(condEval);
          
          console.log(`  ✅ Condición evaluada: "${condEval}" = ${condResult}`);
          
          // Evaluar el valor verdadero o falso según corresponda
          const valor = condResult ? verdadero.trim() : falso;
          console.log(`  📌 Usando ${condResult ? 'verdadero' : 'falso'}: "${valor}"`);
          
          // Evaluar recursivamente el valor seleccionado
          let valorEvaluado = this.evaluateFunctions(valor);
          valorEvaluado = this.evaluateMath(valorEvaluado);
          
          // Limpiar comillas y paréntesis extra del resultado
          if (typeof valorEvaluado === 'string') {
            // Quitar comillas externas si existen
            valorEvaluado = valorEvaluado.trim();
            if (valorEvaluado.startsWith('"') && valorEvaluado.endsWith('"')) {
              valorEvaluado = valorEvaluado.slice(1, -1);
            }
            // Quitar paréntesis externos si existen y no son necesarios
            valorEvaluado = valorEvaluado.trim();
            if (valorEvaluado.startsWith('(') && valorEvaluado.endsWith(')')) {
              // Verificar que los paréntesis sean un par completo
              let depth = 0;
              let shouldRemove = true;
              for (let i = 1; i < valorEvaluado.length - 1; i++) {
                if (valorEvaluado[i] === '(') depth++;
                else if (valorEvaluado[i] === ')') {
                  depth--;
                  if (depth < 0) {
                    shouldRemove = false;
                    break;
                  }
                }
              }
              if (shouldRemove && depth === 0) {
                valorEvaluado = valorEvaluado.slice(1, -1).trim();
              }
            }
          }
          
          console.log(`  🎯 Valor evaluado final: "${valorEvaluado}"`);
          
          // Reemplazar el if() completo con el resultado
          // El valor ya está limpio (sin comillas ni paréntesis extra)
          // Agregar comillas para mantener consistencia con el formato de strings
          let valorParaReemplazar = `"${String(valorEvaluado)}"`;
          result = result.substring(0, startPos) + valorParaReemplazar + result.substring(closeParenPos + 1);
          
          // Reiniciar la búsqueda
          break;
        }
      }

      // Evaluar and() - and(expr1, expr2, ...)
      const andRegex = /and\s*\(\s*([^)]+)\s*\)/g;
      result = result.replace(andRegex, (match, args) => {
        const partes = this.splitByCommas(args);
        console.log(`  🔍 and() con ${partes.length} argumentos:`, partes);
        const valores = partes.map(a => {
          const evalExpr = this.evaluateFunctions(a.trim());
          // Si el resultado es "0" o "1", tratarlo como booleano directamente
          if (evalExpr === '0' || evalExpr === '1') {
            const boolResult = evalExpr === '1';
            console.log(`    - "${a.trim()}" => "${evalExpr}" (booleano: ${boolResult})`);
            return boolResult;
          }
          const condResult = this.evaluateCondition(evalExpr);
          console.log(`    - "${a.trim()}" => "${evalExpr}" => ${condResult}`);
          return condResult;
        });
        const result = valores.every(v => v) ? '1' : '0';
        console.log(`  ✅ and() resultado: ${result}`);
        return result;
      });

      // Evaluar or() - or(expr1, expr2, ...)
      const orRegex = /or\s*\(\s*([^)]+)\s*\)/g;
      result = result.replace(orRegex, (match, args) => {
        const valores = this.splitByCommas(args).map(a => {
          const evalExpr = this.evaluateFunctions(a.trim());
          return this.evaluateCondition(evalExpr);
        });
        return valores.some(v => v) ? '1' : '0';
      });


      // Evaluar format() - format(numero, decimales?)
      // Usar un enfoque similar a if() para manejar paréntesis anidados
      const formatRegex = /format\s*\(/g;
      let formatMatch;
      const formatMatches = [];
      
      // Encontrar todos los format()
      while ((formatMatch = formatRegex.exec(result)) !== null) {
        formatMatches.push(formatMatch.index);
      }
      
      // Procesar desde el último hacia el primero
      for (let i = formatMatches.length - 1; i >= 0; i--) {
        const startPos = formatMatches[i];
        const openParenPos = result.indexOf('(', startPos);
        const closeParenPos = this.findMatchingParen(result, openParenPos);
        
        if (closeParenPos === -1) continue;
        
        const innerContent = result.substring(openParenPos + 1, closeParenPos);
        const parts = this.splitByCommas(innerContent);
        
        if (parts.length >= 1) {
          const num = parts[0].trim();
          const decimals = parts.length > 1 ? parts[1].trim() : null;
          
          const evalNum = this.evaluateFunctions(num);
          const numVal = parseFloat(this.evaluateExpression(evalNum));
          
          if (isNaN(numVal)) {
            console.log(`  🔍 format(${num}) = NaN, devolviendo "0"`);
            result = result.substring(0, startPos) + '"0"' + result.substring(closeParenPos + 1);
            continue;
          }
          
          const dec = decimals ? parseInt(decimals) : 0;
          const formatted = numVal.toFixed(dec);
          console.log(`  🔍 format(${num}, ${dec}) = ${numVal} => "${formatted}"`);
          
          // Reemplazar el format() completo con el resultado entre comillas
          // Pero si está dentro de una concatenación, no agregar comillas (se agregarán en la concatenación)
          result = result.substring(0, startPos) + `"${formatted}"` + result.substring(closeParenPos + 1);
        }
      }

      // Evaluar round() - round(numero) - manejar paréntesis anidados
      const roundRegex = /round\s*\(/g;
      let roundMatch;
      const roundMatches = [];
      while ((roundMatch = roundRegex.exec(result)) !== null) {
        roundMatches.push(roundMatch.index);
      }
      for (let i = roundMatches.length - 1; i >= 0; i--) {
        const startPos = roundMatches[i];
        const openParenPos = result.indexOf('(', startPos);
        const closeParenPos = this.findMatchingParen(result, openParenPos);
        if (closeParenPos === -1) continue;
        const num = result.substring(openParenPos + 1, closeParenPos).trim();
        const evalNum = this.evaluateFunctions(num);
        const numVal = parseFloat(this.evaluateExpression(evalNum));
        if (isNaN(numVal)) {
          result = result.substring(0, startPos) + '0' + result.substring(closeParenPos + 1);
        } else {
          result = result.substring(0, startPos) + Math.round(numVal).toString() + result.substring(closeParenPos + 1);
        }
      }

      // Evaluar floor() - floor(numero) - manejar paréntesis anidados
      const floorRegex = /floor\s*\(/g;
      let floorMatch;
      const floorMatches = [];
      while ((floorMatch = floorRegex.exec(result)) !== null) {
        floorMatches.push(floorMatch.index);
      }
      for (let i = floorMatches.length - 1; i >= 0; i--) {
        const startPos = floorMatches[i];
        const openParenPos = result.indexOf('(', startPos);
        const closeParenPos = this.findMatchingParen(result, openParenPos);
        if (closeParenPos === -1) continue;
        const num = result.substring(openParenPos + 1, closeParenPos).trim();
        const evalNum = this.evaluateFunctions(num);
        const numVal = parseFloat(this.evaluateExpression(evalNum));
        if (isNaN(numVal)) {
          result = result.substring(0, startPos) + '0' + result.substring(closeParenPos + 1);
        } else {
          result = result.substring(0, startPos) + Math.floor(numVal).toString() + result.substring(closeParenPos + 1);
        }
      }

      // Evaluar substring() - substring(texto, inicio, fin?)
      // Primero evaluar las expresiones dentro de substring antes de procesarlo
      const substringRegex = /substring\s*\(/g;
      let substringMatch;
      const substringMatches = [];
      while ((substringMatch = substringRegex.exec(result)) !== null) {
        substringMatches.push(substringMatch.index);
      }
      
      // Procesar desde el último hacia el primero
      for (let i = substringMatches.length - 1; i >= 0; i--) {
        const startPos = substringMatches[i];
        const openParenPos = result.indexOf('(', startPos);
        const closeParenPos = this.findMatchingParen(result, openParenPos);
        
        if (closeParenPos === -1) continue;
        
        const innerContent = result.substring(openParenPos + 1, closeParenPos);
        const parts = this.splitByCommas(innerContent);
        
        if (parts.length >= 2) {
          // Primer parámetro: texto (debe ser string literal)
          let texto = parts[0].trim();
          if (texto.startsWith('"') && texto.endsWith('"')) {
            texto = texto.slice(1, -1);
          } else {
            // Si no es un string literal, intentar evaluarlo
            texto = this.evaluateExpression(this.evaluateFunctions(texto));
            if (texto.startsWith('"') && texto.endsWith('"')) {
              texto = texto.slice(1, -1);
            }
          }
          
          // Segundo parámetro: inicio (puede ser expresión)
          let inicioExpr = parts[1].trim();
          inicioExpr = this.evaluateFunctions(inicioExpr);
          const start = parseInt(this.evaluateExpression(inicioExpr)) || 0;
          
          // Tercer parámetro opcional: fin (puede ser expresión)
          let end = texto.length;
          if (parts.length >= 3) {
            let finExpr = parts[2].trim();
            finExpr = this.evaluateFunctions(finExpr);
            const endVal = parseInt(this.evaluateExpression(finExpr));
            if (!isNaN(endVal)) {
              end = endVal;
            }
          }
          
          const substringResult = texto.substring(start, end);
          result = result.substring(0, startPos) + `"${substringResult}"` + result.substring(closeParenPos + 1);
        }
      }

      // Evaluar date() - date(fechaString) convierte fecha a timestamp en milisegundos
      const dateRegex = /date\s*\(/g;
      let dateMatch;
      const dateMatches = [];
      while ((dateMatch = dateRegex.exec(result)) !== null) {
        dateMatches.push(dateMatch.index);
      }
      for (let i = dateMatches.length - 1; i >= 0; i--) {
        const startPos = dateMatches[i];
        const openParenPos = result.indexOf('(', startPos);
        const closeParenPos = this.findMatchingParen(result, openParenPos);
        if (closeParenPos === -1) continue;
        const fechaStr = result.substring(openParenPos + 1, closeParenPos).trim();
        // Remover comillas si existen
        const fecha = fechaStr.startsWith('"') && fechaStr.endsWith('"') 
          ? fechaStr.slice(1, -1) 
          : this.evaluateExpression(this.evaluateFunctions(fechaStr));
        const fechaObj = new Date(fecha);
        const timestamp = fechaObj.getTime();
        if (isNaN(timestamp)) {
          result = result.substring(0, startPos) + '0' + result.substring(closeParenPos + 1);
        } else {
          result = result.substring(0, startPos) + timestamp.toString() + result.substring(closeParenPos + 1);
        }
      }

      // Evaluar calcularDiasHabiles() - calcularDiasHabiles(fechaInicio, fechaFin)
      // Calcula días hábiles (excluyendo sábados, domingos y días no trabajados configurados)
      const calcularDiasHabilesRegex = /calcularDiasHabiles\s*\(/g;
      let calcularMatch;
      const calcularMatches = [];
      while ((calcularMatch = calcularDiasHabilesRegex.exec(result)) !== null) {
        calcularMatches.push(calcularMatch.index);
      }
      for (let i = calcularMatches.length - 1; i >= 0; i--) {
        const startPos = calcularMatches[i];
        const openParenPos = result.indexOf('(', startPos);
        const closeParenPos = this.findMatchingParen(result, openParenPos);
        if (closeParenPos === -1) continue;
        const innerContent = result.substring(openParenPos + 1, closeParenPos);
        const parts = this.splitByCommas(innerContent);
        if (parts.length >= 2) {
          let fechaInicioStr = parts[0].trim();
          let fechaFinStr = parts[1].trim();
          
          // Evaluar las expresiones de fecha
          fechaInicioStr = this.evaluateFunctions(fechaInicioStr);
          fechaFinStr = this.evaluateFunctions(fechaFinStr);
          
          // Remover comillas si existen
          const fechaInicio = fechaInicioStr.startsWith('"') && fechaInicioStr.endsWith('"') 
            ? fechaInicioStr.slice(1, -1) 
            : this.evaluateExpression(fechaInicioStr);
          const fechaFin = fechaFinStr.startsWith('"') && fechaFinStr.endsWith('"') 
            ? fechaFinStr.slice(1, -1) 
            : this.evaluateExpression(fechaFinStr);
          
          // Calcular días hábiles
          const inicio = new Date(fechaInicio);
          const fin = new Date(fechaFin);
          let dias = 0;
          const fechaActual = new Date(inicio);
          
          // Obtener días no trabajados del sprintConfig
          const diasNoTrabajados = this.sprintConfig?.diasNoTrabajados || [];
          // Convertir a formato YYYY-MM-DD para comparación
          const diasNoTrabajadosSet = new Set(diasNoTrabajados.map(fecha => {
            if (typeof fecha === 'string') {
              // Si ya está en formato YYYY-MM-DD, usarlo directamente
              if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
                return fecha;
              }
              // Si no, convertir a Date y luego a YYYY-MM-DD
              const d = new Date(fecha);
              const año = d.getFullYear();
              const mes = String(d.getMonth() + 1).padStart(2, '0');
              const dia = String(d.getDate()).padStart(2, '0');
              return `${año}-${mes}-${dia}`;
            }
            return fecha;
          }));
          
          while (fechaActual <= fin) {
            const diaSemana = fechaActual.getDay();
            // 0 = domingo, 6 = sábado
            const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
            
            // Formatear fecha actual para comparar
            const añoActual = fechaActual.getFullYear();
            const mesActual = String(fechaActual.getMonth() + 1).padStart(2, '0');
            const diaActual = String(fechaActual.getDate()).padStart(2, '0');
            const fechaActualStr = `${añoActual}-${mesActual}-${diaActual}`;
            const esDiaNoTrabajado = diasNoTrabajadosSet.has(fechaActualStr);
            
            // Contar solo si NO es fin de semana y NO está en días no trabajados
            if (!esFinDeSemana && !esDiaNoTrabajado) {
              dias++;
            }
            fechaActual.setDate(fechaActual.getDate() + 1);
          }
          
          result = result.substring(0, startPos) + dias.toString() + result.substring(closeParenPos + 1);
        }
      }

      // Evaluar suma() - suma("NombrePropiedad") suma todos los valores de una propiedad en todas las filas
      // También soporta suma(prop("NombrePropiedad")) extrayendo el nombre de la propiedad
      const sumaRegex = /suma\s*\(/g;
      let sumaMatch;
      const sumaMatches = [];
      while ((sumaMatch = sumaRegex.exec(result)) !== null) {
        sumaMatches.push(sumaMatch.index);
      }
      for (let i = sumaMatches.length - 1; i >= 0; i--) {
        const startPos = sumaMatches[i];
        const openParenPos = result.indexOf('(', startPos);
        const closeParenPos = this.findMatchingParen(result, openParenPos);
        if (closeParenPos === -1) continue;
        const innerContent = result.substring(openParenPos + 1, closeParenPos).trim();
        
        let nombrePropiedad = null;
        
        // Si es prop("Nombre"), extraer el nombre de la propiedad
        const propMatch = innerContent.match(/prop\s*\(\s*"([^"]+)"\s*\)/);
        if (propMatch) {
          nombrePropiedad = propMatch[1];
        } else {
          // Si es un string literal directo, extraerlo
          if (innerContent.startsWith('"') && innerContent.endsWith('"')) {
            nombrePropiedad = innerContent.slice(1, -1);
          } else {
            // Intentar evaluar como expresión para obtener el nombre
            const evalContent = this.evaluateFunctions(innerContent);
            const evalExpr = this.evaluateExpression(evalContent);
            if (typeof evalExpr === 'string') {
              nombrePropiedad = evalExpr.startsWith('"') && evalExpr.endsWith('"') 
                ? evalExpr.slice(1, -1) 
                : evalExpr;
            }
          }
        }
        
        if (nombrePropiedad && this.todasLasFilas) {
          // Usar calcularTotal para sumar todos los valores
          const total = this.todasLasFilas.reduce((suma, fila) => {
            const valor = fila.properties?.[nombrePropiedad]?.value;
            if (typeof valor === 'number') {
              return suma + valor;
            }
            const num = parseFloat(valor);
            if (!isNaN(num)) {
              return suma + num;
            }
            return suma;
          }, 0);
          result = result.substring(0, startPos) + total.toString() + result.substring(closeParenPos + 1);
        } else {
          result = result.substring(0, startPos) + '0' + result.substring(closeParenPos + 1);
        }
      }

      // Verificar si hubo cambios
      changed = (before !== result);
    }

    return result;
  }

  // Evaluar condiciones (comparaciones, >=, <=, ==, !=, etc.)
  evaluateCondition(expr) {
    expr = expr.trim();

    // >=
    if (expr.includes('>=')) {
      const [left, right] = expr.split('>=').map(s => this.evaluateExpression(s.trim()));
      return parseFloat(left) >= parseFloat(right);
    }
    // <=
    if (expr.includes('<=')) {
      const [left, right] = expr.split('<=').map(s => this.evaluateExpression(s.trim()));
      return parseFloat(left) <= parseFloat(right);
    }
    // >
    if (expr.includes('>') && !expr.includes('>=')) {
      const [left, right] = expr.split('>').map(s => this.evaluateExpression(s.trim()));
      return parseFloat(left) > parseFloat(right);
    }
    // <
    if (expr.includes('<') && !expr.includes('<=')) {
      const [left, right] = expr.split('<').map(s => this.evaluateExpression(s.trim()));
      return parseFloat(left) < parseFloat(right);
    }
    // ==
    if (expr.includes('==')) {
      const [left, right] = expr.split('==').map(s => this.evaluateExpression(s.trim()));
      return left == right;
    }
    // !=
    if (expr.includes('!=')) {
      const [left, right] = expr.split('!=').map(s => this.evaluateExpression(s.trim()));
      return left != right;
    }

    // Si no hay operador de comparación, evaluar como expresión booleana
    const val = this.evaluateExpression(expr);
    return Boolean(val) && val !== 0 && val !== '';
  }

  // Evaluar expresiones matemáticas básicas
  evaluateMath(expr) {
    expr = expr.trim();
    console.log(`  📐 evaluateMath entrada: "${expr}"`);
    
    // Manejar concatenación de strings con +
    if (expr.includes('"') && expr.includes('+')) {
      // Dividir por + pero preservar strings entre comillas y paréntesis
      const parts = [];
      let current = '';
      let inString = false;
      let depth = 0;
      
      for (let i = 0; i < expr.length; i++) {
        const char = expr[i];
        if (char === '"' && (i === 0 || expr[i-1] !== '\\')) {
          inString = !inString;
          current += char;
        } else if (char === '+' && !inString && depth === 0) {
          if (current.trim()) {
            parts.push(current.trim());
            current = '';
          }
        } else {
          if (!inString) {
            if (char === '(') depth++;
            else if (char === ')') depth--;
          }
          current += char;
        }
      }
      if (current.trim()) {
        parts.push(current.trim());
      }
      
      console.log(`  📐 Partes para concatenar:`, parts);
      
      // Evaluar cada parte y concatenar
      if (parts.length > 1) {
        const concatenated = parts.map(p => {
          const trimmed = p.trim();
          console.log(`    - Procesando parte: "${trimmed}"`);
          if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            const result = trimmed.slice(1, -1);
            console.log(`      => String: "${result}"`);
            return result;
          }
          // Evaluar la expresión (puede ser un número o una expresión matemática)
          let evalResult = this.evaluateExpression(trimmed);
          
          // Limpiar comillas y paréntesis del resultado
          if (typeof evalResult === 'string') {
            evalResult = evalResult.trim();
            // Quitar comillas externas si existen
            if (evalResult.startsWith('"') && evalResult.endsWith('"')) {
              evalResult = evalResult.slice(1, -1);
            }
            // Quitar paréntesis externos si existen y no son necesarios
            evalResult = evalResult.trim();
            if (evalResult.startsWith('(') && evalResult.endsWith(')')) {
              let depth = 0;
              let shouldRemove = true;
              for (let i = 1; i < evalResult.length - 1; i++) {
                if (evalResult[i] === '(') depth++;
                else if (evalResult[i] === ')') {
                  depth--;
                  if (depth < 0) {
                    shouldRemove = false;
                    break;
                  }
                }
              }
              if (shouldRemove && depth === 0) {
                evalResult = evalResult.slice(1, -1).trim();
              }
            }
          }
          
          const strResult = String(evalResult);
          console.log(`      => Evaluado: ${trimmed} => "${strResult}"`);
          return strResult;
        }).join('');
        console.log(`  📐 Resultado concatenado: "${concatenated}"`);
        // Limpiar cualquier comilla o paréntesis extra que pueda haber quedado
        let cleaned = concatenated.trim();
        // Quitar comillas externas si existen
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
          cleaned = cleaned.slice(1, -1);
        }
        // Quitar paréntesis externos si existen
        cleaned = cleaned.trim();
        if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
          let depth = 0;
          let shouldRemove = true;
          for (let i = 1; i < cleaned.length - 1; i++) {
            if (cleaned[i] === '(') depth++;
            else if (cleaned[i] === ')') {
              depth--;
              if (depth < 0) {
                shouldRemove = false;
                break;
              }
            }
          }
          if (shouldRemove && depth === 0) {
            cleaned = cleaned.slice(1, -1).trim();
          }
        }
        // Limpiar patrones problemáticos
        cleaned = cleaned.replace(/"%\)+"$/g, '%');
        cleaned = cleaned.replace(/\)+"%\)+"$/g, '%');
        console.log(`  📐 Resultado concatenado limpio: "${cleaned}"`);
        return cleaned;
      }
    }

    // Si es un string entre comillas simple, devolverlo sin las comillas
    if (expr.startsWith('"') && expr.endsWith('"')) {
      let content = expr.slice(1, -1);
      // Limpiar patrones problemáticos dentro del string
      content = content.replace(/"%\)+"$/g, '%');
      content = content.replace(/\)+"%\)+"$/g, '%');
      content = content.replace(/\)+$/g, '');
      // Quitar paréntesis externos si existen
      content = content.trim();
      if (content.startsWith('(') && content.endsWith(')')) {
        let depth = 0;
        let shouldRemove = true;
        for (let i = 1; i < content.length - 1; i++) {
          if (content[i] === '(') depth++;
          else if (content[i] === ')') {
            depth--;
            if (depth < 0) {
              shouldRemove = false;
              break;
            }
          }
        }
        if (shouldRemove && depth === 0) {
          content = content.slice(1, -1).trim();
        }
      }
      return content;
    }

    // Remover comillas de strings que quedaron si no hay concatenación
    expr = expr.replace(/"([^"]*)"/g, (match, str) => {
      // Si el string es numérico, devolver el número
      const num = parseFloat(str);
      if (!isNaN(num)) {
        return num.toString();
      }
      return match; // Mantener como string
    });

    // Evaluar operaciones matemáticas de forma segura
    try {
      // Evaluar como expresión matemática
      const result = this.evaluateExpression(expr);
      
      // Si el resultado es un número, devolverlo
      if (typeof result === 'number') {
        return result;
      }
      
      return result;
    } catch (error) {
      console.warn('Error en evaluateMath:', error, expr);
      return expr; // Si falla, devolver la expresión original
    }
  }

  // Evaluar expresión matemática de forma segura
  evaluateExpression(expr) {
    expr = expr.trim();
    
    // Si es un string entre comillas, devolver el contenido
    if (expr.startsWith('"') && expr.endsWith('"')) {
      return expr.slice(1, -1);
    }

    // Si es un número, devolverlo
    const num = parseFloat(expr);
    if (!isNaN(num) && isFinite(num)) {
      return num;
    }

    // Intentar evaluar como expresión matemática (solo números y operadores)
    if (/^[\d\s+\-*/().]+$/.test(expr)) {
      try {
        // Usar Function constructor para evaluar de forma segura
        return Function(`"use strict"; return (${expr})`)();
      } catch (error) {
        return 0;
      }
    }

    return expr;
  }
}

// Función helper para calcular totales
export function calcularTotal(filas, nombrePropiedad) {
  return filas.reduce((suma, fila) => {
    const valor = fila.properties?.[nombrePropiedad]?.value;
    if (typeof valor === 'number') {
      return suma + valor;
    }
    const num = parseFloat(valor);
    if (!isNaN(num)) {
      return suma + num;
    }
    return suma;
  }, 0);
}
