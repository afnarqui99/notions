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
      table td, table th { border: 1px solid #ddd; padding: 8px; }
      table th { background-color: #f2f2f2; }
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
      try {
        // Convertir contenido a HTML primero
        const html = await this.convertToHTML(content, pageTitle);
        
        // Crear un elemento temporal para renderizar el HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        // Esperar a que las imágenes se carguen
        const images = tempDiv.querySelectorAll('img');
        await Promise.all(
          Array.from(images).map(img => {
            return new Promise((imgResolve) => {
              if (img.complete) {
                imgResolve();
              } else {
                img.onload = imgResolve;
                img.onerror = imgResolve; // Continuar aunque falle la imagen
              }
            });
          })
        );

        // Obtener el body del HTML generado
        const bodyElement = tempDiv.querySelector('body');
        if (!bodyElement) {
          document.body.removeChild(tempDiv);
          reject(new Error('No se pudo generar el contenido HTML'));
          return;
        }

        // Verificar que html2pdf esté disponible
        if (typeof window.html2pdf === 'undefined') {
          document.body.removeChild(tempDiv);
          reject(new Error('html2pdf.js no está disponible'));
          return;
        }

        // Configuración de html2pdf
        const opt = {
          margin: 1,
          filename: `${pageTitle || 'pagina'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Generar PDF
        window.html2pdf()
          .set(opt)
          .from(bodyElement)
          .save()
          .then(() => {
            document.body.removeChild(tempDiv);
            resolve();
          })
          .catch((error) => {
            document.body.removeChild(tempDiv);
            reject(error);
          });
      } catch (error) {
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

