/**
 * Servicio para interactuar con APIs de IA (OpenAI, Anthropic, etc.)
 * Similar a cómo funciona Cursor
 */

class AIService {
  constructor() {
    this.apiKey = null;
    this.apiProvider = 'openai'; // 'openai', 'anthropic' o 'copilot'
    this.baseURL = null;
    this.githubUsername = null;
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
        this.githubUsername = parsed.githubUsername || null;
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
        baseURL: this.baseURL,
        githubUsername: this.githubUsername
      };
      localStorage.setItem('ai-service-config', JSON.stringify(config));
      
      // También guardar en archivo para que el main process pueda acceder
      if (window.electronAPI && window.electronAPI.saveAIConfig) {
        window.electronAPI.saveAIConfig(config).catch(error => {
          console.error('[AIService] Error guardando configuración en archivo:', error);
        });
      }
    } catch (error) {
      console.error('[AIService] Error guardando configuración:', error);
    }
  }

  setApiKey(apiKey, provider = 'openai', baseURL = null, githubUsername = null) {
    this.apiKey = apiKey;
    this.apiProvider = provider;
    this.baseURL = baseURL;
    this.githubUsername = githubUsername;
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
   * Llama a la API de GitHub Copilot
   * Nota: GitHub Copilot usa la API de GitHub, así que usamos el endpoint de GitHub Copilot
   */
  async callCopilot(messages, codeContext, projectPath) {
    if (!this.apiKey) {
      throw new Error('Token de GitHub Copilot no configurado. Por favor, configura tu usuario y token en la configuración.');
    }

    const systemMessage = this.buildSystemMessage(codeContext, projectPath);
    
    // Construir mensaje del sistema con información del usuario si está disponible
    let enhancedSystemMessage = systemMessage;
    if (this.githubUsername) {
      enhancedSystemMessage = `Usuario de GitHub: ${this.githubUsername}\n\n${systemMessage}`;
    }
    
    const requestMessages = [
      { role: 'system', content: enhancedSystemMessage },
      ...messages
    ];

    // Intentar usar la API de GitHub Copilot directamente
    // Si no está disponible, usar OpenAI como fallback
    try {
      // Primero intentar con la API de GitHub Copilot (si está disponible)
      // Nota: GitHub Copilot API requiere autenticación específica
      const response = await fetch('https://api.github.com/copilot/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-GitHub-Api-Version': '2024-11-20'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: requestMessages,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content || 'No se recibió respuesta de la IA.';
      } else if (response.status === 404 || response.status === 403) {
        // Si la API de Copilot no está disponible, usar OpenAI como fallback
        console.warn('[AIService] GitHub Copilot API no disponible, usando OpenAI como fallback');
        return await this.callOpenAI(messages, codeContext, projectPath);
      } else {
        const error = await response.json();
        throw new Error(error.message || `Error de API: ${response.status}`);
      }
    } catch (error) {
      // Si hay un error de red o la API no está disponible, usar OpenAI como fallback
      console.warn('[AIService] Error con GitHub Copilot API, usando OpenAI como fallback:', error);
      return await this.callOpenAI(messages, codeContext, projectPath);
    }
  }

  /**
   * Envía un mensaje a la IA con el contexto del código
   */
  async sendMessage(userMessage, messageHistory = [], activeFile = null, fileContents = null, projectPath = null) {
    if (!this.hasApiKey()) {
      throw new Error('API key no configurada');
    }

    const codeContext = this.buildCodeContext(activeFile, fileContents, projectPath);
    
    // Preparar historial de mensajes (con valor por defecto si no se proporciona)
    const messages = (messageHistory || []).map(msg => ({
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
      } else if (this.apiProvider === 'copilot') {
        response = await this.callCopilot(messages, codeContext, projectPath);
      } else {
        response = await this.callOpenAI(messages, codeContext, projectPath);
      }
      return response;
    } catch (error) {
      console.error('[AIService] Error llamando a la API:', error);
      throw error;
    }
  }

  /**
   * Envía un mensaje simple a la IA (para chat libre sin contexto de código)
   */
  async sendSimpleMessage(userMessage, chatHistory = []) {
    if (!this.hasApiKey()) {
      throw new Error('API key no configurada');
    }

    // Preparar historial de mensajes desde el chat
    const messages = (chatHistory || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
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
        // Para Anthropic, no necesitamos contexto de código
        const systemMessage = 'Eres un asistente de IA útil y amigable. Responde de manera clara y concisa.';
        const anthropicMessages = messages.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        }));

        const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-opus-20240229',
            max_tokens: 2000,
            system: systemMessage,
            messages: anthropicMessages
          })
        });

        if (!apiResponse.ok) {
          const error = await apiResponse.json();
          throw new Error(error.error?.message || `Error de API: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        response = data.content[0]?.text || 'No se recibió respuesta de la IA.';
      } else if (this.apiProvider === 'copilot') {
        // Para GitHub Copilot, construir mensaje del sistema con información del usuario
        let systemMessage = 'Eres GitHub Copilot, un asistente de IA especializado en programación. Responde de manera clara, concisa y enfocada en código.';
        if (this.githubUsername) {
          systemMessage = `Usuario de GitHub: ${this.githubUsername}\n\n${systemMessage}`;
        }
        
        const requestMessages = [
          { role: 'system', content: systemMessage },
          ...messages
        ];

        // Intentar usar la API de GitHub Copilot primero
        try {
          const apiResponse = await fetch('https://api.github.com/copilot/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
              'X-GitHub-Api-Version': '2024-11-20'
            },
            body: JSON.stringify({
              model: 'gpt-4',
              messages: requestMessages,
              temperature: 0.7,
              max_tokens: 2000
            })
          });

          if (apiResponse.ok) {
            const data = await apiResponse.json();
            response = data.choices[0]?.message?.content || 'No se recibió respuesta de la IA.';
          } else {
            // Fallback a OpenAI si la API de Copilot no está disponible
            console.warn('[AIService] GitHub Copilot API no disponible, usando OpenAI como fallback');
            const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
              },
              body: JSON.stringify({
                model: 'gpt-4-turbo-preview',
                messages: requestMessages,
                temperature: 0.7,
                max_tokens: 2000
              })
            });

            if (!fallbackResponse.ok) {
              const error = await fallbackResponse.json();
              throw new Error(error.error?.message || `Error de API: ${fallbackResponse.status}`);
            }

            const fallbackData = await fallbackResponse.json();
            response = fallbackData.choices[0]?.message?.content || 'No se recibió respuesta de la IA.';
          }
        } catch (error) {
          // Si hay un error, usar OpenAI como fallback
          console.warn('[AIService] Error con GitHub Copilot API, usando OpenAI como fallback:', error);
          const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
              model: 'gpt-4-turbo-preview',
              messages: requestMessages,
              temperature: 0.7,
              max_tokens: 2000
            })
          });

          if (!fallbackResponse.ok) {
            const errorData = await fallbackResponse.json();
            throw new Error(errorData.error?.message || `Error de API: ${fallbackResponse.status}`);
          }

          const fallbackData = await fallbackResponse.json();
          response = fallbackData.choices[0]?.message?.content || 'No se recibió respuesta de la IA.';
        }
      } else {
        // Para OpenAI
        const systemMessage = 'Eres un asistente de IA útil y amigable. Responde de manera clara y concisa.';
        const requestMessages = [
          { role: 'system', content: systemMessage },
          ...messages
        ];

        const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            messages: requestMessages,
            temperature: 0.7,
            max_tokens: 2000
          })
        });

        if (!apiResponse.ok) {
          const error = await apiResponse.json();
          throw new Error(error.error?.message || `Error de API: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();
        response = data.choices[0]?.message?.content || 'No se recibió respuesta de la IA.';
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



