/**
 * Servicio para exportar páginas a diferentes formatos (PDF, Markdown, HTML)
 */

import LocalStorageService from './LocalStorageService';

class ExportService {
  /**
   * Convierte el contenido JSON de TipTap a Markdown
   */
  async convertToMarkdown(content, pageTitle = '') {
    if (!content || !content.content) return '';

    let markdown = '';
    
    // Agregar título si existe
    if (pageTitle) {
      markdown += `# ${pageTitle}\n\n`;
    }

    const processNode = async (node) => {
      if (!node) return '';

      switch (node.type) {
        case 'paragraph':
          if (!node.content || node.content.length === 0) {
            return '\n';
          }
          const paraText = await Promise.all(
            node.content.map(async (child) => await processNode(child))
          );
          return paraText.join('') + '\n\n';

        case 'heading':
          const level = node.attrs?.level || 1;
          const headingText = await Promise.all(
            (node.content || []).map(async (child) => await processNode(child))
          );
          return '#'.repeat(level) + ' ' + headingText.join('') + '\n\n';

        case 'text':
          let text = node.text || '';
          // Aplicar marcas de formato
          if (node.marks) {
            node.marks.forEach(mark => {
              switch (mark.type) {
                case 'bold':
                  text = `**${text}**`;
                  break;
                case 'italic':
                  text = `*${text}*`;
                  break;
                case 'underline':
                  text = `<u>${text}</u>`;
                  break;
                case 'code':
                  text = `\`${text}\``;
                  break;
                case 'link':
                  const href = mark.attrs?.href || '';
                  text = `[${text}](${href})`;
                  break;
              }
            });
          }
          return text;

        case 'hardBreak':
          return '\n';

        case 'codeBlock':
          const codeText = await Promise.all(
            (node.content || []).map(async (child) => await processNode(child))
          );
          const language = node.attrs?.language || '';
          return '```' + language + '\n' + codeText.join('') + '\n```\n\n';

        case 'blockquote':
          const quoteText = await Promise.all(
            (node.content || []).map(async (child) => await processNode(child))
          );
          return quoteText.map(line => '> ' + line.trim()).join('\n') + '\n\n';

        case 'bulletList':
          const bulletItems = await Promise.all(
            (node.content || []).map(async (child) => await processNode(child))
          );
          return bulletItems.join('') + '\n';

        case 'orderedList':
          const orderedItems = await Promise.all(
            (node.content || []).map(async (child) => await processNode(child))
          );
          return orderedItems.join('') + '\n';

        case 'listItem':
          const itemText = await Promise.all(
            (node.content || []).map(async (child) => await processNode(child))
          );
          // Determinar el prefijo basado en el tipo de lista padre
          // Por defecto usar bullet list
          const prefix = '- ';
          return prefix + itemText.join('').trim() + '\n';

        case 'image':
          const src = node.attrs?.src || '';
          const alt = node.attrs?.alt || '';
          const filename = node.attrs?.['data-filename'] || '';
          
          // Intentar obtener URL de la imagen
          let imageUrl = src;
          if (filename) {
            try {
              const url = await LocalStorageService.getFileURL(filename, 'files');
              if (url) {
                // Para Markdown, usar la URL blob o convertir a base64
                imageUrl = url;
              }
            } catch (error) {
              // Error al cargar imagen
            }
          }
          
          return `![${alt}](${imageUrl})\n\n`;

        case 'table':
          const tableRows = await Promise.all(
            (node.content || []).map(async (row) => await processNode(row))
          );
          return tableRows.join('') + '\n';

        case 'tableRow':
          const cells = await Promise.all(
            (node.content || []).map(async (cell) => await processNode(cell))
          );
          return '| ' + cells.join(' | ') + ' |\n';

        case 'tableCell':
        case 'tableHeader':
          const cellText = await Promise.all(
            (node.content || []).map(async (child) => await processNode(child))
          );
          return cellText.join('').trim();

        case 'horizontalRule':
          return '---\n\n';

        case 'toggle':
          const toggleTitle = node.attrs?.title || 'Toggle';
          const toggleContent = await Promise.all(
            (node.content || []).map(async (child) => await processNode(child))
          );
          return `<details>\n<summary>${toggleTitle}</summary>\n\n${toggleContent.join('')}\n</details>\n\n`;

        default:
          // Para nodos personalizados o desconocidos, intentar procesar su contenido
          if (node.content && Array.isArray(node.content)) {
            const defaultText = await Promise.all(
              node.content.map(async (child) => await processNode(child))
            );
            return defaultText.join('');
          }
          return '';
      }
    };

    const processed = await Promise.all(
      content.content.map(async (node) => await processNode(node))
    );
    
    markdown += processed.join('');
    return markdown.trim();
  }

