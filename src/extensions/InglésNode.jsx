import { NodeViewWrapper } from '@tiptap/react';
import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { 
  Languages, Maximize2, Minimize2, Volume2, Copy, 
  History, Save, X, ArrowRight, ArrowLeft, BookOpen,
  Download, Upload, Trash2, RefreshCw, MessageSquare, Send, Sparkles, Image as ImageIcon, MoreVertical,
  Play, Trophy, TrendingUp, Target, Award, Zap, CheckCircle, XCircle, Star, Flame
} from 'lucide-react';
import BlockWithDeleteButton from '../components/BlockWithDeleteButton';
import aiService from '../services/AIService';

export default function InglésNode({ node, updateAttributes, editor, getPos }) {
  const [spanishText, setSpanishText] = useState(node.attrs.spanishText || '');
  const [englishText, setEnglishText] = useState(node.attrs.englishText || '');
  const [englishPronunciation, setEnglishPronunciation] = useState(node.attrs.englishPronunciation || '');
  const [spanishPronunciation, setSpanishPronunciation] = useState(node.attrs.spanishPronunciation || '');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [classHistory, setClassHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [images, setImages] = useState([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [classesFolder, setClassesFolder] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedHistoryItems, setSelectedHistoryItems] = useState(new Set());
  const [showHistoryActions, setShowHistoryActions] = useState(false);
  const spanishInputRef = useRef(null);
  const englishInputRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const fullscreenRef = useRef(null);
  const imageInputRef = useRef(null);
  const learningAppRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [transcriptionLanguage, setTranscriptionLanguage] = useState('en-US');
  const recognitionRef = useRef(null);
  const [showLearningApp, setShowLearningApp] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cardsToReview, setCardsToReview] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0, incorrect: 0 });
  const [progress, setProgress] = useState(null);
  const [stats, setStats] = useState(null);
  const [exerciseType, setExerciseType] = useState('flashcard'); // flashcard, multiple-choice, fill-blank
  const [exerciseOptions, setExerciseOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);

  // Detectar modo oscuro
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // Cargar historial, imágenes, grupos y carpeta al montar
  useEffect(() => {
    loadClassHistory();
    loadImages();
    loadClassesFolder();
    loadGroups();
  }, []);

  // Limpiar reconocimiento de voz al desmontar
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Cargar información de la carpeta de clases
  const loadClassesFolder = async () => {
    try {
      if (window.electronAPI?.getEnglishClassesFolder) {
        const folderInfo = await window.electronAPI.getEnglishClassesFolder();
        setClassesFolder(folderInfo);
      }
    } catch (err) {
      console.error('Error cargando información de carpeta:', err);
    }
  };

  // Seleccionar carpeta personalizada
  const handleSelectFolder = async () => {
    try {
      if (window.electronAPI?.selectEnglishClassesFolder) {
        const result = await window.electronAPI.selectEnglishClassesFolder();
        
        if (result.success) {
          setError(null);
          await loadClassesFolder();
          // Recargar historial e imágenes desde la nueva ubicación
          await loadClassHistory();
          await loadImages();
          alert(`✅ Carpeta seleccionada:\n${result.path}\n\nLos archivos se guardarán aquí.`);
        } else if (!result.canceled) {
          setError(`Error al seleccionar carpeta: ${result.error}`);
        }
      }
    } catch (err) {
      console.error('Error seleccionando carpeta:', err);
      setError('Error al seleccionar la carpeta');
    }
  };

  // Resetear a carpeta por defecto
  const handleResetFolder = async () => {
    if (!confirm('¿Quieres volver a usar la carpeta por defecto?')) {
      return;
    }
    
    try {
      if (window.electronAPI?.resetEnglishClassesFolder) {
        const result = await window.electronAPI.resetEnglishClassesFolder();
        
        if (result.success) {
          setError(null);
          await loadClassesFolder();
          // Recargar historial e imágenes desde la ubicación por defecto
          await loadClassHistory();
          await loadImages();
          alert('✅ Carpeta restablecida a la ubicación por defecto.');
        } else {
          setError(`Error al resetear carpeta: ${result.error}`);
        }
      }
    } catch (err) {
      console.error('Error reseteando carpeta:', err);
      setError('Error al resetear la carpeta');
    }
  };

  // Actualizar atributos cuando cambian los valores (usar setTimeout para evitar flushSync warning)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateAttributes({
        spanishText,
        englishText,
        englishPronunciation,
        spanishPronunciation,
        classHistory: JSON.stringify(classHistory),
      });
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [spanishText, englishText, englishPronunciation, spanishPronunciation, classHistory]);

  // Cargar historial de clases desde archivos locales
  const loadClassHistory = async () => {
    setIsLoadingHistory(true);
    try {
      if (window.electronAPI?.loadEnglishClassHistory) {
        const history = await window.electronAPI.loadEnglishClassHistory();
        // Filtrar por grupo si hay uno seleccionado
        let filteredHistory = history || [];
        if (selectedGroup) {
          filteredHistory = filteredHistory.filter(entry => entry.groupId === selectedGroup);
        }
        setClassHistory(filteredHistory);
      }
    } catch (err) {
      console.error('Error cargando historial:', err);
      setClassHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Recargar historial cuando cambia el grupo seleccionado
  useEffect(() => {
    if (groups.length > 0 || selectedGroup === null) {
      loadClassHistory();
    }
  }, [selectedGroup]);

  // Cargar datos para la aplicación de aprendizaje
  const loadLearningData = async () => {
    try {
      // Cargar progreso y estadísticas
      if (window.electronAPI?.loadEnglishClassProgress) {
        const progressData = await window.electronAPI.loadEnglishClassProgress();
        setProgress(progressData);
      }
      
      if (window.electronAPI?.getEnglishClassStats) {
        const statsData = await window.electronAPI.getEnglishClassStats();
        setStats(statsData);
      }
      
      // Cargar tarjetas para revisar
      if (window.electronAPI?.getEnglishClassCardsToReview) {
        const cards = await window.electronAPI.getEnglishClassCardsToReview(20);
        setCardsToReview(cards);
        if (cards.length > 0) {
          setCurrentCard(cards[0]);
          setCurrentCardIndex(0);
        } else {
          setCurrentCard(null);
        }
      }
    } catch (err) {
      console.error('Error cargando datos de aprendizaje:', err);
    }
  };

  // Iniciar sesión de estudio
  const startStudySession = async () => {
    await loadLearningData();
    if (cardsToReview.length === 0) {
      // Crear tarjetas desde historial si no hay
      if (window.electronAPI?.createEnglishClassCardsFromHistory) {
        const result = await window.electronAPI.createEnglishClassCardsFromHistory(selectedGroup);
        if (result.success && result.created > 0) {
          await loadLearningData();
        } else {
          setError('No hay tarjetas para estudiar. Crea algunas traducciones primero.');
          return;
        }
      } else {
        setError('No hay tarjetas para estudiar. Crea algunas traducciones primero.');
        return;
      }
    }
    setCardFlipped(false);
    setShowAnswer(false);
    setIsCorrect(null);
    setSessionStats({ reviewed: 0, correct: 0, incorrect: 0 });
  };

  // Voltear tarjeta
  const flipCard = () => {
    setCardFlipped(!cardFlipped);
  };

  // Responder tarjeta (correcto/incorrecto)
  const answerCard = async (wasCorrect) => {
    if (!currentCard) return;
    
    try {
      // Actualizar tarjeta
      if (window.electronAPI?.updateEnglishClassCardReview) {
        await window.electronAPI.updateEnglishClassCardReview(currentCard.id, wasCorrect);
      }
      
      // Actualizar estadísticas de sesión
      setSessionStats(prev => ({
        reviewed: prev.reviewed + 1,
        correct: wasCorrect ? prev.correct + 1 : prev.correct,
        incorrect: wasCorrect ? prev.incorrect : prev.incorrect + 1,
      }));
      
      // Pasar a la siguiente tarjeta
      if (currentCardIndex < cardsToReview.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setCurrentCard(cardsToReview[currentCardIndex + 1]);
        setCardFlipped(false);
        setShowAnswer(false);
        setIsCorrect(null);
      } else {
        // Sesión completada
        await finishSession();
      }
    } catch (err) {
      console.error('Error respondiendo tarjeta:', err);
      setError('Error al guardar la respuesta');
    }
  };

  // Finalizar sesión
  const finishSession = async () => {
    try {
      // Actualizar progreso
      if (window.electronAPI?.updateEnglishClassProgress) {
        const result = await window.electronAPI.updateEnglishClassProgress(
          sessionStats.reviewed,
          sessionStats.correct
        );
        if (result.success) {
          setProgress(result.progress);
        }
      }
      
      // Recargar datos
      await loadLearningData();
      
      // Resetear sesión
      setSessionStats({ reviewed: 0, correct: 0, incorrect: 0 });
      setCurrentCardIndex(0);
      setCardFlipped(false);
      setShowAnswer(false);
      setIsCorrect(null);
      setCurrentCard(null);
    } catch (err) {
      console.error('Error finalizando sesión:', err);
    }
  };

  // Cargar grupos
  const loadGroups = async () => {
    try {
      if (window.electronAPI?.loadEnglishClassGroups) {
        const loadedGroups = await window.electronAPI.loadEnglishClassGroups();
        setGroups(loadedGroups || []);
      }
    } catch (err) {
      console.error('Error cargando grupos:', err);
    }
  };

  // Crear nuevo grupo
  const createGroup = async () => {
    if (!newGroupName.trim()) {
      setError('Por favor, ingresa un nombre para el grupo');
      return;
    }

    try {
      if (window.electronAPI?.createEnglishClassGroup) {
        const result = await window.electronAPI.createEnglishClassGroup(newGroupName.trim());
        if (result.success) {
          await loadGroups();
          setSelectedGroup(result.groupId);
          setNewGroupName('');
          setShowGroupModal(false);
          setError(null);
        } else {
          setError(result.error || 'Error al crear el grupo');
        }
      }
    } catch (err) {
      setError('Error al crear el grupo');
      console.error('Error creando grupo:', err);
    }
  };

  // Eliminar grupo
  const deleteGroup = async (groupId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este grupo? Las traducciones no se eliminarán, solo se quitará la agrupación.')) {
      return;
    }

    try {
      if (window.electronAPI?.deleteEnglishClassGroup) {
        const result = await window.electronAPI.deleteEnglishClassGroup(groupId);
        if (result.success) {
          await loadGroups();
          if (selectedGroup === groupId) {
            setSelectedGroup(null);
          }
          await loadClassHistory();
          setError(null);
        } else {
          setError(result.error || 'Error al eliminar el grupo');
        }
      }
    } catch (err) {
      setError('Error al eliminar el grupo');
      console.error('Error eliminando grupo:', err);
    }
  };

  // Iniciar transcripción de voz
  const startTranscription = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = transcriptionLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscriptionText(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Error en reconocimiento de voz:', event.error);
      if (event.error === 'no-speech') {
        // No hacer nada, es normal
      } else {
        setError(`Error en transcripción: ${event.error}`);
        setIsTranscribing(false);
      }
    };

    recognition.onend = () => {
      setIsTranscribing(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsTranscribing(true);
    setTranscriptionText('');
  };

  // Detener transcripción
  const stopTranscription = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsTranscribing(false);
  };

  // Guardar transcripción en historial
  const saveTranscription = async () => {
    if (!transcriptionText.trim()) {
      setError('No hay texto para guardar');
      return;
    }

    const text = transcriptionText.trim();
    
    // Si es inglés, traducir a español; si es español, traducir a inglés
    if (transcriptionLanguage.startsWith('en')) {
      setEnglishText(text);
      // Esperar un momento antes de traducir
      setTimeout(async () => {
        await translateToSpanish();
      }, 100);
    } else {
      setSpanishText(text);
      setTimeout(async () => {
        await translateToEnglish();
      }, 100);
    }

    setTranscriptionText('');
    setError(null);
  };

  // Guardar entrada en historial
  const saveToHistory = async (spanish, english, engPron, spaPron) => {
    const entry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      spanish,
      english,
      englishPronunciation: engPron,
      spanishPronunciation: spaPron,
      groupId: selectedGroup || null,
    };

    const newHistory = [entry, ...classHistory].slice(0, 100); // Mantener solo las últimas 100
    setClassHistory(newHistory);

    try {
      if (window.electronAPI?.saveEnglishClassEntry) {
        await window.electronAPI.saveEnglishClassEntry(entry);
      }
    } catch (err) {
      console.error('Error guardando entrada:', err);
    }
  };

  // Traducir de español a inglés
  const translateToEnglish = async () => {
    if (!spanishText.trim()) {
      setError('Por favor, escribe algo en español');
      return;
    }
    
    // Limpiar resultado anterior de inglés al traducir de nuevo
    setEnglishText('');
    setEnglishPronunciation('');

    if (!aiService.hasApiKey()) {
      setError('Por favor, configura tu API key de IA en la configuración (⚙️)');
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const prompt = `Traduce el siguiente texto del español al inglés. Debe ser gramaticalmente correcto y natural. Responde SOLO con un objeto JSON con este formato exacto:
{
  "translation": "traducción en inglés",
  "pronunciation": "pronunciación fonética en inglés (usando símbolos fonéticos o guía de pronunciación simple)"
}

Texto a traducir: "${spanishText}"`;

      // Usar sendSimpleMessage para traducciones simples (no requiere formato especial)
      const response = await aiService.sendSimpleMessage(prompt, []);
      
      // La respuesta es un string directamente
      const content = typeof response === 'string' ? response.trim() : String(response || '').trim();
      
      // Intentar extraer JSON de la respuesta
      let jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        setEnglishText(result.translation || '');
        setEnglishPronunciation(result.pronunciation || '');
        
        // Guardar en historial
        await saveToHistory(spanishText, result.translation, result.pronunciation, '');
      } else {
        // Si no hay JSON, intentar extraer la traducción directamente
        setEnglishText(content);
        setEnglishPronunciation('');
        await saveToHistory(spanishText, content, '', '');
      }
    } catch (err) {
      setError(`Error al traducir: ${err.message}`);
      console.error('Error traduciendo:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Traducir de inglés a español
  const translateToSpanish = async () => {
    if (!englishText.trim()) {
      setError('Por favor, escribe algo en inglés');
      return;
    }
    
    // NO limpiar spanishText aquí - puede que el usuario haya escrito algo en español
    // Solo limpiar la pronunciación anterior
    setSpanishPronunciation('');

    if (!aiService.hasApiKey()) {
      setError('Por favor, configura tu API key de IA en la configuración (⚙️)');
      return;
    }

    setIsTranslating(true);
    setError(null);

    try {
      const prompt = `Traduce el siguiente texto del inglés al español. Debe ser gramaticalmente correcto y natural. Responde SOLO con un objeto JSON con este formato exacto:
{
  "translation": "traducción en español",
  "pronunciation": "pronunciación fonética en inglés del texto original (usando símbolos fonéticos o guía de pronunciación simple)"
}

Texto a traducir: "${englishText}"`;

      // Usar sendSimpleMessage para traducciones simples (no requiere formato especial)
      const response = await aiService.sendSimpleMessage(prompt, []);
      
      // La respuesta es un string directamente
      const content = typeof response === 'string' ? response.trim() : String(response || '').trim();
      
      // Intentar extraer JSON de la respuesta
      let jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        setSpanishText(result.translation || '');
        setSpanishPronunciation(result.pronunciation || '');
        
        // Guardar en historial
        await saveToHistory(result.translation, englishText, result.pronunciation, '');
      } else {
        // Si no hay JSON, intentar extraer la traducción directamente
        setSpanishText(content);
        setSpanishPronunciation('');
        await saveToHistory(content, englishText, '', '');
      }
    } catch (err) {
      setError(`Error al traducir: ${err.message}`);
      console.error('Error traduciendo:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Copiar texto
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // Mostrar mensaje de éxito temporal
      const originalError = error;
      setError('✅ Texto copiado al portapapeles');
      setTimeout(() => {
        if (error === '✅ Texto copiado al portapapeles') {
          setError(originalError);
        }
      }, 2000);
    } catch (err) {
      console.error('Error copiando texto:', err);
      setError('Error al copiar el texto');
    }
  };

  // Reproducir pronunciación (usando Web Speech API)
  const speakText = (text, lang = 'en-US') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Cargar imágenes guardadas
  const loadImages = async () => {
    setIsLoadingImages(true);
    try {
      if (window.electronAPI?.listEnglishClassImages) {
        const imageFiles = await window.electronAPI.listEnglishClassImages();
        const imagePromises = imageFiles.map(async (filename) => {
          if (window.electronAPI?.readEnglishClassImage) {
            const base64 = await window.electronAPI.readEnglishClassImage(filename);
            return { filename, src: base64 };
          }
          return null;
        });
        const loadedImages = (await Promise.all(imagePromises)).filter(img => img !== null);
        setImages(loadedImages);
      }
    } catch (err) {
      console.error('Error cargando imágenes:', err);
    } finally {
      setIsLoadingImages(false);
    }
  };

  // Guardar imagen desde portapapeles o archivo
  const handlePasteImage = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        await saveImage(file);
        break;
      }
    }
  };

  // Guardar imagen desde input de archivo
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await saveImage(file);
    }
    // Limpiar input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // Guardar imagen
  const saveImage = async (file) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;
        const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`;
        
        if (window.electronAPI?.saveEnglishClassImage) {
          const result = await window.electronAPI.saveEnglishClassImage(base64, filename);
          if (result.success) {
            // Recargar imágenes
            await loadImages();
          } else {
            setError(`Error al guardar imagen: ${result.error}`);
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error guardando imagen:', err);
      setError('Error al guardar la imagen');
    }
  };

  // Copiar imagen al portapapeles
  const copyImage = async (imageSrc) => {
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      // Mostrar mensaje de éxito temporal
      const originalError = error;
      setError('Imagen copiada al portapapeles');
      setTimeout(() => setError(originalError), 2000);
    } catch (err) {
      console.error('Error copiando imagen:', err);
      setError('Error al copiar la imagen');
    }
  };

  // Eliminar imagen
  const deleteImage = async (filename) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      return;
    }
    try {
      if (window.electronAPI?.deleteEnglishClassImage) {
        const result = await window.electronAPI.deleteEnglishClassImage(filename);
        if (result.success) {
          await loadImages();
        } else {
          setError(`Error al eliminar imagen: ${result.error}`);
        }
      }
    } catch (err) {
      console.error('Error eliminando imagen:', err);
      setError('Error al eliminar la imagen');
    }
  };

  // Exportar clases agrupadas por día
  const handleExportClasses = async () => {
    try {
      setError(null);
      
      if (window.electronAPI?.exportEnglishClassesByDay) {
        // Exportar en formato Markdown (más legible para estudiar)
        const result = await window.electronAPI.exportEnglishClassesByDay('markdown');
        
        if (result.success) {
          const message = `✅ Clases exportadas exitosamente!\n\n` +
            `📁 Ubicación: ${result.exportPath}\n` +
            `📄 Archivos creados: ${result.totalDays}\n` +
            `📅 Formato: Un archivo por día (Markdown)\n\n` +
            `Los archivos están listos para estudiar.`;
          
          alert(message);
          
          // También exportar JSON como respaldo
          const jsonResult = await window.electronAPI.exportEnglishClassesByDay('json');
          if (jsonResult.success) {
            console.log('✅ También se exportó en formato JSON como respaldo');
          }
        } else {
          setError(`Error al exportar: ${result.error}`);
        }
      }
    } catch (err) {
      console.error('Error exportando clases:', err);
      setError('Error al exportar las clases');
    }
  };

  // Cargar entrada del historial
  const loadHistoryEntry = (entry) => {
    setSpanishText(entry.spanish || '');
    setEnglishText(entry.english || '');
    setEnglishPronunciation(entry.englishPronunciation || '');
    setSpanishPronunciation(entry.spanishPronunciation || '');
    setShowHistory(false);
  };

  // Toggle selección de item del historial
  const toggleHistorySelection = (entryId, e) => {
    e.stopPropagation();
    setSelectedHistoryItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
    setShowHistoryActions(true);
  };

  // Seleccionar todos los elementos del historial
  const selectAllHistory = () => {
    const allIds = new Set(classHistory.map(entry => entry.id));
    setSelectedHistoryItems(allIds);
    setShowHistoryActions(true);
  };

  // Deseleccionar todos
  const deselectAllHistory = () => {
    setSelectedHistoryItems(new Set());
    setShowHistoryActions(false);
  };

  // Generar resumen de clase con elementos seleccionados
  const generateClassSummary = async (language = 'spanish') => {
    if (selectedHistoryItems.size === 0) {
      setError('Por favor, selecciona al menos un elemento del historial');
      return;
    }

    if (!aiService.hasApiKey()) {
      setError('Por favor, configura tu API key de IA en la configuración (⚙️)');
      return;
    }

    // Obtener los elementos seleccionados
    const selectedEntries = classHistory.filter(entry => selectedHistoryItems.has(entry.id));
    
    if (selectedEntries.length === 0) {
      setError('No se encontraron los elementos seleccionados');
      return;
    }

    // Construir el contexto con los elementos seleccionados (español e inglés)
    const context = selectedEntries.map((entry, index) => {
      return `${index + 1}. Español: "${entry.spanish}"\n   Inglés: "${entry.english}"${entry.englishPronunciation ? `\n   Pronunciación EN: ${entry.englishPronunciation}` : ''}${entry.spanishPronunciation ? `\n   Pronunciación ES: ${entry.spanishPronunciation}` : ''}`;
    }).join('\n\n');

    // Crear el prompt para generar un README con ambas versiones, bien estructurado y fácil de estudiar
    const userMessage = `Basándote en las siguientes traducciones que he estado aprendiendo, crea un README completo en formato Markdown que sea FÁCIL DE LEER Y ESTUDIAR. El README debe incluir AMBAS versiones (Español e Inglés) porque estamos aprendiendo.

