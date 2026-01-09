/**
 * Servicio de Inteligencia de Código
 * Proporciona funcionalidades similares a las extensiones de VS Code:
 * - Autocompletado (IntelliSense)
 * - Linting en tiempo real
 * - Formateo automático
 * - Snippets de código
 * - Validación de sintaxis
 */

class CodeIntelligenceService {
  constructor() {
    // Snippets de JavaScript/ES6
    this.jsSnippets = {
      'for': {
        prefix: 'for',
        body: ['for (let i = 0; i < ${1:array}.length; i++) {', '\t${2:// code}', '}'],
        description: 'Bucle for'
      },
      'forof': {
        prefix: 'forof',
        body: ['for (const ${1:item} of ${2:array}) {', '\t${3:// code}', '}'],
        description: 'Bucle for...of'
      },
      'forin': {
        prefix: 'forin',
        body: ['for (const ${1:key} in ${2:object}) {', '\t${3:// code}', '}'],
        description: 'Bucle for...in'
      },
      'foreach': {
        prefix: 'foreach',
        body: ['${1:array}.forEach((${2:item}) => {', '\t${3:// code}', '});'],
        description: 'Array.forEach'
      },
      'map': {
        prefix: 'map',
        body: ['${1:array}.map((${2:item}) => {', '\treturn ${3:item};', '});'],
        description: 'Array.map'
      },
      'filter': {
        prefix: 'filter',
        body: ['${1:array}.filter((${2:item}) => {', '\treturn ${3:condition};', '});'],
        description: 'Array.filter'
      },
      'reduce': {
        prefix: 'reduce',
        body: ['${1:array}.reduce((${2:acc}, ${3:item}) => {', '\treturn ${4:acc + item};', '}, ${5:0});'],
        description: 'Array.reduce'
      },
      'arrow': {
        prefix: 'arrow',
        body: ['const ${1:fn} = (${2:params}) => {', '\t${3:// code}', '};'],
        description: 'Arrow function'
      },
      'async': {
        prefix: 'async',
        body: ['const ${1:fn} = async (${2:params}) => {', '\t${3:// code}', '};'],
        description: 'Async function'
      },
      'promise': {
        prefix: 'promise',
        body: ['new Promise((resolve, reject) => {', '\t${1:// code}', '\tresolve(${2:value});', '});'],
        description: 'Promise'
      },
      'trycatch': {
        prefix: 'trycatch',
        body: ['try {', '\t${1:// code}', '} catch (error) {', '\tconsole.error(error);', '}'],
        description: 'Try-catch block'
      },
      'console.log': {
        prefix: 'log',
        body: ['console.log(${1:value});'],
        description: 'console.log'
      },
      'if': {
        prefix: 'if',
        body: ['if (${1:condition}) {', '\t${2:// code}', '}'],
        description: 'If statement'
      },
      'ifelse': {
        prefix: 'ifelse',
        body: ['if (${1:condition}) {', '\t${2:// code}', '} else {', '\t${3:// code}', '}'],
        description: 'If-else statement'
      },
      'class': {
        prefix: 'class',
        body: ['class ${1:ClassName} {', '\tconstructor(${2:params}) {', '\t\t${3:// code}', '\t}', '}'],
        description: 'Class declaration'
      }
    };

    // Snippets de Python
    this.pythonSnippets = {
      'for': {
        prefix: 'for',
        body: ['for ${1:item} in ${2:iterable}:', '\t${3:# code}'],
        description: 'Bucle for'
      },
      'while': {
        prefix: 'while',
        body: ['while ${1:condition}:', '\t${2:# code}'],
        description: 'Bucle while'
      },
      'if': {
        prefix: 'if',
        body: ['if ${1:condition}:', '\t${2:# code}'],
        description: 'If statement'
      },
      'ifelse': {
        prefix: 'ifelse',
        body: ['if ${1:condition}:', '\t${2:# code}', 'else:', '\t${3:# code}'],
        description: 'If-else statement'
      },
      'def': {
        prefix: 'def',
        body: ['def ${1:function_name}(${2:params}):', '\t${3:# code}', '\treturn ${4:value}'],
        description: 'Function definition'
      },
      'class': {
        prefix: 'class',
        body: ['class ${1:ClassName}:', '\tdef __init__(self${2:, params}):', '\t\t${3:# code}'],
        description: 'Class definition'
      },
      'try': {
        prefix: 'try',
        body: ['try:', '\t${1:# code}', 'except ${2:Exception} as e:', '\tprint(e)'],
        description: 'Try-except block'
      },
      'listcomp': {
        prefix: 'listcomp',
        body: ['[${1:x} for ${2:x} in ${3:iterable} if ${4:condition}]'],
        description: 'List comprehension'
      },
      'dictcomp': {
        prefix: 'dictcomp',
        body: ['{${1:k}: ${2:v} for ${3:k}, ${4:v} in ${5:items}}'],
        description: 'Dictionary comprehension'
      },
      'print': {
        prefix: 'print',
        body: ['print(${1:value})'],
        description: 'print statement'
      }
    };

    // Palabras clave y funciones comunes para autocompletado
    this.jsKeywords = [
      'const', 'let', 'var', 'function', 'class', 'extends', 'import', 'export',
      'async', 'await', 'Promise', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
      'console', 'Math', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date',
      'JSON', 'parse', 'stringify', 'map', 'filter', 'reduce', 'forEach', 'find',
      'some', 'every', 'includes', 'indexOf', 'push', 'pop', 'shift', 'unshift',
      'slice', 'splice', 'concat', 'join', 'split', 'reverse', 'sort'
    ];

    this.pythonKeywords = [
      'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally',
      'with', 'as', 'import', 'from', 'return', 'yield', 'pass', 'break', 'continue',
      'print', 'len', 'range', 'enumerate', 'zip', 'map', 'filter', 'reduce', 'sorted',
      'list', 'dict', 'set', 'tuple', 'str', 'int', 'float', 'bool', 'None', 'True', 'False',
      'isinstance', 'type', 'hasattr', 'getattr', 'setattr', 'delattr'
    ];
  }