  /**
   * Convierte el contenido JSON de TipTap a HTML
   */
  async convertToHTML(content, pageTitle = '') {
    if (!content || !content.content) return '';

    let html = '<!DOCTYPE html>\n<html lang="es">\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    html += `<title>${this.escapeHtml(pageTitle || 'Página')}</title>\n`;
    html += `<style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        line-height: 1.6;
        color: #333;
      }
      h1, h2, h3, h4, h5, h6 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: 600;
      }
      h1 { font-size: 2em; }
      h2 { font-size: 1.5em; }
      h3 { font-size: 1.25em; }
      p { margin: 1em 0; }
      img { max-width: 100%; height: auto; }
      table { border-collapse: collapse; width: 100%; margin: 1em 0; }
      table td, table th { border: 1px solid #ddd; padding: 8px; text-align: left; }
      table th { background-color: #f2f2f2; font-weight: 600; }
      table tbody tr:nth-child(even) { background-color: #f9f9f9; }
      table tbody tr:hover { background-color: #f5f5f5; }
      code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
      pre { background-color: #f4f4f4; padding: 1em; border-radius: 5px; overflow-x: auto; }
      blockquote { border-left: 4px solid #ddd; padding-left: 1em; margin: 1em 0; }
      ul, ol { margin: 1em 0; padding-left: 2em; }
      a { color: #0066cc; text-decoration: none; }
      a:hover { text-decoration: underline; }
    </style>\n`;
    html += '</head>\n<body>\n';

    // Agregar título si existe
    if (pageTitle) {
      html += `<h1>${this.escapeHtml(pageTitle)}</h1>\n`;
    }

    const processNode = async (node) => {
      if (!node) return '';

      switch (node.type) {
        case 'paragraph':
          if (!node.content || node.content.length === 0) {
            return '<p></p>\n';
          }
          const paraContent = await Promise.all(
            node.content.map(async (child) => await processNode(child))
          );
          return '<p>' + paraContent.join('') + '</p>\n';

        case 'heading':
          const level = node.attrs?.level || 1;
          const headingContent = await Promise.all(
            (node.content || []).map(async (child) => await processNode(child))
          );
          return `<h${level}>${headingContent.join('')}</h${level}>\n`;

        case 'text':
          let text = this.escapeHtml(node.text || '');
          // Aplicar marcas de formato
          if (node.marks) {
            node.marks.forEach(mark => {
              switch (mark.type) {
                case 'bold':
                  text = `<strong>${text}</strong>`;
                  break;
                case 'italic':
                  text = `<em>${text}</em>`;
                  break;
                case 'underline':
                  text = `<u>${text}</u>`;
                  break;
                case 'code':
                  text = `<code>${text}</code>`;
                  break;
                case 'link':
                  const href = mark.attrs?.href || '#';
                  text = `<a href="${this.escapeHtml(href)}">${text}</a>`;
                  break;
              }
            });
          }
          return text;

        case 'hardBreak':
          return '<br>';

        case 'codeBlock':
          const codeContent = await Promise.all(
            (node.content || []).map(async (child) => await processNode(child))
          );
          const language = node.attrs?.language || '';
          return `<pre><code class="language-${language}">${this.escapeHtml(codeContent.join(''))}</code></pre>\n`;

        case 'blockquote':
          const quoteContent = await Promise.all(
            (node.content || []).map(async (child) => await processNode(child))
          );
          return `<blockquote>${quoteContent.join('')}</blockquote>\n`;

        case 'bulletList':
          const bulletItems = await Promise.all(
            (node.content || []).map(async (child) => await processNode(child))
          );
          return `<ul>${bulletItems.join('')}</ul>\n`;

        case 'orderedList':
          const orderedItems = await Promise.all(
            (node.content || []).map(async (child) => await processNode(child))
          );
          return `<ol>${orderedItems.join('')}</ol>\n`;

        case 'listItem':
          const itemContent = await Promise.all(
            (node.content || []).map(async (child) => await processNode(child))
          );
          return `<li>${itemContent.join('')}</li>`;

        case 'image':
          const src = node.attrs?.src || '';
          const alt = node.attrs?.alt || '';
          const filename = node.attrs?.['data-filename'] || '';
          
          // Intentar obtener URL de la imagen
          let imageUrl = src;
          if (filename) {
            try {
              const url = await LocalStorageService.getFileURL(filename, 'files');
              if (url) {
                imageUrl = url;
              }
            } catch (error) {
              // Error al cargar imagen
            }
          }
          
          return `<img src="${this.escapeHtml(imageUrl)}" alt="${this.escapeHtml(alt)}" />\n`;

        case 'table':
          const tableRows = await Promise.all(
            (node.content || []).map(async (row) => await processNode(row))
          );
          return `<table>${tableRows.join('')}</table>\n`;

        case 'tableRow':
          const cells = await Promise.all(
            (node.content || []).map(async (cell) => await processNode(cell))
          );
          return `<tr>${cells.join('')}</tr>`;

        case 'tableCell':
          const cellContent = await Promise.all(
            (node.content || []).map(async (child) => await processNode(child))
          );
          return `<td>${cellContent.join('')}</td>`;

        case 'tableHeader':
          const headerContent = await Promise.all(
            (node.content || []).map(async (child) => await processNode(child))
          );
          return `<th>${headerContent.join('')}</th>`;

        case 'tablaNotion':
          // Convertir tabla Notion a HTML estándar
          // Los atributos pueden venir como arrays o como strings JSON
          let propiedades = node.attrs?.propiedades || [];
          let filas = node.attrs?.filas || [];
          const nombreTabla = node.attrs?.nombreTabla || '';
          
          // Si propiedades es un string, parsearlo
          if (typeof propiedades === 'string') {
            try {
              propiedades = JSON.parse(propiedades);
            } catch (e) {
              console.error('Error parseando propiedades:', e);
              propiedades = [];
            }
          }
          
          // Si filas es un string, parsearlo
          if (typeof filas === 'string') {
            try {
              filas = JSON.parse(filas);
            } catch (e) {
              console.error('Error parseando filas:', e);
              filas = [];
            }
          }
          
          // Asegurar que sean arrays
          if (!Array.isArray(propiedades)) {
            propiedades = [];
          }
          if (!Array.isArray(filas)) {
            filas = [];
          }
          
          console.log('Tabla Notion - propiedades:', propiedades.length, 'filas:', filas.length);
          console.log('Tabla Notion - nombreTabla:', nombreTabla);
          console.log('Tabla Notion - node.attrs:', JSON.stringify(node.attrs, null, 2).substring(0, 500));
          
          let tablaHTML = '';
          
          // Agregar nombre de la tabla si existe
          if (nombreTabla) {
            tablaHTML += `<h3>${this.escapeHtml(nombreTabla)}</h3>\n`;
          }
          
          // Si no hay propiedades o filas, mostrar mensaje
          if (propiedades.length === 0 && filas.length === 0) {
            tablaHTML += '<p style="color: #999; font-style: italic;">Tabla vacía</p>\n';
            return tablaHTML;
          }
          
          tablaHTML += '<table style="border-collapse: collapse; width: 100%; margin: 1em 0;">\n';
          
          // Encabezados
          if (propiedades.length > 0) {
            tablaHTML += '<thead><tr>\n';
            propiedades.forEach(prop => {
              if (prop.visible !== false) {
                tablaHTML += `<th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">${this.escapeHtml(prop.name || '')}</th>\n`;
              }
            });
            tablaHTML += '</tr></thead>\n';
          }
          
          // Filas
          tablaHTML += '<tbody>\n';
          if (filas.length > 0) {
            filas.forEach(fila => {
              tablaHTML += '<tr>\n';
              propiedades.forEach(prop => {
                if (prop.visible !== false) {
                  const propName = prop.name || '';
                  let valor = '';
                  
                  // Obtener el valor de la propiedad
                  if (fila.properties && fila.properties[propName]) {
                    const propData = fila.properties[propName];
                    valor = propData.value !== undefined && propData.value !== null ? propData.value : '';
                  } else if (fila[propName] !== undefined && fila[propName] !== null) {
                    valor = fila[propName];
                  }
                  
                  // Formatear el valor según el tipo
                  let valorFormateado = '';
                  if (Array.isArray(valor)) {
                    valorFormateado = valor.join(', ');
                  } else if (typeof valor === 'object' && valor !== null) {
                    valorFormateado = JSON.stringify(valor);
                  } else if (prop.type === 'date' && valor) {
                    // Formatear fecha
                    try {
                      const fecha = new Date(valor);
                      valorFormateado = fecha.toLocaleDateString('es-ES');
                    } catch (e) {
                      valorFormateado = String(valor);
                    }
                  } else if (prop.type === 'checkbox') {
                    valorFormateado = valor ? '✓' : '';
                  } else if (prop.type === 'image' && valor) {
                    // Para imágenes, mostrar el nombre del archivo o un indicador
                    valorFormateado = '[Imagen]';
                  } else {
                    valorFormateado = String(valor || '');
                  }
                  
                  tablaHTML += `<td style="border: 1px solid #ddd; padding: 8px;">${this.escapeHtml(valorFormateado)}</td>\n`;
                }
              });
              tablaHTML += '</tr>\n';
            });
          } else {
            // Si no hay filas, mostrar una fila vacía
            tablaHTML += '<tr>';
            propiedades.forEach(prop => {
              if (prop.visible !== false) {
                tablaHTML += '<td style="border: 1px solid #ddd; padding: 8px;"></td>';
              }
            });
            tablaHTML += '</tr>';
          }
          tablaHTML += '</tbody>\n';
          tablaHTML += '</table>\n';
          
          return tablaHTML;

        case 'horizontalRule':
          return '<hr>\n';

        case 'toggle':
          const toggleTitle = node.attrs?.title || 'Toggle';
          const toggleContent = await Promise.all(
            (node.content || []).map(async (child) => await processNode(child))
          );
          return `<details><summary>${this.escapeHtml(toggleTitle)}</summary>${toggleContent.join('')}</details>\n`;

        default:
          // Para nodos personalizados o desconocidos
          if (node.content && Array.isArray(node.content)) {
            const defaultContent = await Promise.all(
              node.content.map(async (child) => await processNode(child))
            );
            return defaultContent.join('');
          }
          return '';
      }
    };

    const processed = await Promise.all(
      content.content.map(async (node) => await processNode(node))
    );
    
    html += processed.join('');
    html += '</body>\n</html>';
    return html;
  }