# Estructura requerida (SIGUE ESTE FORMATO EXACTO):

# 📖 Resumen de la Clase / Class Summary

## 🇪🇸 En Español

### Conceptos Aprendidos
[Explica de forma clara y concisa los conceptos principales que se aprendieron, organizados por categorías o temas]

### Patrones Gramaticales
[Identifica y explica los patrones gramaticales importantes, con ejemplos claros]

### Vocabulario Clave
[Organiza el vocabulario por categorías o temas, usando listas claras]

### Recomendaciones de Práctica
[Proporciona recomendaciones específicas y prácticas para seguir aprendiendo]

### Puntos Importantes
[Destaca los puntos más importantes a recordar, usando viñetas claras]

---

## 🇬🇧 In English

### Learned Concepts
[Explain clearly and concisely the main concepts learned, organized by categories or topics]

### Grammatical Patterns
[Identify and explain important grammatical patterns, with clear examples]

### Key Vocabulary
[Organize vocabulary by categories or topics, using clear lists]

### Practice Recommendations
[Provide specific and practical recommendations for continued learning]

### Important Points
[Highlight the most important points to remember, using clear bullet points]

---

# 📝 Traducciones Aprendidas / Learned Translations

Organiza las traducciones en una TABLA o lista clara con las siguientes columnas:

