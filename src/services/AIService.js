/**
 * Servicio para interactuar con APIs de IA (OpenAI, Anthropic, etc.)
 * Similar a cómo funciona Cursor
 */

class AIService {
  constructor() {
    this.apiKey = null;
    this.apiProvider = 'openai'; // 'openai' o 'anthropic'
    this.baseURL = null;
    this.loadConfig();
  }

  loadConfig() {
    try {
      // Intentar cargar desde localStorage
      const config = localStorage.getItem('ai-service-config');
      if (config) {
        const parsed = JSON.parse(config);
        this.apiKey = parsed.apiKey;
        this.apiProvider = parsed.provider || 'openai';
        this.baseURL = parsed.baseURL;
      }
    } catch (error) {
      console.error('[AIService] Error cargando configuración:', error);
    }
  }

  saveConfig() {
    try {
      const config = {
        apiKey: this.apiKey,
        provider: this.apiProvider,
        baseURL: this.baseURL
      };
      localStorage.setItem('ai-service-config', JSON.stringify(config));
    } catch (error) {
      console.error('[AIService] Error guardando configuración:', error);
    }
  }

  setApiKey(apiKey, provider = 'openai', baseURL = null) {
    this.apiKey = apiKey;
    this.apiProvider = provider;
    this.baseURL = baseURL;
    this.saveConfig();
  }

  hasApiKey() {
    return !!this.apiKey;
  }

  /**
   * Genera el contexto del código para incluir en la solicitud
   */
  buildCodeContext(activeFile, fileContents, projectPath) {
    const context = [];
    
    if (activeFile && fileContents[activeFile]) {
      context.push({
        type: 'file',
        path: activeFile,
        content: fileContents[activeFile]
      });
    }

    // Incluir otros archivos abiertos si es relevante
    if (fileContents) {
      Object.entries(fileContents).forEach(([path, content]) => {
        if (path !== activeFile && content) {
          // Solo incluir archivos pequeños para no exceder el límite
          if (content.length < 5000) {
            context.push({
              type: 'file',
              path: path,
              content: content.substring(0, 5000) // Limitar tamaño
            });
          }
        }
      });
    }

    return context;
  }

  /**
   * Construye el mensaje del sistema con el contexto del código
   */
  buildSystemMessage(codeContext, projectPath) {
    let systemMessage = `Eres un asistente de IA experto en programación, similar a Cursor. Ayudas a los desarrolladores a escribir, entender y mejorar su código.

Instrucciones:
- Proporciona respuestas claras y concisas
- Cuando sea relevante, referencia el código específico
- Sugiere mejoras prácticas y mejores prácticas
- Explica conceptos de manera didáctica
- Si no estás seguro, pregunta para clarificar

`;

    if (projectPath) {
      systemMessage += `Proyecto actual: ${projectPath}\n\n`;
    }

    if (codeContext && codeContext.length > 0) {
      systemMessage += `Archivos de contexto:\n`;
      codeContext.forEach((file, index) => {
        systemMessage += `\n--- Archivo ${index + 1}: ${file.path} ---\n${file.content}\n`;
      });
    }

    return systemMessage;
  }

  /**
   * Llama a la API de OpenAI
   */
  async callOpenAI(messages, codeContext, projectPath) {
    if (!this.apiKey) {
      throw new Error('API key no configurada. Por favor, configura tu API key en la configuración.');
    }

    const systemMessage = this.buildSystemMessage(codeContext, projectPath);
    
    const requestMessages = [
      { role: 'system', content: systemMessage },
      ...messages
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview', // o 'gpt-3.5-turbo' para más económico
        messages: requestMessages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Error de API: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No se recibió respuesta de la IA.';
  }

  /**
   * Llama a la API de Anthropic (Claude) - similar a Cursor
   */
  async callAnthropic(messages, codeContext, projectPath) {
    if (!this.apiKey) {
      throw new Error('API key no configurada. Por favor, configura tu API key en la configuración.');
    }

    const systemMessage = this.buildSystemMessage(codeContext, projectPath);
    
    // Convertir mensajes al formato de Anthropic
    const anthropicMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229', // o 'claude-3-sonnet-20240229' para más económico
        max_tokens: 2000,
        system: systemMessage,
        messages: anthropicMessages
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Error de API: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0]?.text || 'No se recibió respuesta de la IA.';
  }

  /**
   * Envía un mensaje a la IA con el contexto del código
   */
  async sendMessage(userMessage, messageHistory, activeFile, fileContents, projectPath) {
    if (!this.hasApiKey()) {
      throw new Error('API key no configurada');
    }

    const codeContext = this.buildCodeContext(activeFile, fileContents, projectPath);
    
    // Preparar historial de mensajes
    const messages = messageHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Agregar el nuevo mensaje del usuario
    messages.push({
      role: 'user',
      content: userMessage
    });

    try {
      let response;
      if (this.apiProvider === 'anthropic') {
        response = await this.callAnthropic(messages, codeContext, projectPath);
      } else {
        response = await this.callOpenAI(messages, codeContext, projectPath);
      }
      return response;
    } catch (error) {
      console.error('[AIService] Error llamando a la API:', error);
      throw error;
    }
  }
}

// Exportar instancia singleton
export default new AIService();


