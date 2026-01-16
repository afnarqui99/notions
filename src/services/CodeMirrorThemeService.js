import { EditorView, Decoration, ViewPlugin, WidgetType } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { syntaxTree } from '@codemirror/language';
import LocalStorageService from './LocalStorageService';

/**
 * Servicio centralizado para manejar temas de CodeMirror
 * Proporciona funciones reutilizables para VisualCodeBlock y VisualCodeTab
 */

// Valores por defecto para el tema personalizado
export const DEFAULT_CUSTOM_THEME_COLORS = {
  backgroundColor: '#1a1a1a',
  textColor: '#ffffff',
  gutterColor: '#2a2a2a',
  gutterTextColor: '#00ffff',
  activeLineGutterColor: '#ffff00',
  keywordColor: '#ff0000',
  stringColor: '#ffff00',
  variableColor: '#00ff00',
  commentColor: '#00ffff',
  numberColor: '#ff00ff',
  functionColor: '#ff8800',
  typeColor: '#0088ff',
  propertyColor: '#88ff00',
  operatorColor: '#ffffff',
  metaColor: '#ff88ff',
  bracketColor: '#ffff88',
  tagColor: '#ff8888',
  attributeColor: '#88ffff',
  selectionBackground: 'rgba(255, 0, 255, 0.5)',
  cursorColor: '#00ff00',
  caretColor: '#00ff00',
};

// Lista de temas disponibles
export const AVAILABLE_THEMES = [
  { 
    value: 'custom', 
    label: 'Personalizado', 
    description: 'Tema personalizado con colores muy visibles para verificar aplicación',
    preview: {
      backgroundColor: '#1a1a1a',
      gutterColor: '#2a2a2a',
      textColor: '#ffffff',
      keywordColor: '#ff0000',
      stringColor: '#ffff00',
      commentColor: '#00ffff'
    }
  },
  { 
    value: 'notion', 
    label: 'Notion', 
    description: 'Paleta elegante de Notion (negro con colores suaves)',
    preview: {
      backgroundColor: '#1E1E1E',
      gutterColor: '#1E1E1E',
      textColor: '#FFFFFF',
      keywordColor: '#4A9EFF',
      stringColor: '#FFD700',
      commentColor: '#6A9955'
    }
  },
  { 
    value: 'oneDark', 
    label: 'One Dark',
    description: 'Tema oscuro popular de Atom',
    preview: {
      backgroundColor: '#282c34',
      textColor: '#abb2bf',
      keywordColor: '#c678dd',
      stringColor: '#98c379',
      commentColor: '#5c6370'
    }
  },
  { 
    value: 'light', 
    label: 'Light',
    description: 'Tema claro para trabajo diurno',
    preview: {
      backgroundColor: '#ffffff',
      textColor: '#333333',
      keywordColor: '#0000ff',
      stringColor: '#008000',
      commentColor: '#808080'
    }
  },
  { 
    value: 'cursorDark', 
    label: 'Cursor Dark',
    description: 'Tema oscuro principal de Cursor (recomendado)',
    preview: {
      backgroundColor: '#1e1e1e',
      gutterColor: '#252526',
      textColor: '#d4d4d4',
      keywordColor: '#569cd6',
      stringColor: '#ce9178',
      commentColor: '#6a9955'
    }
  },
  { 
    value: 'monokai', 
    label: 'Monokai',
    description: 'Tema clásico de Sublime Text',
    preview: {
      backgroundColor: '#272822',
      textColor: '#f8f8f2',
      keywordColor: '#f92672',
      stringColor: '#e6db74',
      commentColor: '#75715e'
    }
  },
  { 
    value: 'dracula', 
    label: 'Dracula',
    description: 'Tema oscuro con colores vibrantes',
    preview: {
      backgroundColor: '#282a36',
      textColor: '#f8f8f2',
      keywordColor: '#ff79c6',
      stringColor: '#f1fa8c',
      commentColor: '#6272a4'
    }
  },
  { 
    value: 'tokyoNight', 
    label: 'Tokyo Night',
    description: 'Tema oscuro elegante estilo Tokyo',
    preview: {
      backgroundColor: '#1a1b26',
      textColor: '#c0caf5',
      keywordColor: '#bb9af7',
      stringColor: '#9ece6a',
      commentColor: '#565f89'
    }
  },
];

