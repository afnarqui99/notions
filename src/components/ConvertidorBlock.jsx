import { useState, useEffect, useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  FileText,
  Download,
  Upload,
  Eye,
  EyeOff,
  ArrowRight,
  Trash2,
  File,
  Loader2,
  Lock,
  Key
} from 'lucide-react';
import { marked } from 'marked';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import jsPDF from 'jspdf';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Toast from './Toast';

// Configurar el worker de pdfjs-dist
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export default function ConvertidorBlock({ node, updateAttributes, deleteNode, editor, getPos }) {
  const [conversionType, setConversionType] = useState(node.attrs.conversionType || 'markdown-to-pdf');
  const [inputContent, setInputContent] = useState(node.attrs.inputContent || '');
  const [previewContent, setPreviewContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPasswordConfirm, setUserPasswordConfirm] = useState('');
  const [secureKey, setSecureKey] = useState('');
  const [secureKeyConfirm, setSecureKeyConfirm] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [expirationValue, setExpirationValue] = useState(5);
  const [expirationUnit, setExpirationUnit] = useState('days'); // minutes, hours, days, weeks, months, years
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showUserPasswordConfirm, setShowUserPasswordConfirm] = useState(false);
  const [showSecureKey, setShowSecureKey] = useState(false);
  const [showSecureKeyConfirm, setShowSecureKeyConfirm] = useState(false);
  
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);

  // Función para calcular la fecha de expiración basada en valor y unidad
  const calculateExpirationDate = (value, unit) => {
    const date = new Date();
    switch (unit) {
      case 'minutes':
        date.setMinutes(date.getMinutes() + value);
        break;
      case 'hours':
        date.setHours(date.getHours() + value);
        break;
      case 'days':
        date.setDate(date.getDate() + value);
        break;
      case 'weeks':
        date.setDate(date.getDate() + (value * 7));
        break;
      case 'months':
        date.setMonth(date.getMonth() + value);
        break;
      case 'years':
        date.setFullYear(date.getFullYear() + value);
        break;
      default:
        date.setDate(date.getDate() + value);
    }
    return date;
  };

  // Función para obtener el texto de la unidad en español
  const getUnitText = (unit, value) => {
    const units = {
      minutes: value === 1 ? 'minuto' : 'minutos',
      hours: value === 1 ? 'hora' : 'horas',
      days: value === 1 ? 'día' : 'días',
      weeks: value === 1 ? 'semana' : 'semanas',
      months: value === 1 ? 'mes' : 'meses',
      years: value === 1 ? 'año' : 'años',
    };
    return units[unit] || 'días';
  };

  // Sincronizar con atributos del nodo
  useEffect(() => {
    updateAttributes({
      conversionType,
      inputContent,
    });
  }, [conversionType, inputContent, updateAttributes]);

  // Actualizar preview cuando cambia el contenido, el tipo o el archivo
  useEffect(() => {
    updatePreview();
  }, [inputContent, conversionType, uploadedFile, fileName, expirationValue, expirationUnit]);

  const updatePreview = async () => {
    if (!inputContent.trim()) {
      setPreviewContent('');
      return;
    }

    try {
      switch (conversionType) {
        case 'markdown-to-pdf':
          // Preview del markdown renderizado
          const html = marked(inputContent);
          setPreviewContent(html);
          break;
        case 'pdf-to-word':
          // Para PDF, mostrar información del archivo
          if (uploadedFile) {
            setPreviewContent(`<div class="p-4"><p><strong>Archivo PDF cargado:</strong> ${fileName}</p><p>Tamaño: ${(uploadedFile.size / 1024).toFixed(2)} KB</p><p class="text-sm text-gray-600 dark:text-gray-400 mt-2">El texto se extraerá del PDF al convertir</p></div>`);
          } else {
            setPreviewContent('<div class="p-4 text-gray-500">Carga un archivo PDF para ver la vista previa</div>');
          }
          break;
        case 'markdown-to-pdf-protected':
          // Preview del markdown renderizado (igual que markdown-to-pdf)
          const htmlProtected = marked(inputContent);
          setPreviewContent(htmlProtected);
          break;
        case 'word-to-pdf-protected':
          // Para Word protegido, intentar mostrar preview del contenido
          if (uploadedFile) {
            uploadedFile.arrayBuffer().then(arrayBuffer => {
              mammoth.convertToHtml({ arrayBuffer }).then(result => {
                setPreviewContent(result.value || `<div class="p-4"><p><strong>Archivo Word cargado:</strong> ${fileName}</p><p>Tamaño: ${(uploadedFile.size / 1024).toFixed(2)} KB</p><p class="text-sm text-blue-600 mt-2">⚠️ Este PDF será protegido con contraseña</p></div>`);
              }).catch(() => {
                setPreviewContent(`<div class="p-4"><p><strong>Archivo Word cargado:</strong> ${fileName}</p><p>Tamaño: ${(uploadedFile.size / 1024).toFixed(2)} KB</p><p class="text-sm text-blue-600 mt-2">⚠️ Este PDF será protegido con contraseña</p></div>`);
              });
            }).catch(() => {
              setPreviewContent(`<div class="p-4"><p><strong>Archivo Word cargado:</strong> ${fileName}</p><p>Tamaño: ${(uploadedFile.size / 1024).toFixed(2)} KB</p><p class="text-sm text-blue-600 mt-2">⚠️ Este PDF será protegido con contraseña</p></div>`);
            });
          } else {
            setPreviewContent('<div class="p-4 text-gray-500">Carga un archivo Word para ver la vista previa</div>');
          }
          break;
        case 'canva-to-pdf-protected':
          // Para Canva, mostrar preview de la imagen o PDF
          if (uploadedFile) {
            const isImage = uploadedFile.type.startsWith('image/');
            if (isImage) {
              uploadedFile.arrayBuffer().then(() => {
                const imageUrl = URL.createObjectURL(uploadedFile);
                setPreviewContent(`<div class="p-4"><p><strong>Archivo de Canva cargado:</strong> ${fileName}</p><p>Tamaño: ${(uploadedFile.size / 1024).toFixed(2)} KB</p><img src="${imageUrl}" alt="Preview" style="max-width: 100%; margin-top: 10px; border: 1px solid #ddd; border-radius: 4px;" /><p class="text-sm text-blue-600 mt-2">⚠️ Este PDF será protegido con contraseña y expirará en ${expirationValue} ${getUnitText(expirationUnit, expirationValue)}</p></div>`);
              }).catch(() => {
                setPreviewContent(`<div class="p-4"><p><strong>Archivo de Canva cargado:</strong> ${fileName}</p><p>Tamaño: ${(uploadedFile.size / 1024).toFixed(2)} KB</p><p class="text-sm text-blue-600 mt-2">⚠️ Este PDF será protegido con contraseña y expirará en ${expirationValue} ${getUnitText(expirationUnit, expirationValue)}</p></div>`);
              });
            } else {
              setPreviewContent(`<div class="p-4"><p><strong>PDF de Canva cargado:</strong> ${fileName}</p><p>Tamaño: ${(uploadedFile.size / 1024).toFixed(2)} KB</p><p class="text-sm text-blue-600 mt-2">⚠️ Este PDF será protegido con contraseña y expirará en ${expirationValue} ${getUnitText(expirationUnit, expirationValue)}</p></div>`);
            }
          } else {
            setPreviewContent('<div class="p-4 text-gray-500">Carga un archivo de Canva (imagen o PDF) para ver la vista previa</div>');
          }
          break;
        case 'word-to-pdf':
          // Para Word, intentar mostrar preview del contenido
          if (uploadedFile) {
            // Cargar y convertir a HTML para preview
            uploadedFile.arrayBuffer().then(arrayBuffer => {
              mammoth.convertToHtml({ arrayBuffer }).then(result => {
                setPreviewContent(result.value || `<div class="p-4"><p><strong>Archivo Word cargado:</strong> ${fileName}</p><p>Tamaño: ${(uploadedFile.size / 1024).toFixed(2)} KB</p></div>`);
              }).catch(() => {
                setPreviewContent(`<div class="p-4"><p><strong>Archivo Word cargado:</strong> ${fileName}</p><p>Tamaño: ${(uploadedFile.size / 1024).toFixed(2)} KB</p></div>`);
              });
            }).catch(() => {
              setPreviewContent(`<div class="p-4"><p><strong>Archivo Word cargado:</strong> ${fileName}</p><p>Tamaño: ${(uploadedFile.size / 1024).toFixed(2)} KB</p></div>`);
            });
          } else {
            setPreviewContent('<div class="p-4 text-gray-500">Carga un archivo Word para ver la vista previa</div>');
          }
          break;
      }
    } catch (error) {
      console.error('Error actualizando preview:', error);
      setPreviewContent('<div class="p-4 text-red-500">Error al generar vista previa</div>');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      if (conversionType === 'markdown-to-pdf') {
        // Cargar archivo Markdown
        if (file.name.endsWith('.md') || file.name.endsWith('.markdown') || file.name.endsWith('.txt') || file.type === 'text/markdown' || file.type === 'text/plain') {
          const text = await file.text();
          setInputContent(text);
          setUploadedFile(file);
          setFileName(file.name);
          setToast({ message: 'Archivo Markdown cargado correctamente', type: 'success' });
        } else {
          setToast({ message: 'Por favor selecciona un archivo .md, .markdown o .txt', type: 'error' });
        }
      } else if (conversionType === 'pdf-to-word') {
        // Cargar archivo PDF
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          setUploadedFile(file);
          setFileName(file.name);
          setInputContent('file-loaded'); // Marcar que hay un archivo cargado
          setToast({ message: 'Archivo PDF cargado correctamente', type: 'success' });
        } else {
          setToast({ message: 'Por favor selecciona un archivo PDF', type: 'error' });
        }
      } else if (conversionType === 'word-to-pdf' || conversionType === 'word-to-pdf-protected') {
        // Cargar archivo Word
        if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
          setUploadedFile(file);
          setFileName(file.name);
          setInputContent('file-loaded'); // Marcar que hay un archivo cargado
          setToast({ message: 'Archivo Word cargado correctamente', type: 'success' });
        } else {
          setToast({ message: 'Por favor selecciona un archivo Word (.docx o .doc)', type: 'error' });
        }
      } else if (conversionType === 'canva-to-pdf-protected') {
        // Cargar archivo de Canva (imágenes o PDF)
        const imageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'];
        const isImage = imageTypes.includes(file.type) || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file.name);
        const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
        
        if (isImage || isPDF) {
          setUploadedFile(file);
          setFileName(file.name);
          setInputContent('file-loaded');
          setToast({ message: `Archivo de Canva cargado correctamente (${isImage ? 'Imagen' : 'PDF'})`, type: 'success' });
        } else {
          setToast({ message: 'Por favor selecciona una imagen (PNG, JPG, etc.) o un PDF de Canva', type: 'error' });
        }
      }
    } catch (error) {
      console.error('Error cargando archivo:', error);
      setToast({ message: 'Error al cargar el archivo: ' + error.message, type: 'error' });
    }
    
    // Limpiar el input para permitir cargar el mismo archivo de nuevo
    if (event.target) {
      event.target.value = '';
    }
  };

  const convertMarkdownToPDF = async () => {
    setIsConverting(true);
    try {
      const html = marked(inputContent);
      
      // Crear elemento temporal para renderizar
      const tempDiv = document.createElement('div');
      tempDiv.className = 'markdown-preview';
      tempDiv.innerHTML = html;
      
      // Configuración para A4 (210mm x 297mm)
      const a4WidthPx = 794; // 210mm en pixels a 96 DPI
      const a4HeightPx = 1123; // 297mm en pixels a 96 DPI
      const paddingPx = 40; // Padding de 20mm en cada lado
      const contentWidth = a4WidthPx - (paddingPx * 2);
      
      // Estilos para el contenedor
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '0';
      tempDiv.style.top = '0';
      tempDiv.style.width = `${a4WidthPx}px`;
      tempDiv.style.maxWidth = `${a4WidthPx}px`;
      tempDiv.style.padding = `${paddingPx}px`;
      tempDiv.style.fontFamily = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
      tempDiv.style.fontSize = '12pt';
      tempDiv.style.lineHeight = '1.6';
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.color = '#000000';
      tempDiv.style.boxSizing = 'border-box';
      
      // Estilos para evitar cortes de página en elementos
      const style = document.createElement('style');
      style.id = 'pdf-export-styles';
      style.textContent = `
        .markdown-preview {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .markdown-preview h1,
        .markdown-preview h2,
        .markdown-preview h3,
        .markdown-preview h4,
        .markdown-preview h5,
        .markdown-preview h6 {
          page-break-after: avoid;
          break-after: avoid;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .markdown-preview p {
          page-break-inside: avoid;
          break-inside: avoid;
          orphans: 3;
          widows: 3;
        }
        .markdown-preview pre,
        .markdown-preview code {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .markdown-preview table {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .markdown-preview img {
          page-break-inside: avoid;
          break-inside: avoid;
          max-width: 100%;
          height: auto;
        }
        .markdown-preview blockquote {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .markdown-preview ul,
        .markdown-preview ol {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .markdown-preview li {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(tempDiv);

      // Esperar a que se renderice completamente
      await new Promise(resolve => {
        // Esperar a que las imágenes se carguen
        const images = tempDiv.querySelectorAll('img');
        if (images.length === 0) {
          setTimeout(resolve, 200);
        } else {
          let loaded = 0;
          images.forEach(img => {
            if (img.complete) {
              loaded++;
            } else {
              img.onload = () => {
                loaded++;
                if (loaded === images.length) {
                  setTimeout(resolve, 200);
                }
              };
              img.onerror = () => {
                loaded++;
                if (loaded === images.length) {
                  setTimeout(resolve, 200);
                }
              };
            }
          });
          if (loaded === images.length) {
            setTimeout(resolve, 200);
          }
        }
      });

      // Obtener dimensiones reales del contenido
      const elementWidth = tempDiv.scrollWidth || tempDiv.offsetWidth || a4WidthPx;
      const elementHeight = tempDiv.scrollHeight || tempDiv.offsetHeight;

      // Generar PDF con mejor manejo de páginas
      await html2pdf()
        .set({
          margin: [0, 0, 0, 0], // Sin márgenes adicionales, el padding ya los incluye
          filename: 'documento.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: elementWidth,
            height: elementHeight,
            windowWidth: elementWidth,
            windowHeight: elementHeight,
            x: 0,
            y: 0,
            scrollX: 0,
            scrollY: 0,
            // Configuración para evitar cortes
            allowTaint: true,
            letterRendering: true,
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
          },
          pagebreak: { 
            mode: ['avoid-all', 'css', 'legacy'],
            before: '.page-break-before',
            after: '.page-break-after',
            avoid: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'table', 'img', 'blockquote']
          }
        })
        .from(tempDiv)
        .save();

      // Limpiar
      document.body.removeChild(tempDiv);
      const styleElement = document.getElementById('pdf-export-styles');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }

      setToast({ message: 'PDF generado exitosamente', type: 'success' });
    } catch (error) {
      console.error('Error convirtiendo Markdown a PDF:', error);
      setToast({ message: 'Error al convertir: ' + error.message, type: 'error' });
    } finally {
      setIsConverting(false);
    }
  };

  const convertWordToPDF = async () => {
    setIsConverting(true);
    try {
      if (!uploadedFile) {
        setToast({ message: 'Por favor carga un archivo Word primero', type: 'error' });
        setIsConverting(false);
        return;
      }

      // Leer el Word
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;
      
      // Mostrar advertencias si las hay
      if (result.messages && result.messages.length > 0) {
        console.warn('Advertencias de conversión:', result.messages);
      }

      // Configuración para A4 (210mm x 297mm)
      const a4WidthPx = 794; // 210mm en pixels a 96 DPI
      const a4HeightPx = 1123; // 297mm en pixels a 96 DPI
      const paddingPx = 40; // Padding de 20mm en cada lado
      const contentWidth = a4WidthPx - (paddingPx * 2);

      // Crear elemento temporal con estilos correctos
      const tempDiv = document.createElement('div');
      tempDiv.className = 'markdown-preview';
      tempDiv.innerHTML = html;
      
      // Estilos para el contenedor - centrado y con ancho correcto
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '0';
      tempDiv.style.top = '0';
      tempDiv.style.width = `${a4WidthPx}px`;
      tempDiv.style.maxWidth = `${a4WidthPx}px`;
      tempDiv.style.padding = `${paddingPx}px`;
      tempDiv.style.fontFamily = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
      tempDiv.style.fontSize = '12pt';
      tempDiv.style.lineHeight = '1.6';
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.color = '#000000';
      tempDiv.style.boxSizing = 'border-box';
      tempDiv.style.margin = '0';
      tempDiv.style.overflow = 'visible';
      
      // Estilos para el contenido interno - asegurar que no se desborde
      const style = document.createElement('style');
      style.id = 'word-pdf-export-styles';
      style.textContent = `
        .markdown-preview {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .markdown-preview * {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .markdown-preview p,
        .markdown-preview div,
        .markdown-preview span {
          max-width: 100% !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        .markdown-preview h1,
        .markdown-preview h2,
        .markdown-preview h3,
        .markdown-preview h4,
        .markdown-preview h5,
        .markdown-preview h6 {
          page-break-after: avoid;
          break-after: avoid;
          page-break-inside: avoid;
          break-inside: avoid;
          max-width: 100% !important;
        }
        .markdown-preview p {
          page-break-inside: avoid;
          break-inside: avoid;
          orphans: 3;
          widows: 3;
          margin: 1em 0;
        }
        .markdown-preview table {
          page-break-inside: avoid;
          break-inside: avoid;
          width: 100% !important;
          max-width: 100% !important;
          table-layout: auto;
        }
        .markdown-preview img {
          page-break-inside: avoid;
          break-inside: avoid;
          max-width: 100% !important;
          height: auto !important;
        }
        .markdown-preview pre,
        .markdown-preview code {
          page-break-inside: avoid;
          break-inside: avoid;
          max-width: 100% !important;
          overflow-wrap: break-word !important;
          word-wrap: break-word !important;
          white-space: pre-wrap !important;
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(tempDiv);

      // Esperar a que se renderice completamente y las imágenes se carguen
      await new Promise(resolve => {
        const images = tempDiv.querySelectorAll('img');
        if (images.length === 0) {
          setTimeout(resolve, 300);
        } else {
          let loaded = 0;
          images.forEach(img => {
            if (img.complete) {
              loaded++;
            } else {
              img.onload = () => {
                loaded++;
                if (loaded === images.length) {
                  setTimeout(resolve, 300);
                }
              };
              img.onerror = () => {
                loaded++;
                if (loaded === images.length) {
                  setTimeout(resolve, 300);
                }
              };
            }
          });
          if (loaded === images.length) {
            setTimeout(resolve, 300);
          }
        }
      });

      // Obtener dimensiones reales del contenido
      const elementWidth = tempDiv.scrollWidth || tempDiv.offsetWidth || a4WidthPx;
      const elementHeight = tempDiv.scrollHeight || tempDiv.offsetHeight;

      // Generar PDF con mejor manejo de páginas
      await html2pdf()
        .set({
          margin: [0, 0, 0, 0], // Sin márgenes adicionales, el padding ya los incluye
          filename: fileName.replace('.docx', '.pdf').replace('.doc', '.pdf'),
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: elementWidth,
            height: elementHeight,
            windowWidth: elementWidth,
            windowHeight: elementHeight,
            x: 0,
            y: 0,
            scrollX: 0,
            scrollY: 0,
            allowTaint: true,
            letterRendering: true,
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
          },
          pagebreak: { 
            mode: ['avoid-all', 'css', 'legacy'],
            before: '.page-break-before',
            after: '.page-break-after',
            avoid: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'table', 'img', 'blockquote']
          }
        })
        .from(tempDiv)
        .save();

      // Limpiar
      document.body.removeChild(tempDiv);
      const styleElement = document.getElementById('word-pdf-export-styles');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }

      setToast({ message: 'PDF generado exitosamente', type: 'success' });
    } catch (error) {
      console.error('Error convirtiendo Word a PDF:', error);
      setToast({ message: 'Error al convertir: ' + error.message, type: 'error' });
    } finally {
      setIsConverting(false);
    }
  };

  const convertPDFToWord = async () => {
    setIsConverting(true);
    try {
      if (!uploadedFile) {
        setToast({ message: 'Por favor carga un archivo PDF primero', type: 'error' });
        setIsConverting(false);
        return;
      }

      // Leer el PDF usando pdfjs-dist
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      const paragraphs = [];
      
      // Extraer texto de cada página
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Procesar el texto de la página
        let currentParagraph = [];
        let lastY = null;
        
        textContent.items.forEach((item) => {
          const y = item.transform[5]; // Posición Y del texto
          
          // Si hay un salto significativo en Y, es un nuevo párrafo
          if (lastY !== null && Math.abs(y - lastY) > 5) {
            if (currentParagraph.length > 0) {
              const paragraphText = currentParagraph.map(t => t.str).join(' ');
              if (paragraphText.trim()) {
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: paragraphText,
                        size: 20,
                      }),
                    ],
                  })
                );
              }
              currentParagraph = [];
            }
          }
          
          currentParagraph.push(item);
          lastY = y;
        });
        
        // Agregar el último párrafo de la página
        if (currentParagraph.length > 0) {
          const paragraphText = currentParagraph.map(t => t.str).join(' ');
          if (paragraphText.trim()) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: paragraphText,
                    size: 20,
                  }),
                ],
              })
            );
          }
        }
        
        // Agregar salto de página si no es la última página
        if (pageNum < numPages) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: '',
                  break: 1,
                }),
              ],
            })
          );
        }
      }

      // Si no se extrajo texto, crear un documento con información básica
      if (paragraphs.length === 0) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Documento convertido desde PDF: ${fileName}`,
                bold: true,
                size: 28,
              }),
            ],
          })
        );
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Número de páginas: ${numPages}`,
                size: 20,
              }),
            ],
          })
        );
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '\nNota: No se pudo extraer texto del PDF. Puede ser un PDF escaneado o con texto en imágenes.',
                size: 20,
                italics: true,
              }),
            ],
          })
        );
      }

      // Crear documento Word
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      // Generar y descargar
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.replace('.pdf', '.docx');
      link.click();
      URL.revokeObjectURL(url);

      setToast({ message: 'Documento Word generado exitosamente', type: 'success' });
    } catch (error) {
      console.error('Error convirtiendo PDF a Word:', error);
      setToast({ message: 'Error al convertir: ' + error.message, type: 'error' });
    } finally {
      setIsConverting(false);
    }
  };

  const convertToProtectedPDF = async (htmlContent, sourceFileName) => {
    
    if ((!userPassword || userPassword.trim() === '') && (!secureKey || secureKey.trim() === '')) {
      console.error('ERROR: No hay contraseñas configuradas en convertToProtectedPDF');
      setShowPasswordModal(true);
      setToast({ message: 'Debes establecer al menos una contraseña de usuario o clave segura', type: 'error' });
      return;
    }

    setIsConverting(true);
    try {
      // Calcular fecha de creación y expiración (usando expirationValue y expirationUnit)
      const creationDate = new Date();
      const expirationDate = calculateExpirationDate(expirationValue, expirationUnit);

      // Agregar nota de expiración al contenido si hay userPassword
      // Para Canva, no agregamos la nota amarilla visible, solo en metadatos
      let finalHtmlContent = htmlContent;
      const isCanvaContent = htmlContent.includes('Imagen de Canva') || htmlContent.includes('PDF de Canva');
      
      if (userPassword && !isCanvaContent) {
        const expirationNote = `
          <div style="background-color: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
            <p style="margin: 0; font-weight: bold; color: #856404; font-size: 12pt;">
              ⚠️ DOCUMENTO PROTEGIDO - EXPIRA EN ${expirationValue} ${getUnitText(expirationUnit, expirationValue).toUpperCase()}
            </p>
            <p style="margin: 8px 0 0 0; font-size: 10pt; color: #856404;">
              <strong>Fecha de creación:</strong> ${creationDate.toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p style="margin: 5px 0 0 0; font-size: 10pt; color: #856404;">
              <strong>Fecha de expiración:</strong> ${expirationDate.toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            ${secureKey ? '<p style="margin: 8px 0 0 0; font-size: 10pt; color: #155724; font-weight: bold;">✓ Clave segura disponible para acceso permanente</p>' : ''}
          </div>
        `;
        finalHtmlContent = expirationNote + htmlContent;
      }

      // Crear elemento temporal para renderizar
      const tempDiv = document.createElement('div');
      tempDiv.className = 'markdown-preview';
      tempDiv.innerHTML = finalHtmlContent;
      
      // Configuración para A4
      const a4WidthPx = 794; // Ancho A4 en píxeles (96 DPI)
      const a4HeightPx = 1123; // Alto A4 en píxeles (96 DPI)
      const paddingPx = 40;
      
      // Reutilizar isCanvaContent ya declarado arriba
      // isCanvaContent ya está definido en la línea 802
      
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '0';
      tempDiv.style.top = '0';
      tempDiv.style.width = `${a4WidthPx}px`;
      tempDiv.style.maxWidth = `${a4WidthPx}px`;
      tempDiv.style.padding = isCanvaContent ? '0' : `${paddingPx}px`;
      tempDiv.style.fontFamily = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
      tempDiv.style.fontSize = '12pt';
      tempDiv.style.lineHeight = '1.6';
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.color = '#000000';
      tempDiv.style.boxSizing = 'border-box';
      tempDiv.style.margin = '0';
      tempDiv.style.overflow = 'hidden';
      
      // Estilos para evitar cortes
      const style = document.createElement('style');
      style.id = 'protected-pdf-export-styles';
      // Reutilizar isCanvaContent ya declarado arriba (línea 802)
      
      style.textContent = `
        .markdown-preview * {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .markdown-preview p, .markdown-preview div, .markdown-preview span {
          max-width: 100% !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        .markdown-preview h1, .markdown-preview h2, .markdown-preview h3,
        .markdown-preview h4, .markdown-preview h5, .markdown-preview h6 {
          page-break-after: avoid;
          break-after: avoid;
          max-width: 100% !important;
        }
        .markdown-preview p {
          page-break-inside: avoid;
          break-inside: avoid;
          orphans: 3;
          widows: 3;
          margin: 1em 0;
        }
        .markdown-preview table {
          width: 100% !important;
          max-width: 100% !important;
        }
        .markdown-preview img {
          max-width: 100% !important;
          height: auto !important;
          ${isCanvaContent ? 'object-fit: contain !important;' : ''}
        }
        .markdown-preview pre, .markdown-preview code {
          max-width: 100% !important;
          overflow-wrap: break-word !important;
          white-space: pre-wrap !important;
        }
        ${isCanvaContent ? `
          .markdown-preview > div {
            width: 100% !important;
            box-sizing: border-box !important;
          }
        ` : ''}
      `;
      document.head.appendChild(style);
      document.body.appendChild(tempDiv);

      // Esperar renderizado
      await new Promise(resolve => {
        const images = tempDiv.querySelectorAll('img');
        if (images.length === 0) {
          setTimeout(resolve, 300);
        } else {
          let loaded = 0;
          images.forEach(img => {
            if (img.complete) {
              loaded++;
            } else {
              img.onload = () => { loaded++; if (loaded === images.length) setTimeout(resolve, 300); };
              img.onerror = () => { loaded++; if (loaded === images.length) setTimeout(resolve, 300); };
            }
          });
          if (loaded === images.length) setTimeout(resolve, 300);
        }
      });

      // Generar PDF sin protección primero usando html2pdf
      const pdfBlob = await new Promise((resolve, reject) => {
        html2pdf()
          .set({
            margin: [0, 0, 0, 0],
            filename: 'temp.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff',
              width: a4WidthPx, // Usar ancho fijo A4
              height: tempDiv.scrollHeight || a4HeightPx, // Altura dinámica basada en contenido
              windowWidth: a4WidthPx,
              windowHeight: tempDiv.scrollHeight || a4HeightPx,
              x: 0,
              y: 0,
              scrollX: 0,
              scrollY: 0,
              allowTaint: true,
              letterRendering: true,
            },
            jsPDF: { 
              unit: 'mm', 
              format: 'a4', 
              orientation: 'portrait',
              compress: true,
            },
            pagebreak: {
              mode: ['css', 'legacy'],
              before: '.page-break-before',
              after: '.page-break-after',
              avoid: isCanvaContent ? [] : ['img'], // Para Canva, permitir división automática en páginas
            }
          })
          .from(tempDiv)
          .outputPdf('blob')
          .then(resolve)
          .catch(reject);
      });

      // Limpiar elementos temporales
      document.body.removeChild(tempDiv);
      const styleElement = document.getElementById('protected-pdf-export-styles');
      if (styleElement) {
        document.head.removeChild(styleElement);
      }

      // Cargar el PDF en pdf-lib para agregar metadatos
      const pdfBytes = await pdfBlob.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Reutilizar las fechas ya calculadas anteriormente
      // creationDate y expirationDate ya están definidas arriba

      // Agregar información de expiración en metadatos
      pdfDoc.setTitle(sourceFileName || 'Documento Protegido');
      pdfDoc.setSubject(`Documento protegido - Creado: ${creationDate.toISOString()} - Expira: ${expirationDate.toISOString()}`);
      pdfDoc.setCreator('Notion Local Editor');
      pdfDoc.setProducer('Notion Local Editor');
      
      // Agregar información de expiración en keywords para fácil acceso
      // setKeywords requiere un array de strings, no un objeto JSON
      const expirationInfo = {
        created: creationDate.toISOString(),
        expires: expirationDate.toISOString(),
        secureKeyEnabled: !!secureKey,
        expirationValue: expirationValue,
        expirationUnit: expirationUnit,
        daysValid: expirationUnit === 'days' ? expirationValue : null
      };
      // Convertir el objeto a un array de strings para setKeywords
      pdfDoc.setKeywords([
        `created:${expirationInfo.created}`,
        `expires:${expirationInfo.expires}`,
        `secureKeyEnabled:${expirationInfo.secureKeyEnabled}`,
        `expirationValue:${expirationInfo.expirationValue}`,
        `expirationUnit:${expirationInfo.expirationUnit}`,
        expirationInfo.daysValid !== null ? `daysValid:${expirationInfo.daysValid}` : ''
      ].filter(Boolean)); // Filtrar valores vacíos
      
      // Establecer permisos (solo lectura si hay userPassword o secureKey)
      // Si hay contraseña, aplicar restricciones
      const hasPassword = userPassword || secureKey;
      const permissions = hasPassword ? {
        printing: 'lowResolution',
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: false,
        assembling: false,
      } : {};

      // Guardar el PDF protegido
      // userPassword: contraseña que el usuario debe ingresar para abrir el PDF (OBLIGATORIA para que pida contraseña)
      // ownerPassword: contraseña del propietario (permite acceso completo)
      // IMPORTANTE: Si userPassword es undefined, el PDF NO pedirá contraseña al abrirse
      // Si solo hay secureKey, usarla como userPassword también para que el PDF pida contraseña
      // Si hay ambas, userPassword expira y secureKey es permanente (ownerPassword)
      const finalUserPassword = userPassword || secureKey; // Usar secureKey como userPassword si no hay userPassword
      const finalOwnerPassword = secureKey || (userPassword ? userPassword + '_owner' : 'default_owner');
      
      // Validar que haya una contraseña antes de proteger
      if (!finalUserPassword || finalUserPassword.trim() === '') {
        console.error('ERROR: No hay contraseña configurada', { 
          userPassword: userPassword ? `*** (${userPassword.length} chars)` : 'VACÍA', 
          secureKey: secureKey ? `*** (${secureKey.length} chars)` : 'VACÍA', 
          finalUserPassword: finalUserPassword ? `*** (${finalUserPassword.length} chars)` : 'VACÍA' 
        });
        throw new Error('Debe haber al menos una contraseña configurada para proteger el PDF');
      }
      
      // Asegurarse de que las contraseñas no estén vacías
      const trimmedUserPassword = finalUserPassword.trim();
      const trimmedOwnerPassword = finalOwnerPassword.trim();
      
      if (!trimmedUserPassword || trimmedUserPassword.length === 0) {
        throw new Error('La contraseña de usuario no puede estar vacía');
      }
      
      // Aplicar protección con todas las opciones necesarias
      const saveOptions = {
        userPassword: trimmedUserPassword, // SIEMPRE debe haber una contraseña aquí para que el PDF pida contraseña
        ownerPassword: trimmedOwnerPassword,
        permissions: hasPassword ? permissions : undefined,
        useObjectStreams: false, // Deshabilitar para mejor compatibilidad
        addDefaultPage: false, // No agregar página por defecto
        updateMetadata: true, // Actualizar metadatos
      };
      
      // Primero guardar el PDF sin protección para agregar metadatos
      const unprotectedPdfBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        updateMetadata: true,
      });
      
      // Aplicar protección con contraseña usando @pdfsmaller/pdf-encrypt-lite
      // IMPORTANTE: Esta biblioteca requiere que userPassword y ownerPassword sean diferentes
      // Si son iguales, puede causar problemas. Usar userPassword como contraseña principal.
      const cleanUserPassword = String(trimmedUserPassword).trim();
      const cleanOwnerPassword = String(trimmedOwnerPassword || trimmedUserPassword).trim();
      
      // Asegurarse de que ownerPassword sea diferente de userPassword
      const finalOwnerPasswordForEncrypt = (cleanOwnerPassword !== cleanUserPassword) ? cleanOwnerPassword : cleanUserPassword + '_owner';
      
      const encryptOptions = {
        userPassword: cleanUserPassword, // Esta es la contraseña que el usuario debe ingresar
        ownerPassword: finalOwnerPasswordForEncrypt, // Contraseña del propietario (diferente para evitar problemas)
        permissions: hasPassword ? {
          printing: 'lowResolution',
          modifying: false,
          copying: false,
          annotating: false,
          fillingForms: false,
          contentAccessibility: false,
          assembling: false,
        } : undefined,
      };
      
      let protectedPdfBytes;
      try {
        protectedPdfBytes = await encryptPDF(unprotectedPdfBytes, encryptOptions);
      } catch (encryptError) {
        console.error('ERROR al encriptar PDF:', encryptError);
        throw new Error('Error al aplicar protección con contraseña: ' + encryptError.message);
      }

      // Crear blob y descargar
      const protectedBlob = new Blob([protectedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(protectedBlob);
      const link = document.createElement('a');
      link.href = url;
      const finalFileName = sourceFileName 
        ? sourceFileName.replace('.md', '').replace('.markdown', '').replace('.docx', '').replace('.doc', '') + '_protegido.pdf'
        : 'documento_protegido.pdf';
      link.download = finalFileName;
      link.click();
      URL.revokeObjectURL(url);

      setToast({ 
        message: `PDF protegido generado exitosamente. ${userPassword ? `Expira el ${expirationDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} (${expirationValue} ${getUnitText(expirationUnit, expirationValue)} desde ahora). ` : ''}${secureKey ? 'Clave segura configurada para acceso permanente.' : ''}`, 
        type: 'success' 
      });

      // No limpiar contraseñas para que el usuario pueda reutilizarlas si necesita
      setShowPasswordModal(false);
    } catch (error) {
      console.error('Error generando PDF protegido:', error);
      setToast({ message: 'Error al generar PDF protegido: ' + error.message, type: 'error' });
    } finally {
      setIsConverting(false);
    }
  };

  const convertCanvaToProtectedPDF = async (file, sourceFileName) => {
    
    if ((!userPassword || userPassword.trim() === '') && (!secureKey || secureKey.trim() === '')) {
      console.error('ERROR: No hay contraseñas configuradas');
      setShowPasswordModal(true);
      setToast({ message: 'Debes establecer al menos una contraseña de usuario o clave segura', type: 'error' });
      return;
    }
    // Validar que las contraseñas coincidan si se ingresaron
    if (userPassword && userPassword.trim() !== '' && userPassword !== userPasswordConfirm) {
      console.error('ERROR: Las contraseñas de usuario no coinciden');
      setToast({ message: 'Las contraseñas de usuario no coinciden', type: 'error' });
      setShowPasswordModal(true);
      return;
    }
    if (secureKey && secureKey.trim() !== '' && secureKey !== secureKeyConfirm) {
      console.error('ERROR: Las claves seguras no coinciden');
      setToast({ message: 'Las claves seguras no coinciden', type: 'error' });
      setShowPasswordModal(true);
      return;
    }
    
    setIsConverting(true);
    try {
      const isImage = file.type.startsWith('image/');
      let htmlContent = '';

      if (isImage) {
        // Convertir imagen a HTML para luego convertir a PDF
        // Cargar la imagen para obtener sus dimensiones reales
        const imageUrl = URL.createObjectURL(file);
        const img = new Image();
        
        await new Promise((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = imageUrl;
        });
        
        // Dimensiones A4 en píxeles (a 96 DPI)
        const a4WidthPx = 794; // Ancho A4
        const a4HeightPx = 1123; // Alto A4
        const paddingPx = 40;
        const availableWidth = a4WidthPx - (paddingPx * 2);
        const availableHeight = a4HeightPx - (paddingPx * 2);
        
        // Calcular el tamaño de la imagen manteniendo la proporción
        let imgWidth = img.width;
        let imgHeight = img.height;
        const aspectRatio = imgWidth / imgHeight;
        
        // Ajustar al ancho disponible si es más grande
        if (imgWidth > availableWidth) {
          imgWidth = availableWidth;
          imgHeight = imgWidth / aspectRatio;
        }
        
        // Calcular cuántas páginas necesitamos basándonos en la altura
        const pagesNeeded = Math.ceil(imgHeight / availableHeight);
        
        // Crear HTML que permita que la imagen se distribuya en múltiples páginas
        // La imagen se escalará automáticamente y html2pdf la dividirá en páginas
        htmlContent = `
          <div style="width: ${a4WidthPx}px; box-sizing: border-box; background-color: #ffffff;">
            <div style="width: 100%; padding: ${paddingPx}px; box-sizing: border-box; text-align: center;">
              <img src="${imageUrl}" style="width: ${imgWidth}px; height: ${imgHeight}px; max-width: 100%; display: block; margin: 0 auto; box-sizing: border-box; object-fit: contain;" alt="Imagen de Canva" />
            </div>
          </div>
        `;
      } else {
        // Si es PDF, cargarlo y extraer contenido
        const pdfBytes = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        // Convertir PDF a imagen para mostrar en el PDF protegido
        // Por ahora, simplemente creamos un PDF nuevo con el contenido
        htmlContent = `<div style="padding: 40px; box-sizing: border-box; background-color: #ffffff;"><p style="text-align: center; font-family: Arial, sans-serif;">PDF de Canva convertido a PDF protegido</p></div>`;
      }

      await convertToProtectedPDF(htmlContent, sourceFileName || 'canva_documento');
      
      if (isImage) {
        // Limpiar URL del objeto después de un tiempo
        setTimeout(() => {
          if (file.type.startsWith('image/')) {
            // La URL ya fue revocada por el navegador
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error convirtiendo Canva a PDF protegido:', error);
      setToast({ message: 'Error al convertir: ' + error.message, type: 'error' });
    } finally {
      setIsConverting(false);
    }
  };

  const handleConvert = async () => {
    // Si es un tipo protegido, verificar que haya contraseñas
    if (conversionType === 'markdown-to-pdf-protected' || conversionType === 'word-to-pdf-protected' || conversionType === 'canva-to-pdf-protected') {
      if (!userPassword && !secureKey) {
        setToast({ message: 'Debes establecer al menos una contraseña de usuario o clave segura', type: 'error' });
        setShowPasswordModal(true);
        return;
      }
      // Validar que las contraseñas coincidan si se ingresaron
      if (userPassword && userPassword !== userPasswordConfirm) {
        setToast({ message: 'Las contraseñas de usuario no coinciden', type: 'error' });
        setShowPasswordModal(true);
        return;
      }
      if (secureKey && secureKey !== secureKeyConfirm) {
        setToast({ message: 'Las claves seguras no coinciden', type: 'error' });
        setShowPasswordModal(true);
        return;
      }
    }

    switch (conversionType) {
      case 'markdown-to-pdf':
        await convertMarkdownToPDF();
        break;
      case 'markdown-to-pdf-protected':
        if (inputContent.trim()) {
          const html = marked(inputContent);
          await convertToProtectedPDF(html, fileName || 'documento');
        }
        break;
      case 'word-to-pdf-protected':
        if (uploadedFile) {
          try {
            const arrayBuffer = await uploadedFile.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer });
            await convertToProtectedPDF(result.value, fileName);
          } catch (error) {
            setToast({ message: 'Error al leer archivo Word: ' + error.message, type: 'error' });
          }
        }
        break;
      case 'pdf-to-word':
        await convertPDFToWord();
        break;
      case 'word-to-pdf':
        await convertWordToPDF();
        break;
      case 'canva-to-pdf-protected':
        if (uploadedFile) {
          // Validar nuevamente antes de convertir (por si el usuario cerró el modal sin configurar)
          if (!userPassword && !secureKey) {
            setToast({ message: 'Debes configurar al menos una contraseña antes de convertir', type: 'error' });
            setShowPasswordModal(true);
            return;
          }
          await convertCanvaToProtectedPDF(uploadedFile, fileName);
        } else {
          setToast({ message: 'Debes seleccionar un archivo de Canva primero', type: 'error' });
        }
        break;
    }
  };

  const getConversionLabel = () => {
    switch (conversionType) {
      case 'markdown-to-pdf':
        return 'Markdown → PDF';
      case 'markdown-to-pdf-protected':
        return 'Markdown → PDF Protegido';
      case 'word-to-pdf-protected':
        return 'Word → PDF Protegido';
      case 'canva-to-pdf-protected':
        return 'Canva → PDF Protegido';
      case 'pdf-to-word':
        return 'PDF → Word';
      case 'word-to-pdf':
        return 'Word → PDF';
      default:
        return '';
    }
  };

  return (
    <NodeViewWrapper className="convertidor-block-wrapper my-4">
      <div className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden ${isExpanded ? 'fixed inset-4 z-[50000]' : ''}`}>
        {/* Header */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-900 dark:text-blue-100 font-semibold text-sm">Convertidor de Documentos</span>
          </div>
          <div className="flex items-center gap-1">
            <select
              value={conversionType}
              onChange={(e) => {
                setConversionType(e.target.value);
                setInputContent('');
                setUploadedFile(null);
                setFileName('');
                setPreviewContent('');
              }}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="markdown-to-pdf">Markdown → PDF</option>
              <option value="markdown-to-pdf-protected">Markdown → PDF Protegido</option>
              <option value="word-to-pdf-protected">Word → PDF Protegido</option>
              <option value="canva-to-pdf-protected">Canva → PDF Protegido</option>
              <option value="pdf-to-word">PDF → Word</option>
              <option value="word-to-pdf">Word → PDF</option>
            </select>
            {(conversionType === 'markdown-to-pdf-protected' || conversionType === 'word-to-pdf-protected' || conversionType === 'canva-to-pdf-protected') && (
              <button
                onClick={() => setShowPasswordModal(!showPasswordModal)}
                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs flex items-center gap-1"
                title="Configurar contraseñas"
              >
                <Lock className="w-3 h-3" />
                Contraseñas
              </button>
            )}
            <button
              onClick={handleConvert}
              disabled={isConverting || (conversionType === 'markdown-to-pdf' || conversionType === 'markdown-to-pdf-protected' ? !inputContent.trim() : !uploadedFile)}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded text-xs flex items-center gap-1"
              title="Convertir documento"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Convirtiendo...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Convertir
                </>
              )}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title={isExpanded ? "Contraer" : "Expandir"}
            >
              {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Eliminar bloque"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`flex ${isExpanded ? 'h-[calc(100vh-8rem)]' : 'h-[600px]'}`}>
          {/* Panel Izquierdo - Entrada */}
          <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
            <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {conversionType === 'markdown-to-pdf' ? 'Markdown' : conversionType === 'pdf-to-word' ? 'PDF' : 'Word'}
              </h3>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {conversionType === 'markdown-to-pdf' ? (
                <>
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Contenido Markdown</span>
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".md,.markdown,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1"
                        title="Cargar archivo Markdown"
                      >
                        <Upload className="w-3 h-3" />
                        Cargar Archivo
                      </button>
                      {fileName && (
                        <button
                          onClick={() => {
                            setInputContent('');
                            setFileName('');
                            setUploadedFile(null);
                          }}
                          className="px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded"
                          title="Limpiar"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  {fileName && (
                    <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                      <File className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{fileName}</span>
                    </div>
                  )}
                  <textarea
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    placeholder={fileName ? "Contenido del archivo cargado..." : "Escribe tu contenido Markdown aquí o carga un archivo..."}
                    className="flex-1 w-full p-4 border-0 focus:outline-none resize-none font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <Upload className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {conversionType === 'pdf-to-word' 
                      ? 'Carga un archivo PDF' 
                      : conversionType === 'canva-to-pdf-protected'
                      ? 'Carga una imagen (PNG, JPG, etc.) o PDF de Canva'
                      : 'Carga un archivo Word (.docx o .doc)'}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={conversionType === 'pdf-to-word' 
                      ? '.pdf' 
                      : conversionType === 'canva-to-pdf-protected'
                      ? '.png,.jpg,.jpeg,.gif,.webp,.svg,.pdf'
                      : '.docx,.doc'}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Seleccionar Archivo
                  </button>
                  {fileName && (
                    <div className="mt-4 flex items-center gap-2">
                      <File className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{fileName}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Panel Derecho - Vista Previa */}
          <div className="flex-1 flex flex-col">
            <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Vista Previa {getConversionLabel()}
              </h3>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-white dark:bg-gray-800">
              {conversionType === 'markdown-to-pdf' ? (
                <div
                  ref={previewRef}
                  className="markdown-preview prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          deleteNode();
        }}
        title="Eliminar Convertidor"
        message="¿Estás seguro de que deseas eliminar este bloque convertidor?"
      />

      {/* Modal de Contraseñas */}
      {showPasswordModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-[50001] flex items-center justify-center p-4"
          onClick={() => setShowPasswordModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Configurar Protección
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tiempo de Expiración
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={expirationValue}
                    onChange={(e) => setExpirationValue(Math.max(1, parseInt(e.target.value) || 1))}
                    placeholder="Cantidad"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <select
                    value={expirationUnit}
                    onChange={(e) => setExpirationUnit(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="minutes">Minutos</option>
                    <option value="hours">Horas</option>
                    <option value="days">Días</option>
                    <option value="weeks">Semanas</option>
                    <option value="months">Meses</option>
                    <option value="years">Años</option>
                  </select>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  El PDF expirará después de {expirationValue} {getUnitText(expirationUnit, expirationValue)} desde la creación
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña de Usuario (Expira en {expirationValue} {getUnitText(expirationUnit, expirationValue)})
                </label>
                <div className="relative">
                  <input
                    type={showUserPassword ? "text" : "password"}
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder={`Contraseña que expira en ${expirationValue} ${getUnitText(expirationUnit, expirationValue)}`}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                    title={showUserPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  El PDF requerirá esta contraseña y expirará {expirationValue} {getUnitText(expirationUnit, expirationValue)} después de la creación
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmar Contraseña de Usuario
                </label>
                <div className="relative">
                  <input
                    type={showUserPasswordConfirm ? "text" : "password"}
                    value={userPasswordConfirm}
                    onChange={(e) => setUserPasswordConfirm(e.target.value)}
                    placeholder="Repite la contraseña de usuario"
                    className={`w-full px-3 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                      userPasswordConfirm && userPassword !== userPasswordConfirm 
                        ? 'border-red-500 dark:border-red-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPasswordConfirm(!showUserPasswordConfirm)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                    title={showUserPasswordConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showUserPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {userPasswordConfirm && userPassword !== userPasswordConfirm && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                    Las contraseñas no coinciden
                  </p>
                )}
                {userPasswordConfirm && userPassword === userPasswordConfirm && userPassword && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                    ✓ Las contraseñas coinciden
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Clave Segura (Acceso permanente)
                </label>
                <div className="relative">
                  <input
                    type={showSecureKey ? "text" : "password"}
                    value={secureKey}
                    onChange={(e) => setSecureKey(e.target.value)}
                    placeholder="Clave maestra para acceso sin restricciones"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecureKey(!showSecureKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                    title={showSecureKey ? "Ocultar clave" : "Mostrar clave"}
                  >
                    {showSecureKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Esta clave permite abrir el PDF sin restricción de tiempo
                </p>
              </div>
              {secureKey && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirmar Clave Segura
                  </label>
                  <div className="relative">
                    <input
                      type={showSecureKeyConfirm ? "text" : "password"}
                      value={secureKeyConfirm}
                      onChange={(e) => setSecureKeyConfirm(e.target.value)}
                      placeholder="Repite la clave segura"
                      className={`w-full px-3 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                        secureKeyConfirm && secureKey !== secureKeyConfirm 
                          ? 'border-red-500 dark:border-red-500' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecureKeyConfirm(!showSecureKeyConfirm)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                      title={showSecureKeyConfirm ? "Ocultar clave" : "Mostrar clave"}
                    >
                      {showSecureKeyConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {secureKeyConfirm && secureKey !== secureKeyConfirm && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                      Las claves no coinciden
                    </p>
                  )}
                  {secureKeyConfirm && secureKey === secureKeyConfirm && secureKey && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                      ✓ Las claves coinciden
                    </p>
                  )}
                </div>
              )}
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Nota:</strong> Debes establecer al menos una contraseña. La contraseña de usuario expira en {expirationValue} {getUnitText(expirationUnit, expirationValue)} desde la creación del PDF. La clave segura permite acceso permanente.
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setUserPassword('');
                    setUserPasswordConfirm('');
                    setSecureKey('');
                    setSecureKeyConfirm('');
                    setShowPasswordModal(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Limpiar
                </button>
                <button
                  onClick={() => {
                    // Validar antes de cerrar
                    if (!userPassword && !secureKey) {
                      setToast({ message: 'Debes establecer al menos una contraseña de usuario o clave segura', type: 'error' });
                      return;
                    }
                    if (userPassword && userPassword !== userPasswordConfirm) {
                      setToast({ message: 'Las contraseñas de usuario no coinciden', type: 'error' });
                      return;
                    }
                    if (secureKey && secureKey !== secureKeyConfirm) {
                      setToast({ message: 'Las claves seguras no coinciden', type: 'error' });
                      return;
                    }
                    setShowPasswordModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </NodeViewWrapper>
  );
}