  /**
   * Obtener snippets según el lenguaje
   */
  getSnippets(language) {
    if (language === 'nodejs' || language === 'javascript') {
      return this.jsSnippets;
    } else if (language === 'python') {
      return this.pythonSnippets;
    }
    return {};
  }

  /**
   * Obtener palabras clave según el lenguaje
   */
  getKeywords(language) {
    if (language === 'nodejs' || language === 'javascript') {
      return this.jsKeywords;
    } else if (language === 'python') {
      return this.pythonKeywords;
    }
    return [];
  }

  /**
   * Buscar snippets que coincidan con el prefijo
   */
  findSnippets(language, prefix) {
    const snippets = this.getSnippets(language);
    const matches = [];
    const prefixLower = prefix.toLowerCase();

    for (const [key, snippet] of Object.entries(snippets)) {
      if (snippet.prefix.toLowerCase().startsWith(prefixLower) || 
          key.toLowerCase().startsWith(prefixLower)) {
        matches.push({
          label: snippet.prefix,
          description: snippet.description,
          snippet: snippet
        });
      }
    }

    return matches.sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * Expandir snippet
   */
  expandSnippet(snippet, cursorPosition = 0) {
    if (!snippet || !snippet.body) return '';

    let result = snippet.body.join('\n');
    // Reemplazar placeholders ${1:value} con value
    result = result.replace(/\$\{(\d+):([^}]+)\}/g, '$2');
    // Reemplazar ${1} con espacios para tab stops
    result = result.replace(/\$\{(\d+)\}/g, '');
    
    return result;
  }