| # | Español | English | Pronunciación (EN) |
|---|---------|---------|-------------------|
| 1 | [español] | [inglés] | [pronunciación si está disponible] |
| 2 | [español] | [inglés] | [pronunciación si está disponible] |
...

O si prefieres formato de lista, usa este formato:
- **Español:** [texto] | **English:** [text] | **Pronunciación:** [pronunciación]

---

# 💡 Notas de Aprendizaje / Learning Notes

## 🇪🇸 En Español
[Consejos útiles, observaciones importantes, tips para estudiar, etc.]

## 🇬🇧 In English
[Useful tips, important observations, study tips, etc.]

---

Traducciones aprendidas:

${context}

IMPORTANTE - INSTRUCCIONES DE FORMATO:
1. Usa separadores claros (---) entre secciones principales
2. Organiza el contenido en secciones bien definidas
3. Usa tablas para las traducciones (más fácil de leer)
4. Usa emojis para hacer el documento más visual y fácil de navegar
5. Mantén el formato consistente y profesional
6. Asegúrate de que sea FÁCIL DE LEER Y ESTUDIAR
7. Incluye TODAS las traducciones de la lista proporcionada
8. El formato debe ser limpio, organizado y profesional
9. Usa negritas (**texto**) para destacar información importante
10. Separa claramente las secciones en español e inglés`;

    // Cerrar el historial y abrir el chat de IA
    setShowHistory(false);
    setShowAIChat(true);
    setIsSendingMessage(true);
    setError(null);

    try {
      // Preparar historial de chat
      const chatHistoryForAPI = chatMessages
        .filter(msg => msg.role && msg.content)
        .map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: String(msg.content || '')
        }));

      const response = await aiService.sendSimpleMessage(userMessage, chatHistoryForAPI);
      const responseContent = typeof response === 'string' ? response : String(response || '');

      // Agregar mensajes al chat
      const newUserMessage = {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      };
      
      const aiMessage = {
        role: 'assistant',
        content: responseContent || 'No se recibió respuesta de la IA.',
        timestamp: new Date().toISOString(),
      };

      setChatMessages(prev => [...prev, newUserMessage, aiMessage]);
      
      // Limpiar selección
      setSelectedHistoryItems(new Set());
      setShowHistoryActions(false);

      // Scroll al final del chat
      setTimeout(() => {
        if (chatMessagesRef.current) {
          chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
      }, 100);
    } catch (err) {
      setError(`Error al generar resumen: ${err.message}`);
      console.error('Error generando resumen:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Enviar elementos seleccionados a la IA
  const sendSelectedToAI = async (language = 'spanish') => {
    if (selectedHistoryItems.size === 0) {
      setError('Por favor, selecciona al menos un elemento del historial');
      return;
    }

    if (!aiService.hasApiKey()) {
      setError('Por favor, configura tu API key de IA en la configuración (⚙️)');
      return;
    }

    // Obtener los elementos seleccionados
    const selectedEntries = classHistory.filter(entry => selectedHistoryItems.has(entry.id));
    
    if (selectedEntries.length === 0) {
      setError('No se encontraron los elementos seleccionados');
      return;
    }

    // Construir el contexto con los elementos seleccionados
    const context = selectedEntries.map((entry, index) => {
      return `${index + 1}. Español: "${entry.spanish}"\n   Inglés: "${entry.english}"${entry.englishPronunciation ? `\n   Pronunciación: ${entry.englishPronunciation}` : ''}`;
    }).join('\n\n');

    // Crear el prompt según el idioma
    let userMessage;
    if (language === 'spanish') {
      userMessage = `Basándote en las siguientes traducciones que he estado aprendiendo, crea una pregunta o ejercicio que me ayude a practicar y consolidar este conocimiento. Puedes crear:\n- Preguntas de comprensión\n- Ejercicios de práctica\n- Explicaciones gramaticales\n- Ejemplos adicionales relacionados\n\nTraducciones aprendidas:\n\n${context}\n\nPor favor, crea contenido educativo útil y práctico en español.`;
    } else {
      userMessage = `Based on the following translations I've been learning, create a question or exercise that helps me practice and consolidate this knowledge. You can create:\n- Comprehension questions\n- Practice exercises\n- Grammar explanations\n- Additional related examples\n\nLearned translations:\n\n${context}\n\nPlease create useful and practical educational content in English.`;
    }

    // Cerrar el historial y abrir el chat de IA
    setShowHistory(false);
    setShowAIChat(true);
    setIsSendingMessage(true);
    setError(null);

    try {
      // Preparar historial de chat
      const chatHistoryForAPI = chatMessages
        .filter(msg => msg.role && msg.content)
        .map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: String(msg.content || '')
        }));

      const response = await aiService.sendSimpleMessage(userMessage, chatHistoryForAPI);
      const responseContent = typeof response === 'string' ? response : String(response || '');

      // Agregar mensajes al chat
      const newUserMessage = {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      };
      
      const aiMessage = {
        role: 'assistant',
        content: responseContent || 'No se recibió respuesta de la IA.',
        timestamp: new Date().toISOString(),
      };

      setChatMessages(prev => [...prev, newUserMessage, aiMessage]);
      
      // Limpiar selección
      setSelectedHistoryItems(new Set());
      setShowHistoryActions(false);

      // Scroll al final del chat
      setTimeout(() => {
        if (chatMessagesRef.current) {
          chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
      }, 100);
    } catch (err) {
      setError(`Error al enviar a la IA: ${err.message}`);
      console.error('Error enviando seleccionados a IA:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Enviar mensaje al chat de IA
  const sendChatMessage = async () => {
    if (!chatInput.trim() || isSendingMessage) return;

    if (!aiService.hasApiKey()) {
      setError('Por favor, configura tu API key de IA en la configuración (⚙️)');
      return;
    }

    const userMessage = chatInput.trim();
    setChatInput('');
    setIsSendingMessage(true);
    setError(null);

    // Agregar mensaje del usuario
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, newUserMessage]);

    try {
      // Construir contexto del historial de clases
      const historyContext = classHistory.slice(0, 10).map(entry => 
        `ES: ${entry.spanish}\nEN: ${entry.english}`
      ).join('\n\n');

      const systemPrompt = `Eres un tutor de inglés experto y amigable. Ayudas a estudiantes a aprender inglés de manera efectiva.

${historyContext ? `Historial reciente de traducciones del estudiante:\n${historyContext}\n\n` : ''}

Instrucciones:
- Responde de manera clara y didáctica
- Explica conceptos gramaticales cuando sea relevante
- Proporciona ejemplos prácticos
- Corrige errores de manera constructiva
- Usa un tono amigable y alentador
- Si el estudiante pregunta sobre una palabra o frase, proporciona:
  * Traducción
  * Pronunciación
  * Ejemplos de uso
  * Notas gramaticales si es relevante

Responde en español, pero cuando des ejemplos en inglés, asegúrate de que sean correctos.`;

      // Preparar historial de chat (solo user y assistant, sin system)
      const chatHistoryForAPI = chatMessages
        .filter(msg => msg.role && msg.content)
        .map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: String(msg.content || '')
        }));

      // Usar sendSimpleMessage que está diseñado para chats
      // Incluir el system prompt y contexto en el primer mensaje si no hay historial
      let messageToSend = userMessage;
      if (chatHistoryForAPI.length === 0) {
        // Si es el primer mensaje, incluir el contexto completo
        messageToSend = `${systemPrompt}\n\nPregunta del estudiante: ${userMessage}`;
      } else {
        // Si hay historial, solo agregar contexto relevante al mensaje actual
        if (historyContext) {
          messageToSend = `[Contexto de clases anteriores: ${historyContext}]\n\n${userMessage}`;
        }
      }

      const response = await aiService.sendSimpleMessage(messageToSend, chatHistoryForAPI);
      const responseContent = typeof response === 'string' ? response : String(response || '');

      // Agregar respuesta de la IA
      const aiMessage = {
        role: 'assistant',
        content: responseContent || 'No se recibió respuesta de la IA.',
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setError(`Error al enviar mensaje: ${err.message}`);
      console.error('Error en chat:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Scroll automático al final del chat
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Manejar pantalla completa
  useEffect(() => {
    if (isFullscreen && fullscreenRef.current) {
      fullscreenRef.current.requestFullscreen?.() || 
      fullscreenRef.current.webkitRequestFullscreen?.() ||
      fullscreenRef.current.msRequestFullscreen?.();
    }
  }, [isFullscreen]);

  return (
    <NodeViewWrapper className="ingles-node">
      <div 
        ref={fullscreenRef}
        className={`ingles-container ${isFullscreen ? 'fullscreen' : ''}`}
        style={{
          border: isDarkMode ? '1px solid #4b5563' : '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '16px',
          margin: '16px 0',
          backgroundColor: isDarkMode ? '#1f2937' : '#fafafa',
          color: isDarkMode ? '#f3f4f6' : '#111827',
          position: isFullscreen ? 'fixed' : 'relative',
          top: isFullscreen ? 0 : 'auto',
          left: isFullscreen ? 0 : 'auto',
          width: isFullscreen ? '100vw' : '100%',
          height: isFullscreen ? '100vh' : 'auto',
          zIndex: isFullscreen ? 9999 : 'auto',
        }}
      >
        <BlockWithDeleteButton editor={editor} getPos={getPos} />
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <Languages size={20} style={{ color: '#6366f1' }} />
            <h3 style={{ margin: 0, fontSize: window.innerWidth < 768 ? '16px' : '18px', fontWeight: '600', color: isDarkMode ? '#f3f4f6' : '#111827' }}>Clases de Inglés</h3>
            
            {/* Menú desplegable - Movido a la izquierda para evitar eliminaciones accidentales */}
            <div style={{ position: 'relative', marginLeft: 'auto', marginRight: '8px' }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  padding: '6px 10px',
                  border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: showMenu ? (isDarkMode ? '#374151' : '#f3f4f6') : (isDarkMode ? '#374151' : 'white'),
                  color: isDarkMode ? '#f3f4f6' : '#111827',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '36px',
                  height: '32px',
                }}
                title="Más opciones"
              >
                <MoreVertical size={16} />
              </button>
              
              {showMenu && (
                <>
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 998,
                    }}
                    onClick={() => setShowMenu(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '4px',
                      backgroundColor: isDarkMode ? '#1f2937' : 'white',
                      border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      zIndex: 999,
                      minWidth: '180px',
                      padding: '4px',
                    }}
                  >
                    <button
                      onClick={() => {
                        setIsFullscreen(!isFullscreen);
                        setShowMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        color: isDarkMode ? '#f3f4f6' : '#111827',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                      {isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
                    </button>
                    <button
                      onClick={() => {
                        imageInputRef.current?.click();
                        setShowMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        color: isDarkMode ? '#f3f4f6' : '#111827',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <ImageIcon size={16} />
                      Imágenes
                    </button>
                    <button
                      onClick={() => {
                        handleExportClasses();
                        setShowMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        color: isDarkMode ? '#f3f4f6' : '#111827',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Download size={16} />
                      Exportar clases
                    </button>
                    <button
                      onClick={() => {
                        handleSelectFolder();
                        setShowMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        color: isDarkMode ? '#f3f4f6' : '#111827',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Upload size={16} />
                      Carpeta
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Botones principales - siempre visibles */}
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              style={{
                padding: '6px 10px',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: showAIChat ? '#6366f1' : (isDarkMode ? '#374151' : 'white'),
                color: showAIChat ? 'white' : (isDarkMode ? '#f3f4f6' : 'inherit'),
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}
              title="Asistente IA"
            >
              <Sparkles size={14} />
              <span style={{ display: window.innerWidth < 768 ? 'none' : 'inline' }}>IA</span>
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                padding: '6px 10px',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: isDarkMode ? '#374151' : 'white',
                color: isDarkMode ? '#f3f4f6' : 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}
              title="Historial"
            >
              <History size={14} />
              <span style={{ display: window.innerWidth < 768 ? 'none' : 'inline' }}>Historial</span>
            </button>
            <button
              onClick={async () => {
                setShowLearningApp(true);
                await loadLearningData();
                // Scroll automático después de que se renderice
                setTimeout(() => {
                  if (learningAppRef.current) {
                    learningAppRef.current.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'start' 
                    });
                  }
                }, 100);
              }}
              style={{
                padding: '6px 10px',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: showLearningApp ? '#10b981' : (isDarkMode ? '#374151' : 'white'),
                color: showLearningApp ? 'white' : (isDarkMode ? '#f3f4f6' : 'inherit'),
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                fontWeight: showLearningApp ? '600' : 'normal',
              }}
              title="Aplicación de Aprendizaje"
            >
              <Play size={14} />
              <span style={{ display: window.innerWidth < 768 ? 'none' : 'inline' }}>Aprender</span>
            </button>
          </div>
        </div>
        
        {/* Información de carpeta */}
        {classesFolder && (
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#0369a1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ flex: 1 }}>
              <strong>Carpeta:</strong> {classesFolder.path}
              {classesFolder.isCustom && (
                <button
                  onClick={handleResetFolder}
                  style={{
                    marginLeft: '8px',
                    padding: '2px 6px',
                    border: '1px solid #0369a1',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    color: '#0369a1',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                  title="Usar carpeta por defecto"
                >
                  Restablecer
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2',
            border: isDarkMode ? '1px solid #991b1b' : '1px solid #fecaca',
            borderRadius: '6px',
            color: isDarkMode ? '#fca5a5' : '#991b1b',
            marginBottom: '16px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* Selector de grupos */}
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: isDarkMode ? '#1f2937' : 'white',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '14px', color: isDarkMode ? '#f3f4f6' : '#374151' }}>Grupo</label>
            <button
              onClick={() => setShowGroupModal(true)}
              style={{
                padding: '4px 8px',
                border: '1px solid #6366f1',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                color: '#6366f1',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              + Nuevo grupo
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedGroup(null)}
              style={{
                padding: '6px 12px',
                border: selectedGroup === null ? '2px solid #6366f1' : (isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db'),
                borderRadius: '6px',
                backgroundColor: selectedGroup === null ? (isDarkMode ? '#374151' : '#eef2ff') : (isDarkMode ? '#374151' : 'white'),
                color: isDarkMode ? '#f3f4f6' : '#111827',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Sin grupo
            </button>
            {groups.map((group) => (
              <div key={group.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => setSelectedGroup(group.id)}
                  style={{
                    padding: '6px 12px',
                    border: selectedGroup === group.id ? '2px solid #6366f1' : (isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db'),
                    borderRadius: '6px',
                    backgroundColor: selectedGroup === group.id ? (isDarkMode ? '#374151' : '#eef2ff') : (isDarkMode ? '#374151' : 'white'),
                    color: isDarkMode ? '#f3f4f6' : '#111827',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  {group.name}
                </button>
                <button
                  onClick={() => deleteGroup(group.id)}
                  style={{
                    padding: '4px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    color: '#dc2626',
                    cursor: 'pointer',
                  }}
                  title="Eliminar grupo"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Transcripción de voz */}
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: isDarkMode ? '#1f2937' : 'white',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '14px', color: isDarkMode ? '#f3f4f6' : '#374151' }}>Transcripción de Voz</label>
            <select
              value={transcriptionLanguage}
              onChange={(e) => setTranscriptionLanguage(e.target.value)}
              disabled={isTranscribing}
              style={{
                padding: '4px 8px',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: isDarkMode ? '#374151' : 'white',
                color: isDarkMode ? '#f3f4f6' : '#111827',
                fontSize: '12px',
              }}
            >
              <option value="es-ES">Español</option>
              <option value="en-US">English</option>
            </select>
          </div>
          {transcriptionText && (
            <div style={{
              marginBottom: '8px',
              padding: '8px',
              backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
              borderRadius: '6px',
              fontSize: '14px',
              color: isDarkMode ? '#f3f4f6' : '#111827',
              minHeight: '40px',
            }}>
              {transcriptionText}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isTranscribing ? (
              <button
                onClick={startTranscription}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                }}
              >
                <Volume2 size={16} />
                Iniciar transcripción
              </button>
            ) : (
              <button
                onClick={stopTranscription}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                }}
              >
                <X size={16} />
                Detener
              </button>
            )}
            {transcriptionText && (
              <>
                <button
                  onClick={saveTranscription}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                  }}
                >
                  <Save size={16} />
                  Guardar y traducir
                </button>
                <button
                  onClick={() => setTranscriptionText('')}
                  style={{
                    padding: '8px 16px',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    color: isDarkMode ? '#f3f4f6' : '#111827',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Limpiar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Spanish to English */}
          <div style={{
            border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: isDarkMode ? '#1f2937' : 'white',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px', color: isDarkMode ? '#f3f4f6' : '#374151' }}>Español → Inglés</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setSpanishText('');
                    setEnglishText('');
                    setEnglishPronunciation('');
                    setSpanishPronunciation('');
                    setError(null);
                  }}
                  disabled={!spanishText.trim() && !englishText.trim()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: (!spanishText.trim() && !englishText.trim()) ? (isDarkMode ? '#374151' : '#f3f4f6') : (isDarkMode ? '#4b5563' : '#e5e7eb'),
                    color: (!spanishText.trim() && !englishText.trim()) ? (isDarkMode ? '#6b7280' : '#9ca3af') : (isDarkMode ? '#f3f4f6' : '#374151'),
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: (!spanishText.trim() && !englishText.trim()) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                  title="Limpiar campos"
                >
                  <X size={16} />
                  Limpiar
                </button>
                <button
                  onClick={translateToEnglish}
                  disabled={isTranslating || !spanishText.trim()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: isTranslating || !spanishText.trim() ? '#d1d5db' : '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isTranslating || !spanishText.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  {isTranslating ? (
                    <>
                      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Traduciendo...
                    </>
                  ) : (
                    <>
                      <ArrowRight size={16} />
                      Traducir
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              ref={spanishInputRef}
              value={spanishText}
              onChange={(e) => {
                setSpanishText(e.target.value);
                // NO traducir automáticamente - solo cuando el usuario haga clic en "Traducir"
              }}
              placeholder="Escribe en español..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                backgroundColor: isDarkMode ? '#374151' : 'white',
                color: isDarkMode ? '#f3f4f6' : '#111827',
              }}
            />
          </div>

          {/* English result - Solo mostrar si hay traducción realizada (tiene pronunciación) */}
          {englishText && englishPronunciation && (
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#f0f9ff',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>Inglés</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {englishPronunciation && (
                    <button
                      onClick={() => speakText(englishText, 'en-US')}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                      }}
                    >
                      <Volume2 size={16} />
                      Pronunciar
                    </button>
                  )}
                  <button
                    onClick={() => copyText(englishText)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                    }}
                  >
                    <Copy size={16} />
                    Copiar
                  </button>
                </div>
              </div>












              <div style={{
                padding: '12px',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                minHeight: '60px',
                marginBottom: '8px',
              }}>
                {englishText}
              </div>
              {englishPronunciation && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#92400e',
                  fontStyle: 'italic',
                }}>
                  <strong>Pronunciación:</strong> {englishPronunciation}
                </div>
              )}
            </div>
          )}

          {/* English to Spanish */}
          <div style={{
            border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: isDarkMode ? '#1f2937' : 'white',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px', color: isDarkMode ? '#f3f4f6' : '#374151' }}>Inglés → Español</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setEnglishText('');
                    setSpanishText('');
                    setSpanishPronunciation('');
                    setEnglishPronunciation('');
                    setError(null);
                  }}
                  disabled={!englishText.trim() && !spanishText.trim()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: (!englishText.trim() && !spanishText.trim()) ? (isDarkMode ? '#374151' : '#f3f4f6') : (isDarkMode ? '#4b5563' : '#e5e7eb'),
                    color: (!englishText.trim() && !spanishText.trim()) ? (isDarkMode ? '#6b7280' : '#9ca3af') : (isDarkMode ? '#f3f4f6' : '#374151'),
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: (!englishText.trim() && !spanishText.trim()) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                  title="Limpiar campos"
                >
                  <X size={16} />
                  Limpiar
                </button>
                <button
                  onClick={translateToSpanish}
                  disabled={isTranslating || !englishText.trim()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: isTranslating || !englishText.trim() ? '#d1d5db' : '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isTranslating || !englishText.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  {isTranslating ? (
                    <>
                      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Traduciendo...
                    </>
                  ) : (
                    <>
                      <ArrowLeft size={16} />
                      Traducir
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              ref={englishInputRef}
              value={englishText}
              onChange={(e) => setEnglishText(e.target.value)}
              placeholder="Write in English..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                backgroundColor: isDarkMode ? '#374151' : 'white',
                color: isDarkMode ? '#f3f4f6' : '#111827',
              }}
            />
          </div>

          {/* Spanish result - Solo mostrar si hay traducción realizada (tiene pronunciación) */}
          {spanishText && spanishPronunciation && (
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#f0f9ff',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>Español</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {spanishPronunciation && (
                    <button
                      onClick={() => speakText(englishText, 'en-US')}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '14px',
                      }}
                    >
                      <Volume2 size={16} />
                      Pronunciar (EN)
                    </button>
                  )}
                  <button
                    onClick={() => copyText(spanishText)}
                    style={{
                      padding: '6px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                    }}
                  >
                    <Copy size={16} />
                    Copiar
                  </button>
                </div>
              </div>
              <div style={{
                padding: '12px',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                minHeight: '60px',
                marginBottom: '8px',
              }}>
                {spanishText}
              </div>
              {spanishPronunciation && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#92400e',
                  fontStyle: 'italic',
                }}>
                  <strong>Pronunciación (EN):</strong> {spanishPronunciation}
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Chat Panel */}
        {showAIChat && (
          <div style={{
            border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: isDarkMode ? '#1f2937' : 'white',
            marginTop: '20px',
            display: 'flex',
            flexDirection: 'column',
            height: '400px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: '#6366f1' }} />
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: isDarkMode ? '#f3f4f6' : '#111827' }}>Asistente de Inglés</h4>
              </div>
              <button
                onClick={() => setShowAIChat(false)}
                style={{
                  padding: '4px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: isDarkMode ? '#f3f4f6' : '#111827',
                }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div
              ref={chatMessagesRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px',
                backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
                borderRadius: '6px',
                marginBottom: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {chatMessages.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: isDarkMode ? '#9ca3af' : '#6b7280',
                  padding: '40px 20px',
                  fontSize: '14px',
                }}>
                  <Sparkles size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ margin: 0, marginBottom: '8px' }}>¡Hola! Soy tu asistente de inglés.</p>
                  <p style={{ margin: 0, fontSize: '13px' }}>
                    Puedes preguntarme sobre gramática, vocabulario, pronunciación, o cualquier duda sobre inglés.
                  </p>
                  <div style={{ marginTop: '16px', textAlign: 'left', display: 'inline-block' }}>
                    <p style={{ margin: '4px 0', fontSize: '12px', color: isDarkMode ? '#6b7280' : '#9ca3af' }}>Ejemplos de preguntas:</p>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                      <li>"¿Cuál es la diferencia entre 'say' y 'tell'?"</li>
                      <li>"Explícame el presente perfecto"</li>
                      <li>"¿Cómo se pronuncia 'through'?"</li>
                      <li>"Dame ejemplos de phrasal verbs con 'get'"</li>
                    </ul>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        maxWidth: '80%',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          backgroundColor: msg.role === 'user' ? '#6366f1' : (isDarkMode ? '#374151' : 'white'),
                          color: msg.role === 'user' ? 'white' : (isDarkMode ? '#f3f4f6' : '#374151'),
                          fontSize: '14px',
                          lineHeight: '1.5',
                          border: msg.role === 'assistant' ? (isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb') : 'none',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {msg.content}
                      </div>
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => copyText(msg.content)}
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            padding: '4px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(4px)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '24px',
                            height: '24px',
                            minWidth: '24px',
                            color: '#6b7280',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            transition: 'all 0.15s ease',
                            opacity: 0.7,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                            e.currentTarget.style.color = '#374151';
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.borderColor = '#d1d5db';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                            e.currentTarget.style.color = '#6b7280';
                            e.currentTarget.style.opacity = '0.7';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }}
                          title="Copiar respuesta"
                        >
                          <Copy size={12} />
                        </button>
                      )}
                    </div>
                    <span style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                      marginTop: '4px',
                      padding: '0 4px',
                    }}>
                      {new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
              {isSendingMessage && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                }}>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '12px',
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      fontSize: '14px',
                      color: '#6b7280',
                    }}
                  >
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                    {' '}Pensando...
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendChatMessage();
                  }
                }}
                placeholder="Pregunta sobre inglés, gramática, vocabulario..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: isDarkMode ? '#374151' : 'white',
                  color: isDarkMode ? '#f3f4f6' : '#111827',
                }}
                disabled={isSendingMessage}
              />
              <button
                onClick={sendChatMessage}
                disabled={isSendingMessage || !chatInput.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: isSendingMessage || !chatInput.trim() ? '#d1d5db' : '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isSendingMessage || !chatInput.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}

        {/* History modal */}
        {showHistory && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }} onClick={() => setShowHistory(false)}>
            <div style={{
              backgroundColor: isDarkMode ? '#1f2937' : 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '800px',
              maxHeight: '80vh',
              overflow: 'auto',
              width: '90%',
              border: isDarkMode ? '1px solid #4b5563' : 'none',
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: isDarkMode ? '#f3f4f6' : '#111827' }}>Historial de Clases</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {classHistory.length > 0 && (
                    <button
                      onClick={() => {
                        if (selectedHistoryItems.size === classHistory.length) {
                          deselectAllHistory();
                        } else {
                          selectAllHistory();
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {selectedHistoryItems.size === classHistory.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                    </button>
                  )}
                  {selectedHistoryItems.size > 0 && (
                    <span style={{ fontSize: '14px', color: '#6366f1', fontWeight: '500' }}>
                      {selectedHistoryItems.size} seleccionado{selectedHistoryItems.size !== 1 ? 's' : ''}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setShowHistory(false);
                      setSelectedHistoryItems(new Set());
                      setShowHistoryActions(false);
                    }}
                    style={{
                      padding: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              {/* Botones de acción cuando hay elementos seleccionados */}
              {selectedHistoryItems.size > 0 && (
                <div style={{
                  padding: '12px',
                  backgroundColor: isDarkMode ? '#1e3a5f' : '#f0f9ff',
                  border: isDarkMode ? '1px solid #3b82f6' : '1px solid #bae6fd',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}>
                  <button
                    onClick={() => generateClassSummary('spanish')}
                    disabled={isSendingMessage}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: isSendingMessage ? '#d1d5db' : '#8b5cf6',
                      color: 'white',
                      cursor: isSendingMessage ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                    title="Generar resumen completo de la clase en español"
                  >
                    <BookOpen size={16} />
                    Resumen (ES)
                  </button>
                  <button
                    onClick={() => generateClassSummary('english')}
                    disabled={isSendingMessage}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: isSendingMessage ? '#d1d5db' : '#8b5cf6',
                      color: 'white',
                      cursor: isSendingMessage ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                    title="Generate complete class summary in English"
                  >
                    <BookOpen size={16} />
                    Summary (EN)
                  </button>
                  <button
                    onClick={() => sendSelectedToAI('spanish')}
                    disabled={isSendingMessage}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: isSendingMessage ? '#d1d5db' : '#6366f1',
                      color: 'white',
                      cursor: isSendingMessage ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                    title="Crear preguntas/ejercicios en español"
                  >
                    <Sparkles size={16} />
                    Ejercicios (ES)
                  </button>
                  <button
                    onClick={() => sendSelectedToAI('english')}
                    disabled={isSendingMessage}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: isSendingMessage ? '#d1d5db' : '#10b981',
                      color: 'white',
                      cursor: isSendingMessage ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                    title="Create questions/exercises in English"
                  >
                    <Sparkles size={16} />
                    Exercises (EN)
                  </button>
                  <button
                    onClick={deselectAllHistory}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Deseleccionar todo
                  </button>
                </div>
              )}
              {isLoadingHistory ? (
                <div style={{ textAlign: 'center', padding: '40px', color: isDarkMode ? '#f3f4f6' : '#111827' }}>Cargando...</div>
              ) : classHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                  No hay historial aún. Las traducciones se guardarán automáticamente.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {classHistory.map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => {
                        if (!selectedHistoryItems.has(entry.id)) {
                          loadHistoryEntry(entry);
                        }
                      }}
                      style={{
                        border: selectedHistoryItems.has(entry.id) ? '2px solid #6366f1' : (isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb'),
                        borderRadius: '6px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: selectedHistoryItems.has(entry.id) ? (isDarkMode ? '#374151' : '#eef2ff') : (isDarkMode ? '#374151' : 'white'),
                      }}
                      onMouseEnter={(e) => {
                        if (!selectedHistoryItems.has(entry.id)) {
                          e.currentTarget.style.backgroundColor = isDarkMode ? '#4b5563' : '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedHistoryItems.has(entry.id)) {
                          e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : 'white';
                        }
                      }}
                    >
                      {/* Checkbox para selección */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="checkbox"
                          checked={selectedHistoryItems.has(entry.id)}
                          onChange={(e) => toggleHistorySelection(entry.id, e)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            marginTop: '2px',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>
                              {new Date(entry.timestamp).toLocaleString('es-ES')}
                            </span>
                          </div>
                      <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                          <strong style={{ color: '#6366f1' }}>ES:</strong> {entry.spanish}
                        </div>
                        {entry.spanish && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              speakText(entry.spanish, 'es-ES');
                            }}
                            style={{
                              padding: '4px 8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              color: '#6366f1',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f3f4f6';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                            }}
                            title="Escuchar pronunciación en español"
                          >
                            <Volume2 size={12} />
                            Escuchar
                          </button>
                        )}
                        {entry.spanishPronunciation && (
                          <div style={{ 
                            marginTop: '4px', 
                            fontSize: '12px', 
                            color: isDarkMode ? '#fbbf24' : '#92400e',
                            fontStyle: 'italic',
                            padding: '4px 8px',
                            backgroundColor: isDarkMode ? '#78350f' : '#fef3c7',
                            borderRadius: '4px',
                            display: 'inline-block',
                            width: '100%'
                          }}>
                            🔊 {entry.spanishPronunciation}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, color: isDarkMode ? '#f3f4f6' : '#111827' }}>
                          <strong style={{ color: '#10b981' }}>EN:</strong> {entry.english}
                        </div>
                        {entry.english && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              speakText(entry.english, 'en-US');
                            }}
                            style={{
                              padding: '4px 8px',
                              border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                              borderRadius: '4px',
                              backgroundColor: isDarkMode ? '#1f2937' : 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              color: '#10b981',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = isDarkMode ? '#1f2937' : 'white';
                            }}
                            title="Escuchar pronunciación en inglés"
                          >
                            <Volume2 size={12} />
                            Escuchar
                          </button>
                        )}
                        {entry.englishPronunciation && (
                          <div style={{ 
                            marginTop: '4px', 
                            fontSize: '12px', 
                            color: isDarkMode ? '#fbbf24' : '#92400e',
                            fontStyle: 'italic',
                            padding: '4px 8px',
                            backgroundColor: isDarkMode ? '#78350f' : '#fef3c7',
                            borderRadius: '4px',
                            display: 'inline-block',
                            width: '100%'
                          }}>
                            🔊 {entry.englishPronunciation}
                          </div>
                        )}
                      </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Galería de imágenes */}
        {images.length > 0 && (
          <div style={{
            border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: isDarkMode ? '#1f2937' : 'white',
            marginTop: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: isDarkMode ? '#f3f4f6' : '#111827' }}>Imágenes Guardadas</h4>
              <span style={{ fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                {images.length} imagen{images.length !== 1 ? 'es' : ''}
              </span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '12px',
            }}>
              {images.map((img) => (
                <div
                  key={img.filename}
                  style={{
                    position: 'relative',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setSelectedImage(img);
                    setShowImagePreview(true);
                  }}
                >
                  <img
                    src={img.src}
                    alt={img.filename}
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                    }}
                    title="Clic para ver en grande"
                  />
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    display: 'flex',
                    gap: '4px',
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyImage(img.src);
                      }}
                      style={{
                        padding: '4px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Copiar"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteImage(img.filename);
                      }}
                      style={{
                        padding: '4px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(220,38,38,0.8)',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Eliminar"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: '12px',
              padding: '8px',
              backgroundColor: isDarkMode ? '#1e3a5f' : '#f0f9ff',
              borderRadius: '6px',
              fontSize: '12px',
              color: isDarkMode ? '#93c5fd' : '#0369a1',
            }}>
              💡 <strong>Tip:</strong> Puedes pegar imágenes desde el portapapeles (Ctrl+V) o hacer clic en "Imágenes" para subir archivos.
            </div>
          </div>
        )}

        {/* Modal para crear grupo */}
        {showGroupModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
            }}
            onClick={() => setShowGroupModal(false)}
          >
            <div
              style={{
                backgroundColor: isDarkMode ? '#1f2937' : 'white',
                borderRadius: '8px',
                padding: '24px',
                maxWidth: '400px',
                width: '90%',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: isDarkMode ? '#f3f4f6' : '#111827' }}>
                Crear Nuevo Grupo
              </h3>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Ej: Saludos, Verbos, Comida..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  marginBottom: '16px',
                  backgroundColor: isDarkMode ? '#374151' : 'white',
                  color: isDarkMode ? '#f3f4f6' : '#111827',
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    createGroup();
                  }
                }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowGroupModal(false);
                    setNewGroupName('');
                  }}
                  style={{
                    padding: '8px 16px',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    color: isDarkMode ? '#f3f4f6' : '#111827',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={createGroup}
                  disabled={!newGroupName.trim()}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: !newGroupName.trim() ? '#d1d5db' : '#6366f1',
                    color: 'white',
                    cursor: !newGroupName.trim() ? 'not-allowed' : 'pointer',
                  }}
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de previsualización de imagen */}
        {showImagePreview && selectedImage && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
            onClick={() => {
              setShowImagePreview(false);
              setSelectedImage(null);
            }}
          >
            <div
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage.src}
                alt={selectedImage.filename}
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
              />
              <div
                style={{
                  marginTop: '16px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                }}
              >
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedImage.src;
                    link.download = selectedImage.filename;
                    link.click();
                  }}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                  }}
                >
                  <Download size={16} />
                  Descargar
                </button>
                <button
                  onClick={() => {
                    deleteImage(selectedImage.filename);
                    setShowImagePreview(false);
                    setSelectedImage(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                  }}
                >
                  <Trash2 size={16} />
                  Eliminar
                </button>
                <button
                  onClick={() => {
                    setShowImagePreview(false);
                    setSelectedImage(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #6b7280',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                  }}
                >
                  <X size={16} />
                  Cerrar
                </button>
              </div>
              <div
                style={{
                  marginTop: '12px',
                  color: 'white',
                  fontSize: '12px',
                  opacity: 0.7,
                }}
              >
                {selectedImage.filename}
              </div>
            </div>
          </div>
        )}

        {/* Aplicación de Aprendizaje (Tipo Duolingo) */}
        {showLearningApp && (
          <div
            ref={learningAppRef}
            style={{
              position: isFullscreen ? 'fixed' : 'relative',
              top: isFullscreen ? 0 : 'auto',
              left: isFullscreen ? 0 : 'auto',
              right: isFullscreen ? 0 : 'auto',
              bottom: isFullscreen ? 0 : 'auto',
              width: isFullscreen ? '100vw' : '100%',
              height: isFullscreen ? '100vh' : 'auto',
              minHeight: isFullscreen ? '100vh' : '600px',
              backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
              zIndex: isFullscreen ? 10001 : 'auto',
              display: 'flex',
              flexDirection: 'column',
              padding: isFullscreen ? '20px' : '16px',
              marginTop: isFullscreen ? 0 : '20px',
              borderRadius: isFullscreen ? 0 : '8px',
              border: isFullscreen ? 'none' : (isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb'),
            }}
          >
            {/* Header de la aplicación */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 'bold',
                }}>
                  {progress?.level || 1}
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: isDarkMode ? '#9ca3af' : '#6b7280', marginBottom: '4px' }}>
                    Nivel {progress?.level || 1}
                  </div>
                  <div style={{
                    width: '200px',
                    height: '8px',
                    backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${progress ? (progress.xp / progress.xpToNextLevel * 100) : 0}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#6b7280', marginTop: '4px' }}>
                    {progress?.xp || 0} / {progress?.xpToNextLevel || 100} XP
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {progress && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: isDarkMode ? '#1f2937' : 'white', borderRadius: '8px', border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb' }}>
                      <Flame size={20} style={{ color: '#f59e0b' }} />
                      <span style={{ fontSize: '16px', fontWeight: '600', color: isDarkMode ? '#f3f4f6' : '#111827' }}>
                        {progress.currentStreak || 0}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: isDarkMode ? '#1f2937' : 'white', borderRadius: '8px', border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb' }}>
                      <Trophy size={20} style={{ color: '#fbbf24' }} />
                      <span style={{ fontSize: '16px', fontWeight: '600', color: isDarkMode ? '#f3f4f6' : '#111827' }}>
                        {progress.totalCardsReviewed || 0}
                      </span>
                    </div>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowLearningApp(false);
                    setCurrentCard(null);
                    setCardFlipped(false);
                    setShowAnswer(false);
                  }}
                  style={{
                    padding: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    color: isDarkMode ? '#f3f4f6' : '#111827',
                  }}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Contenido principal */}
            {!currentCard ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                padding: '40px',
              }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}>
                  <Play size={48} style={{ color: 'white' }} />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: '600', color: isDarkMode ? '#f3f4f6' : '#111827', margin: 0 }}>
                  ¡Comienza a aprender!
                </h2>
                <p style={{ fontSize: '16px', color: isDarkMode ? '#9ca3af' : '#6b7280', textAlign: 'center', maxWidth: '500px' }}>
                  {cardsToReview.length === 0 
                    ? 'No hay tarjetas para revisar. Crea traducciones primero o genera tarjetas desde tu historial.'
                    : `Tienes ${cardsToReview.length} tarjetas listas para revisar.`}
                </p>
                <button
                  onClick={startStudySession}
                  style={{
                    padding: '16px 32px',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '18px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px rgba(99, 102, 241, 0.3)',
                  }}
                >
                  <Play size={20} />
                  {cardsToReview.length === 0 ? 'Crear Tarjetas y Empezar' : 'Comenzar Sesión'}
                </button>
                
                {stats && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    width: '100%',
                    maxWidth: '800px',
                    marginTop: '32px',
                  }}>
                    <div style={{
                      padding: '20px',
                      backgroundColor: isDarkMode ? '#1f2937' : 'white',
                      borderRadius: '12px',
                      border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                    }}>
                      <div style={{ fontSize: '14px', color: isDarkMode ? '#9ca3af' : '#6b7280', marginBottom: '8px' }}>Total Tarjetas</div>
                      <div style={{ fontSize: '32px', fontWeight: '700', color: isDarkMode ? '#f3f4f6' : '#111827' }}>
                        {stats.totalCards || 0}
                      </div>
                    </div>
                    <div style={{
                      padding: '20px',
                      backgroundColor: isDarkMode ? '#1f2937' : 'white',
                      borderRadius: '12px',
                      border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                    }}>
                      <div style={{ fontSize: '14px', color: isDarkMode ? '#9ca3af' : '#6b7280', marginBottom: '8px' }}>Para Revisar</div>
                      <div style={{ fontSize: '32px', fontWeight: '700', color: '#6366f1' }}>
                        {stats.cardsToReview || 0}
                      </div>
                    </div>
                    <div style={{
                      padding: '20px',
                      backgroundColor: isDarkMode ? '#1f2937' : 'white',
                      borderRadius: '12px',
                      border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                    }}>
                      <div style={{ fontSize: '14px', color: isDarkMode ? '#9ca3af' : '#6b7280', marginBottom: '8px' }}>Tasa de Éxito</div>
                      <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>
                        {stats.averageSuccessRate || 0}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                padding: '20px',
              }}>
                {/* Barra de progreso de sesión */}
                <div style={{ width: '100%', maxWidth: '600px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                  }}>
                    <span>Tarjeta {currentCardIndex + 1} de {cardsToReview.length}</span>
                    <span>{sessionStats.reviewed} revisadas</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${((currentCardIndex + 1) / cardsToReview.length) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>

                {/* Tarjeta (Flashcard) */}
                <div
                  onClick={flipCard}
                  style={{
                    width: '100%',
                    maxWidth: '600px',
                    minHeight: '300px',
                    perspective: '1000px',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.6s',
                      transform: cardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                  >
                    {/* Lado frontal (Español) */}
                    <div
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        backgroundColor: isDarkMode ? '#1f2937' : 'white',
                        borderRadius: '16px',
                        padding: '40px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isDarkMode ? '2px solid #4b5563' : '2px solid #e5e7eb',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ fontSize: '14px', color: isDarkMode ? '#9ca3af' : '#6b7280', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Español
                      </div>
                      <div style={{ 
                        fontSize: 'clamp(28px, 4vw, 40px)', 
                        fontWeight: '600', 
                        color: isDarkMode ? '#f3f4f6' : '#111827', 
                        textAlign: 'center', 
                        marginBottom: '16px',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        wordBreak: 'normal',
                        maxWidth: '100%',
                        padding: '0 20px',
                        overflow: 'visible',
                        lineHeight: '1.2',
                        letterSpacing: '0.5px',
                        whiteSpace: 'normal',
                      }}>
                        {currentCard.spanish}
                      </div>
                      {currentCard.spanishPronunciation && (
                        <div style={{ 
                          fontSize: 'clamp(16px, 3vw, 24px)', 
                          color: '#f59e0b', 
                          fontStyle: 'italic', 
                          marginBottom: '16px',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word',
                          maxWidth: '100%',
                          padding: '0 20px',
                          textAlign: 'center',
                        }}>
                          {currentCard.spanishPronunciation}
                        </div>
                      )}
                      <div style={{ fontSize: '14px', color: isDarkMode ? '#6b7280' : '#9ca3af', marginTop: '16px' }}>
                        👆 Haz clic para voltear
                      </div>
                    </div>

                    {/* Lado trasero (Inglés) */}
                    <div
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        backgroundColor: isDarkMode ? '#1f2937' : 'white',
                        borderRadius: '16px',
                        padding: '40px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isDarkMode ? '2px solid #6366f1' : '2px solid #6366f1',
                        boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)',
                        boxSizing: 'border-box',
                        overflow: 'visible',
                      }}
                    >
                      <div style={{ 
                        fontSize: 'clamp(36px, 5vw, 48px)', 
                        fontWeight: '700', 
                        color: isDarkMode ? '#ffffff' : '#000000', 
                        textAlign: 'center', 
                        marginBottom: '16px',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        wordBreak: 'normal',
                        maxWidth: '100%',
                        padding: '0 20px',
                        overflow: 'visible',
                        lineHeight: '1.2',
                        letterSpacing: '0px',
                        whiteSpace: 'normal',
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {currentCard.english}
                      </div>
                      {currentCard.englishPronunciation && (
                        <div style={{ 
                          fontSize: 'clamp(20px, 3vw, 26px)', 
                          color: '#f59e0b', 
                          fontStyle: 'italic', 
                          marginBottom: '16px',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          wordBreak: 'normal',
                          maxWidth: '100%',
                          padding: '0 20px',
                          textAlign: 'center',
                          lineHeight: '1.4',
                          letterSpacing: '0.5px',
                          whiteSpace: 'normal',
                          fontWeight: '500',
                        }}>
                          {currentCard.englishPronunciation}
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(currentCard.english, 'en-US');
                        }}
                        style={{
                          marginTop: '16px',
                          padding: '8px 16px',
                          backgroundColor: '#6366f1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Volume2 size={16} />
                        Pronunciar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Botones de respuesta (solo cuando está volteada) */}
                {cardFlipped && (
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    width: '100%',
                    maxWidth: '600px',
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        answerCard(false);
                      }}
                      style={{
                        flex: 1,
                        padding: '16px 24px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      <XCircle size={20} />
                      Incorrecto
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        answerCard(true);
                      }}
                      style={{
                        flex: 1,
                        padding: '16px 24px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      <CheckCircle size={20} />
                      Correcto
                    </button>
                  </div>
                )}

                {/* Estadísticas de sesión */}
                {sessionStats.reviewed > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '24px',
                    padding: '16px',
                    backgroundColor: isDarkMode ? '#1f2937' : 'white',
                    borderRadius: '12px',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                        {sessionStats.correct}
                      </div>
                      <div style={{ fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Correctas</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>
                        {sessionStats.incorrect}
                      </div>
                      <div style={{ fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Incorrectas</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: isDarkMode ? '#f3f4f6' : '#111827' }}>
                        {sessionStats.reviewed}
                      </div>
                      <div style={{ fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>Total</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