/**
 * Obtiene el HighlightStyle para el resaltado de sintaxis
 * @param {string} theme - Nombre del tema
 * @param {object} customThemeColors - Colores personalizados (solo para tema 'custom')
 * @returns {HighlightStyle} HighlightStyle para syntax highlighting
 */
const getHighlightStyle = (theme, customThemeColors = null) => {
  switch (theme) {
    case 'custom':
      const colors = customThemeColors || DEFAULT_CUSTOM_THEME_COLORS;
      return HighlightStyle.define([
        { tag: tags.keyword, color: colors.keywordColor },
        { tag: tags.string, color: colors.stringColor },
        { tag: tags.definition(tags.variableName), color: colors.variableColor }, // Variables definidas
        { tag: tags.variableName, color: colors.variableColor }, // Variables en uso
        { tag: tags.constant(tags.variableName), color: colors.variableColor },
        { tag: tags.comment, color: colors.commentColor },
        { tag: tags.number, color: colors.numberColor },
        { tag: tags.function(tags.variableName), color: colors.functionColor },
        { tag: tags.typeName, color: colors.typeColor },
        { tag: tags.propertyName, color: colors.propertyColor },
        { tag: tags.operator, color: colors.operatorColor },
        { tag: tags.meta, color: colors.metaColor },
        { tag: tags.bracket, color: colors.bracketColor },
        { tag: tags.tagName, color: colors.tagColor },
        { tag: tags.attributeName, color: colors.attributeColor },
      ]);
    case 'notion':
      return HighlightStyle.define([
        { tag: tags.keyword, color: '#4A9EFF' },
        { tag: tags.string, color: '#FFD700' },
        { tag: tags.variableName, color: '#FFFFFF' },
        { tag: tags.constant(tags.variableName), color: '#FFFFFF' },
        { tag: tags.comment, color: '#6A9955' },
        { tag: tags.number, color: '#B5CEA8' },
        { tag: tags.function(tags.variableName), color: '#DCDCAA' },
        { tag: tags.typeName, color: '#4EC9B0' },
        { tag: tags.propertyName, color: '#FFFFFF' },
        { tag: tags.operator, color: '#D4D4D4' },
        { tag: tags.meta, color: '#4A9EFF' },
        { tag: tags.bracket, color: '#D4D4D4' },
        { tag: tags.tagName, color: '#4A9EFF' },
        { tag: tags.attributeName, color: '#FFFFFF' },
      ]);
    case 'oneDark':
      return HighlightStyle.define([
        { tag: tags.keyword, color: '#569cd6' }, // const, let, function, etc. (azul)
        { tag: tags.string, color: '#ce9178' },
        { tag: tags.comment, color: '#6a9955' },
        { tag: tags.number, color: '#b5cea8' },
        { tag: tags.function(tags.variableName), color: '#dcdcaa' },
        { tag: tags.definition(tags.variableName), color: '#9cdcfe' }, // Variables definidas (cyan claro)
        { tag: tags.variableName, color: '#9cdcfe' }, // Variables en uso (cyan claro)
        { tag: tags.typeName, color: '#4ec9b0' },
        { tag: tags.propertyName, color: '#9cdcfe' },
        { tag: tags.operator, color: '#d4d4d4' },
        { tag: tags.meta, color: '#569cd6' },
        { tag: tags.bracket, color: '#d4d4d4' },
        { tag: tags.tagName, color: '#569cd6' },
        { tag: tags.attributeName, color: '#9cdcfe' },
      ]);
    case 'cursorDark':
      // IMPORTANTE: En HighlightStyle, las reglas más específicas deben ir DESPUÉS
      // para tener mayor precedencia. Pero tags.keyword debe estar bien definido.
      return HighlightStyle.define([
        // Strings primero (más específico)
        { tag: tags.string, color: '#ce9178' },
        // Comentarios
        { tag: tags.comment, color: '#6a9955' },
        // Números
        { tag: tags.number, color: '#b5cea8' },
        // Funciones
        { tag: tags.function(tags.variableName), color: '#dcdcaa' },
        // Variables definidas - DEBE ir ANTES de variableName para tener prioridad
        { tag: tags.definition(tags.variableName), color: '#9cdcfe' }, // Variables definidas (cyan claro)
        { tag: tags.local(tags.variableName), color: '#9cdcfe' }, // Variables locales definidas
        // Variables en uso - DEBE ir DESPUÉS de definition para que definition tenga prioridad
        { tag: tags.variableName, color: '#9cdcfe' }, // Variables en uso (cyan claro) - DIFERENTE de keyword azul
        // Keywords AL FINAL para asegurar que tengan prioridad sobre otros tags
        { tag: tags.keyword, color: '#569cd6' }, // const, let, function, etc. (azul #569cd6) - DEBE ser diferente
        // Tipos
        { tag: tags.typeName, color: '#4ec9b0' },
        // Propiedades
        { tag: tags.propertyName, color: '#9cdcfe' },
        // Operadores
        { tag: tags.operator, color: '#d4d4d4' },
        // Meta
        { tag: tags.meta, color: '#569cd6' },
        // Brackets
        { tag: tags.bracket, color: '#d4d4d4' },
        // Tags HTML
        { tag: tags.tagName, color: '#569cd6' },
        // Atributos
        { tag: tags.attributeName, color: '#9cdcfe' },
      ]);
    case 'light':
      return HighlightStyle.define([
        { tag: tags.keyword, color: '#0000ff' },
        { tag: tags.string, color: '#008000' },
        { tag: tags.comment, color: '#808080' },
        { tag: tags.number, color: '#098658' },
        { tag: tags.function(tags.variableName), color: '#795e26' },
        { tag: tags.variableName, color: '#001080' },
        { tag: tags.typeName, color: '#267f99' },
        { tag: tags.propertyName, color: '#001080' },
        { tag: tags.operator, color: '#000000' },
        { tag: tags.meta, color: '#0000ff' },
        { tag: tags.bracket, color: '#000000' },
        { tag: tags.tagName, color: '#800000' },
        { tag: tags.attributeName, color: '#ff0000' },
      ]);
    case 'monokai':
      return HighlightStyle.define([
        { tag: tags.keyword, color: '#f92672' },
        { tag: tags.string, color: '#e6db74' },
        { tag: tags.comment, color: '#75715e' },
        { tag: tags.number, color: '#ae81ff' },
        { tag: tags.function(tags.variableName), color: '#a6e22e' },
        { tag: tags.variableName, color: '#f8f8f2' },
        { tag: tags.typeName, color: '#66d9ef' },
        { tag: tags.propertyName, color: '#a6e22e' },
        { tag: tags.operator, color: '#f8f8f2' },
        { tag: tags.meta, color: '#f92672' },
        { tag: tags.bracket, color: '#f8f8f2' },
        { tag: tags.tagName, color: '#f92672' },
        { tag: tags.attributeName, color: '#a6e22e' },
      ]);
    case 'dracula':
      return HighlightStyle.define([
        { tag: tags.keyword, color: '#ff79c6' },
        { tag: tags.string, color: '#f1fa8c' },
        { tag: tags.comment, color: '#6272a4' },
        { tag: tags.number, color: '#bd93f9' },
        { tag: tags.function(tags.variableName), color: '#50fa7b' },
        { tag: tags.variableName, color: '#8be9fd' },
        { tag: tags.typeName, color: '#8be9fd' },
        { tag: tags.propertyName, color: '#50fa7b' },
        { tag: tags.operator, color: '#ff79c6' },
        { tag: tags.meta, color: '#ff79c6' },
        { tag: tags.bracket, color: '#f8f8f2' },
        { tag: tags.tagName, color: '#ff79c6' },
        { tag: tags.attributeName, color: '#50fa7b' },
      ]);
    case 'tokyoNight':
      return HighlightStyle.define([
        { tag: tags.keyword, color: '#bb9af7' },
        { tag: tags.string, color: '#9ece6a' },
        { tag: tags.comment, color: '#565f89' },
        { tag: tags.number, color: '#ff9e64' },
        { tag: tags.function(tags.variableName), color: '#7aa2f7' },
        { tag: tags.variableName, color: '#c0caf5' },
        { tag: tags.typeName, color: '#7aa2f7' },
        { tag: tags.propertyName, color: '#9ece6a' },
        { tag: tags.operator, color: '#c0caf5' },
        { tag: tags.meta, color: '#bb9af7' },
        { tag: tags.bracket, color: '#c0caf5' },
        { tag: tags.tagName, color: '#f7768e' },
        { tag: tags.attributeName, color: '#9ece6a' },
      ]);
    default:
      // Por defecto, usar oneDark
      return HighlightStyle.define([
        { tag: tags.keyword, color: '#569cd6' },
        { tag: tags.string, color: '#ce9178' },
        { tag: tags.comment, color: '#6a9955' },
        { tag: tags.number, color: '#b5cea8' },
        { tag: tags.function(tags.variableName), color: '#dcdcaa' },
        { tag: tags.variableName, color: '#9cdcfe' },
        { tag: tags.typeName, color: '#4ec9b0' },
        { tag: tags.propertyName, color: '#9cdcfe' },
        { tag: tags.operator, color: '#d4d4d4' },
        { tag: tags.meta, color: '#569cd6' },
        { tag: tags.bracket, color: '#d4d4d4' },
        { tag: tags.tagName, color: '#569cd6' },
        { tag: tags.attributeName, color: '#9cdcfe' },
      ]);
  }
};