  /**
   * Validar sintaxis básica (detección de errores comunes)
   */
  validateSyntax(code, language) {
    const errors = [];

    if (language === 'nodejs' || language === 'javascript') {
      const lines = code.split('\n');
      
      // Validar paréntesis balanceados
      const openParens = (code.match(/\(/g) || []).length;
      const closeParens = (code.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push({
          line: lines.length,
          message: `Paréntesis no balanceados (${openParens} abiertos, ${closeParens} cerrados)`,
          severity: 'error'
        });
      }

      // Validar llaves balanceadas
      const openBraces = (code.match(/\{/g) || []).length;
      const closeBraces = (code.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors.push({
          line: lines.length,
          message: `Llaves no balanceadas (${openBraces} abiertas, ${closeBraces} cerradas)`,
          severity: 'error'
        });
      }

      // Validar corchetes balanceados
      const openBrackets = (code.match(/\[/g) || []).length;
      const closeBrackets = (code.match(/\]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        errors.push({
          line: lines.length,
          message: `Corchetes no balanceados (${openBrackets} abiertos, ${closeBrackets} cerrados)`,
          severity: 'error'
        });
      }

      // Validar if/else/for/while sin cuerpo o incompletos
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Detectar if/else/for/while que terminan en la misma línea sin llaves ni cuerpo
        const ifMatch = line.match(/^(if|else|for|while)\s*\([^)]*\)\s*$/);
        if (ifMatch) {
          // Si es la última línea o la siguiente línea no tiene indentación, es probablemente un error
          if (i === lines.length - 1) {
            errors.push({
              line: i + 1,
              message: `Se espera un bloque de código después de "${ifMatch[1]}" (usa llaves {})`,
              severity: 'error'
            });
          } else {
            const nextLine = lines[i + 1].trim();
            // Si la siguiente línea no está vacía y no tiene indentación ni llaves, puede ser un error
            if (nextLine && !nextLine.startsWith('{') && !nextLine.startsWith('//') && !nextLine.startsWith('/*')) {
              const nextLineIndent = lines[i + 1].length - lines[i + 1].trimStart().length;
              if (nextLineIndent === 0) {
                errors.push({
                  line: i + 1,
                  message: `Se espera un bloque de código después de "${ifMatch[1]}" (usa llaves {} o indentación)`,
                  severity: 'error'
                });
              }
            }
          }
        }
      }
    } else if (language === 'python') {
      // Validar indentación básica
      const lines = code.split('\n');
      let indentLevel = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        // Detectar cambio de indentación
        const currentIndent = line.length - line.trimStart().length;
        if (trimmed.endsWith(':')) {
          // Esperar indentación en la siguiente línea
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const nextIndent = nextLine.length - nextLine.trimStart().length;
            if (nextIndent <= currentIndent && nextLine.trim()) {
              errors.push({
                line: i + 2,
                message: 'Se espera indentación después de ":"',
                severity: 'warning'
              });
            }
          }
        }
      }

      // Validar paréntesis balanceados
      const openParens = (code.match(/\(/g) || []).length;
      const closeParens = (code.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push({
          line: code.split('\n').length,
          message: 'Paréntesis no balanceados',
          severity: 'error'
        });
      }
    }

    return errors;
  }

  /**
   * Obtener sugerencias de autocompletado
   */
  getCompletions(code, cursorPosition, language) {
    const completions = [];
    const keywords = this.getKeywords(language);
    
    // Calcular la posición del cursor en la línea actual
    const textBeforeCursor = code.substring(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines[lines.length - 1] || '';
    const beforeCursor = currentLine;

    // Buscar palabra parcial antes del cursor
    const wordMatch = beforeCursor.match(/(\w+)$/);
    if (wordMatch && wordMatch[1].length >= 1) { // Solo mostrar si hay al menos 1 carácter
      const partialWord = wordMatch[1].toLowerCase();
      
      // Buscar en keywords
      for (const keyword of keywords) {
        if (keyword.toLowerCase().startsWith(partialWord) && keyword.toLowerCase() !== partialWord) {
          completions.push({
            label: keyword,
            kind: 'keyword',
            detail: 'Palabra clave'
          });
        }
      }

      // Buscar en snippets
      const snippetMatches = this.findSnippets(language, partialWord);
      for (const match of snippetMatches) {
        completions.push({
          label: match.label,
          kind: 'snippet',
          detail: match.description,
          snippet: match.snippet
        });
      }
    }

    return completions.slice(0, 10); // Limitar a 10 sugerencias
  }

  /**
   * Formatear código básico (indentación y espacios)
   */
  formatCode(code, language) {
    // Formateo básico: normalizar espacios y saltos de línea
    let formatted = code
      .replace(/\r\n/g, '\n') // Normalizar saltos de línea
      .replace(/\t/g, '  '); // Convertir tabs a espacios

    if (language === 'nodejs' || language === 'javascript') {
      // Añadir punto y coma al final de líneas si falta
      formatted = formatted.replace(/([^;{}])\n/g, '$1;\n');
      formatted = formatted.replace(/;\n;/g, ';\n'); // Evitar dobles puntos y coma
    }

    return formatted;
  }
}

const codeIntelligenceService = new CodeIntelligenceService();
export default codeIntelligenceService;