  /**
   * Exporta el contenido a PDF usando html2pdf.js
   */
  async exportToPDF(content, pageTitle = '') {
    return new Promise(async (resolve, reject) => {
      let tempDiv = null;
      let tempIframe = null;
      
      try {
        // Convertir contenido a HTML primero
        const html = await this.convertToHTML(content, pageTitle);
        
        // Verificar que el HTML tenga contenido
        if (!html || html.trim() === '') {
          reject(new Error('No se pudo generar el contenido HTML'));
          return;
        }
        
        // Extraer el contenido del body del HTML
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        let bodyContent = bodyMatch ? bodyMatch[1] : null;
        
        // Si no se encuentra body, intentar extraer el contenido después de </head>
        if (!bodyContent) {
          const headEndMatch = html.match(/<\/head>\s*<body[^>]*>([\s\S]*)<\/body>/i);
          if (headEndMatch) {
            bodyContent = headEndMatch[1];
          } else {
            // Último recurso: extraer todo después de </head> hasta </body> o </html>
            const afterHead = html.match(/<\/head>([\s\S]*)/i);
            if (afterHead) {
              bodyContent = afterHead[1].replace(/<\/body>[\s\S]*$/i, '').replace(/<\/html>[\s\S]*$/i, '').trim();
            }
          }
        }
        
        // Si aún no hay contenido, usar el HTML completo
        const contentToUse = bodyContent || html;
        
        // Crear un elemento temporal para renderizar el HTML
        // Usar un contenedor con el contenido del body
        tempDiv = document.createElement('div');
        tempDiv.innerHTML = contentToUse;
        
        // Aplicar estilos para que el contenido sea visible y se renderice correctamente
        // html2canvas necesita que el elemento esté en el viewport visible
        tempDiv.style.position = 'fixed';
        tempDiv.style.top = '0';
        tempDiv.style.left = '0';
        tempDiv.style.width = '800px';
        tempDiv.style.maxWidth = '800px';
        tempDiv.style.minHeight = '100px'; // Asegurar altura mínima
        tempDiv.style.padding = '20px';
        tempDiv.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        tempDiv.style.lineHeight = '1.6';
        tempDiv.style.color = '#333';
        tempDiv.style.backgroundColor = '#ffffff';
        tempDiv.style.zIndex = '999999';
        tempDiv.style.opacity = '1';
        tempDiv.style.visibility = 'visible';
        tempDiv.style.pointerEvents = 'none';
        tempDiv.style.overflow = 'visible';
        tempDiv.style.boxSizing = 'border-box';
        tempDiv.style.display = 'block';
        // Mantener visible en el viewport para html2canvas
        document.body.appendChild(tempDiv);
        
        // Guardar posición de scroll original
        const originalScrollX = window.scrollX;
        const originalScrollY = window.scrollY;
        
        // Asegurar que el elemento esté visible para html2canvas
        window.scrollTo(0, 0);
        
        // Forzar reflow para asegurar que el navegador calcule las dimensiones
        void tempDiv.offsetHeight;

        // Esperar un momento para que el DOM se renderice completamente
        await new Promise(resolve => setTimeout(resolve, 300));

        // Esperar a que las imágenes se carguen
        const images = tempDiv.querySelectorAll('img');
        await Promise.all(
          Array.from(images).map(img => {
            return new Promise((imgResolve) => {
              if (img.complete && img.naturalHeight !== 0) {
                imgResolve();
              } else {
                img.onload = imgResolve;
                img.onerror = imgResolve; // Continuar aunque falle la imagen
                // Timeout de seguridad
                setTimeout(imgResolve, 5000);
              }
            });
          })
        );

        // Verificar que el contenido tenga algo
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        const innerHTML = tempDiv.innerHTML || '';
        
        console.log('Validación de contenido:');
        console.log('- TextContent length:', textContent.length);
        console.log('- InnerHTML length:', innerHTML.length);
        console.log('- TextContent preview:', textContent.substring(0, 200));
        console.log('- InnerHTML preview:', innerHTML.substring(0, 500));
        console.log('- Element children:', tempDiv.children.length);
        
        if (!textContent || textContent.trim() === '') {
          console.error('Contenido vacío para PDF.');
          console.error('HTML completo:', html.substring(0, 1000));
          console.error('ContentToUse:', contentToUse.substring(0, 1000));
          console.error('Content JSON:', JSON.stringify(content, null, 2).substring(0, 1000));
          if (tempDiv) document.body.removeChild(tempDiv);
          reject(new Error('El contenido está vacío'));
          return;
        }

        // Verificar que html2pdf esté disponible
        if (typeof window.html2pdf === 'undefined') {
          if (tempDiv) document.body.removeChild(tempDiv);
          reject(new Error('html2pdf.js no está disponible'));
          return;
        }

        // Esperar un frame más para asegurar que todo esté renderizado
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // Obtener dimensiones reales del contenido
        // Forzar un reflow completo antes de medir
        tempDiv.style.display = 'block';
        const contentWidth = tempDiv.scrollWidth || tempDiv.offsetWidth || 800;
        const contentHeight = tempDiv.scrollHeight || tempDiv.offsetHeight || 1000;
        
        console.log('Dimensiones del contenido:', { 
          offsetWidth: tempDiv.offsetWidth,
          offsetHeight: tempDiv.offsetHeight,
          scrollWidth: tempDiv.scrollWidth,
          scrollHeight: tempDiv.scrollHeight,
          contentWidth,
          contentHeight
        });
        console.log('Contenido texto:', textContent.substring(0, 200));
        
        // Configuración de html2pdf
        const opt = {
          margin: [0.5, 0.5, 0.5, 0.5],
          filename: `${pageTitle || 'pagina'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            allowTaint: false,
            logging: false,
            backgroundColor: '#ffffff',
            width: contentWidth,
            height: contentHeight,
            windowWidth: contentWidth,
            windowHeight: contentHeight,
            x: 0,
            y: 0,
            scrollX: 0,
            scrollY: 0,
            removeContainer: false
          },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Generar PDF
        window.html2pdf()
          .set(opt)
          .from(tempDiv)
          .save()
          .then(() => {
            // Restaurar scroll original
            window.scrollTo(originalScrollX, originalScrollY);
            
            // Esperar un momento antes de remover para asegurar que el PDF se genere
            setTimeout(() => {
              if (tempDiv && tempDiv.parentNode) {
                document.body.removeChild(tempDiv);
              }
              if (tempIframe && tempIframe.parentNode) {
                document.body.removeChild(tempIframe);
              }
            }, 500);
            resolve();
          })
          .catch((error) => {
            console.error('Error generando PDF:', error);
            // Restaurar scroll original
            window.scrollTo(originalScrollX, originalScrollY);
            
            if (tempDiv && tempDiv.parentNode) {
              document.body.removeChild(tempDiv);
            }
            if (tempIframe && tempIframe.parentNode) {
              document.body.removeChild(tempIframe);
            }
            reject(error);
          });
      } catch (error) {
        console.error('Error en exportToPDF:', error);
        if (tempDiv) document.body.removeChild(tempDiv);
        if (tempIframe) document.body.removeChild(tempIframe);
        reject(error);
      }
    });
  }

  /**
   * Descarga un archivo de texto
   */
  downloadTextFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Escapa caracteres HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export default new ExportService();