/**
 * Obtiene la extensión del tema para CodeMirror
 * Retorna un array con el theme y el syntax highlighting
 * @param {string} theme - Nombre del tema
 * @param {object} customThemeColors - Colores personalizados (solo para tema 'custom')
 * @returns {Array<Extension>} Array con [themeExtension, syntaxHighlightingExtension]
 */
export const getThemeExtension = (theme, customThemeColors = null) => {
  // Obtener el highlight style para el resaltado de sintaxis
  const highlightStyle = getHighlightStyle(theme, customThemeColors);
  
  switch (theme) {
    case 'custom':
      // Si no se proporcionan colores personalizados, usar los valores por defecto
      const colors = customThemeColors || DEFAULT_CUSTOM_THEME_COLORS;
      // Retornar array con theme y syntax highlighting
      return [
        EditorView.theme({
          '&': {
            backgroundColor: `${colors.backgroundColor} !important`,
            color: `${colors.textColor} !important`,
          },
          '.cm-content': {
            backgroundColor: `${colors.backgroundColor} !important`,
            color: `${colors.textColor} !important`,
            caretColor: colors.caretColor,
          },
          '.cm-gutters': {
            backgroundColor: `${colors.gutterColor} !important`,
            color: `${colors.gutterTextColor} !important`,
            border: 'none',
          },
          '.cm-lineNumbers': {
            color: `${colors.gutterTextColor} !important`,
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'transparent',
            color: `${colors.activeLineGutterColor} !important`,
            fontWeight: 'normal',
          },
          '.cm-line': {
            color: `${colors.textColor} !important`,
          },
          '.cm-selectionBackground': { backgroundColor: `${colors.selectionBackground} !important` },
          '.cm-focused .cm-selectionBackground': { backgroundColor: `${colors.selectionBackground} !important` },
          '.cm-cursor': { borderLeftColor: colors.cursorColor },
          '.cm-matchingBracket': {
            backgroundColor: 'rgba(255, 255, 0, 0.3)',
            outline: '2px solid rgba(255, 255, 0, 0.5)',
          },
          '.cm-nonmatchingBracket': {
            backgroundColor: 'rgba(255, 0, 0, 0.3)',
          },
        }, { dark: true }),
        syntaxHighlighting(highlightStyle)
      ];

    case 'notion':
      return [
        EditorView.theme({
          '&': {
            backgroundColor: '#1E1E1E !important',
            color: '#FFFFFF !important',
          },
          '.cm-content': {
            backgroundColor: '#1E1E1E !important',
            color: '#FFFFFF !important',
            caretColor: '#AEAFAD',
          },
          '.cm-gutters': {
            backgroundColor: '#1E1E1E !important',
            color: '#858585 !important',
            border: 'none',
          },
          '.cm-lineNumbers': {
            color: '#858585 !important',
          },
          '.cm-line': {
            color: '#FFFFFF !important',
          },
          '.cm-selectionBackground': { backgroundColor: 'rgba(173, 214, 255, 0.4) !important' },
          '.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(173, 214, 255, 0.4) !important' },
          '.cm-cursor': { borderLeftColor: '#AEAFAD' },
          '.cm-matchingBracket': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            outline: '1px solid rgba(255, 255, 255, 0.2)',
          },
          '.cm-nonmatchingBracket': {
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
          },
        }, { dark: true }),
        syntaxHighlighting(highlightStyle)
      ];

    case 'oneDark':
      return [
        EditorView.theme({
          '&': {
            backgroundColor: '#1e1e1e !important',
            color: '#d4d4d4 !important',
          },
          '.cm-content': {
            backgroundColor: '#1e1e1e !important',
            color: '#d4d4d4 !important',
            caretColor: '#aeafad',
          },
          '.cm-gutters': {
            backgroundColor: '#1e1e1e !important',
            color: '#858585 !important',
            border: 'none',
          },
          '.cm-lineNumbers': {
            color: '#858585 !important',
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'transparent',
            color: '#c6c6c6 !important',
            fontWeight: 'normal',
          },
          '.cm-line': {
            color: '#d4d4d4 !important',
          },
          '.cm-selectionBackground': { backgroundColor: 'rgba(173, 214, 255, 0.4) !important' },
          '.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(173, 214, 255, 0.4) !important' },
          '.cm-cursor': { borderLeftColor: '#aeafad' },
          '.cm-matchingBracket': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            outline: '1px solid rgba(255, 255, 255, 0.2)',
          },
          '.cm-nonmatchingBracket': {
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
          },
        }, { dark: true }),
        syntaxHighlighting(highlightStyle)
      ];

    case 'cursorDark':
      // Plugin para forzar colores en keywords que el parser no está marcando correctamente
      const keywordColorPlugin = ViewPlugin.fromClass(class {
        decorations = Decoration.none;
        
        update(update) {
          // Actualizar siempre para asegurar que se aplican los colores
          const decorations = [];
          const tree = syntaxTree(update.state);
          // Lista completa de keywords de JavaScript/TypeScript
          const keywordTexts = new Set([
            'const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while', 
            'return', 'import', 'export', 'from', 'as', 'type', 'interface', 'enum',
            'this', 'new', 'extends', 'implements', 'static', 'async', 'await', 'try',
            'catch', 'finally', 'throw', 'switch', 'case', 'default', 'break', 'continue',
            'do', 'with', 'in', 'of', 'instanceof', 'typeof', 'void', 'delete',
            'true', 'false', 'null', 'undefined', 'NaN', 'Infinity'
          ]);
          
          // Detectar keywords por nombre de nodo del árbol de sintaxis
          const keywordNodeNames = ['Const', 'Let', 'Var', 'Function', 'Class', 'If', 'Else', 
                                   'For', 'While', 'Return', 'Import', 'Export', 'From', 'As', 
                                   'Type', 'Interface', 'Enum', 'Keyword', 'This', 'New', 'Extends',
                                   'Implements', 'Static', 'Async', 'Await', 'Try', 'Catch', 'Finally',
                                   'Throw', 'Switch', 'Case', 'Default', 'Break', 'Continue', 'Do',
                                   'With', 'In', 'Of', 'Instanceof', 'Typeof', 'Void', 'Delete',
                                   'True', 'False', 'Null', 'Undefined', 'NaN', 'Infinity'];
          
          tree.iterate({
            enter(node) {
              const text = update.state.doc.sliceString(node.from, node.to);
              const textLower = text.toLowerCase();
              
              // Si el nodo tiene un nombre de keyword O el texto es un keyword conocido
              if (keywordNodeNames.includes(node.name) || keywordTexts.has(textLower)) {
                decorations.push(
                  Decoration.mark({
                    class: 'cm-keyword-forced',
                    attributes: { style: 'color: #569cd6 !important' }
                  }).range(node.from, node.to)
                );
              }
            }
          });
          
          this.decorations = Decoration.set(decorations);
        }
      }, {
        decorations: v => v.decorations
      });
      
      return [
        EditorView.theme({
          '&': {
            backgroundColor: '#1e1e1e !important',
            color: '#d4d4d4 !important',
          },
          '.cm-content': {
            backgroundColor: '#1e1e1e !important',
            color: '#d4d4d4 !important',
            caretColor: '#aeafad',
          },
          '.cm-gutters': {
            backgroundColor: '#252526 !important',
            color: '#858585 !important',
            border: 'none',
          },
          '.cm-lineNumbers': {
            color: '#858585 !important',
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'transparent',
            color: '#c6c6c6 !important',
            fontWeight: 'normal',
          },
          '.cm-line': {
            color: '#d4d4d4 !important',
          },
          '.cm-selectionBackground': { backgroundColor: 'rgba(173, 214, 255, 0.4) !important' },
          '.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(173, 214, 255, 0.4) !important' },
          '.cm-cursor': { borderLeftColor: '#aeafad' },
          '.cm-matchingBracket': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            outline: '1px solid rgba(255, 255, 255, 0.2)',
          },
          '.cm-nonmatchingBracket': {
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
          },
          // Forzar color azul para keywords
          '.cm-keyword-forced': {
            color: '#569cd6 !important',
          },
        }, { dark: true }),
        syntaxHighlighting(highlightStyle),
        // El plugin debe ir DESPUÉS de syntaxHighlighting para tener prioridad
        keywordColorPlugin
      ];

    case 'monokai':
      return [
        EditorView.theme({
          '&': {
            backgroundColor: '#272822 !important',
            color: '#f8f8f2 !important',
          },
          '.cm-content': {
            backgroundColor: '#272822 !important',
            color: '#f8f8f2 !important',
            caretColor: '#f8f8f2',
          },
          '.cm-gutters': {
            backgroundColor: '#272822 !important',
            color: '#75715e !important',
            border: 'none',
          },
          '.cm-lineNumbers': {
            color: '#75715e !important',
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'transparent',
            color: '#f8f8f2 !important',
            fontWeight: 'normal',
          },
          '.cm-line': {
            color: '#f8f8f2 !important',
          },
          '.cm-selectionBackground': { backgroundColor: 'rgba(255, 255, 255, 0.2) !important' },
          '.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(255, 255, 255, 0.2) !important' },
          '.cm-cursor': { borderLeftColor: '#f8f8f2' },
          '.cm-matchingBracket': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            outline: '1px solid rgba(255, 255, 255, 0.2)',
          },
          '.cm-nonmatchingBracket': {
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
          },
        }, { dark: true }),
        syntaxHighlighting(highlightStyle)
      ];

    case 'dracula':
      return [
        EditorView.theme({
          '&': {
            backgroundColor: '#282a36 !important',
            color: '#f8f8f2 !important',
          },
          '.cm-content': {
            backgroundColor: '#282a36 !important',
            color: '#f8f8f2 !important',
            caretColor: '#f8f8f2',
          },
          '.cm-gutters': {
            backgroundColor: '#282a36 !important',
            color: '#6272a4 !important',
            border: 'none',
          },
          '.cm-lineNumbers': {
            color: '#6272a4 !important',
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'transparent',
            color: '#f8f8f2 !important',
            fontWeight: 'normal',
          },
          '.cm-line': {
            color: '#f8f8f2 !important',
          },
          '.cm-selectionBackground': { backgroundColor: 'rgba(255, 255, 255, 0.2) !important' },
          '.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(255, 255, 255, 0.2) !important' },
          '.cm-cursor': { borderLeftColor: '#f8f8f2' },
          '.cm-matchingBracket': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            outline: '1px solid rgba(255, 255, 255, 0.2)',
          },
          '.cm-nonmatchingBracket': {
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
          },
        }, { dark: true }),
        syntaxHighlighting(highlightStyle)
      ];

    case 'tokyoNight':
      return [
        EditorView.theme({
          '&': {
            backgroundColor: '#1a1b26 !important',
            color: '#c0caf5 !important',
          },
          '.cm-content': {
            backgroundColor: '#1a1b26 !important',
            color: '#c0caf5 !important',
            caretColor: '#c0caf5',
          },
          '.cm-gutters': {
            backgroundColor: '#1a1b26 !important',
            color: '#565f89 !important',
            border: 'none',
          },
          '.cm-lineNumbers': {
            color: '#565f89 !important',
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'transparent',
            color: '#c0caf5 !important',
            fontWeight: 'normal',
          },
          '.cm-line': {
            color: '#c0caf5 !important',
          },
          '.cm-selectionBackground': { backgroundColor: 'rgba(255, 255, 255, 0.2) !important' },
          '.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(255, 255, 255, 0.2) !important' },
          '.cm-cursor': { borderLeftColor: '#c0caf5' },
          '.cm-matchingBracket': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            outline: '1px solid rgba(255, 255, 255, 0.2)',
          },
          '.cm-nonmatchingBracket': {
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
          },
        }, { dark: true }),
        syntaxHighlighting(highlightStyle)
      ];

    case 'light':
      return [
        EditorView.theme({
          '&': {
            backgroundColor: '#ffffff !important',
            color: '#333333 !important',
          },
          '.cm-content': {
            backgroundColor: '#ffffff !important',
            color: '#333333 !important',
            caretColor: '#333333',
          },
          '.cm-gutters': {
            backgroundColor: '#f5f5f5 !important',
            color: '#999999 !important',
            border: 'none',
          },
          '.cm-lineNumbers': {
            color: '#999999 !important',
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'transparent',
            color: '#666666 !important',
            fontWeight: 'normal',
          },
          '.cm-line': {
            color: '#333333 !important',
          },
          '.cm-selectionBackground': { backgroundColor: 'rgba(0, 0, 255, 0.2) !important' },
          '.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(0, 0, 255, 0.2) !important' },
          '.cm-cursor': { borderLeftColor: '#333333' },
          '.cm-matchingBracket': {
            backgroundColor: 'rgba(0, 0, 255, 0.1)',
            outline: '1px solid rgba(0, 0, 255, 0.2)',
          },
          '.cm-nonmatchingBracket': {
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
          },
        }, { dark: false }),
        syntaxHighlighting(highlightStyle)
      ];

    default:
      // Por defecto, usar oneDark
      return [
        EditorView.theme({
          '&': {
            backgroundColor: '#1e1e1e !important',
            color: '#d4d4d4 !important',
          },
          '.cm-content': {
            backgroundColor: '#1e1e1e !important',
            color: '#d4d4d4 !important',
            caretColor: '#aeafad',
          },
          '.cm-gutters': {
            backgroundColor: '#1e1e1e !important',
            color: '#858585 !important',
            border: 'none',
          },
          '.cm-lineNumbers': {
            color: '#858585 !important',
          },
          '.cm-activeLineGutter': {
            backgroundColor: 'transparent',
            color: '#c6c6c6 !important',
            fontWeight: 'normal',
          },
          '.cm-line': {
            color: '#d4d4d4 !important',
          },
          '.cm-selectionBackground': { backgroundColor: 'rgba(173, 214, 255, 0.4) !important' },
          '.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(173, 214, 255, 0.4) !important' },
          '.cm-cursor': { borderLeftColor: '#aeafad' },
          '.cm-matchingBracket': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            outline: '1px solid rgba(255, 255, 255, 0.2)',
          },
          '.cm-nonmatchingBracket': {
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
          },
        }, { dark: true }),
        syntaxHighlighting(highlightStyle)
      ];
  }
};

/**
 * Carga los colores personalizados desde la base de datos
 * @returns {Promise<object>} Colores personalizados
 */
export const loadCustomThemeColors = async () => {
  try {
    const savedColors = await LocalStorageService.readJSONFile(
      'custom-theme-colors.json',
      'data'
    );
    
    if (savedColors && savedColors.colors) {
      return {
        ...DEFAULT_CUSTOM_THEME_COLORS,
        ...savedColors.colors
      };
    }
  } catch (error) {
    // Si no existe, usar los valores por defecto
  }
  
  return DEFAULT_CUSTOM_THEME_COLORS;
};

/**
 * Guarda los colores personalizados en la base de datos
 * @param {object} colors - Colores personalizados a guardar
 * @returns {Promise<boolean>} true si se guardó correctamente
 */
export const saveCustomThemeColors = async (colors) => {
  try {
    await LocalStorageService.saveJSONFile(
      'custom-theme-colors.json',
      {
        colors,
        updatedAt: new Date().toISOString()
      },
      'data'
    );
    return true;
  } catch (error) {
    console.error('Error guardando colores personalizados:', error);
    return false;
  }
};
