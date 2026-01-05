/**
 * Servicio para gestionar plantillas de páginas
 * Permite crear, listar, cargar, guardar, exportar e importar plantillas
 */

import LocalStorageService from './LocalStorageService';

class TemplateService {
  constructor() {
    this.templatesStorageKey = 'notion-templates.json';
    this.defaultTemplatesPath = 'templates'; // Ruta relativa para plantillas por defecto
  }

  // Cargar todas las plantillas
  async loadTemplates() {
    try {
      const data = await LocalStorageService.readJSONFile(this.templatesStorageKey, 'data');
      return data?.templates || [];
    } catch (error) {
      return [];
    }
  }

  // Guardar plantillas
  async saveTemplates(templates) {
    try {
      await LocalStorageService.saveJSONFile(
        this.templatesStorageKey,
        { templates, updatedAt: new Date().toISOString() },
        'data'
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  // Obtener plantillas por defecto
  getDefaultTemplates() {
    return [
      {
        id: 'template-notas-reunion',
        name: 'Notas de Reunión',
        description: 'Plantilla para tomar notas en reuniones',
        icon: '📝',
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Notas de Reunión" }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Fecha: " }]
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Asistentes" }]
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Nombre 1" }]
                    }
                  ]
                }
              ]
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Agenda" }]
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Punto 1" }]
                    }
                  ]
                }
              ]
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Decisiones" }]
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Decisión 1" }]
                    }
                  ]
                }
              ]
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Acciones" }]
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Acción 1 - Responsable: " }]
                    }
                  ]
                }
              ]
            }
          ]
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'template-agenda-semanal',
        name: 'Agenda Semanal',
        description: 'Planifica tu semana con esta agenda',
        icon: '📅',
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Agenda Semanal" }]
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Lunes" }]
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Tarea 1" }]
                    }
                  ]
                }
              ]
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Martes" }]
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Tarea 1" }]
                    }
                  ]
                }
              ]
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Miércoles" }]
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Tarea 1" }]
                    }
                  ]
                }
              ]
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Jueves" }]
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Tarea 1" }]
                    }
                  ]
                }
              ]
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Viernes" }]
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Tarea 1" }]
                    }
                  ]
                }
              ]
            }
          ]
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'template-seguimiento-proyectos',
        name: 'Seguimiento de Proyectos',
        description: 'Plantilla para seguir el progreso de proyectos',
        icon: '🚀',
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Seguimiento de Proyectos" }]
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Información del Proyecto" }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Nombre: " }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Estado: " }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Fecha de inicio: " }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Fecha de fin: " }]
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Objetivos" }]
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Objetivo 1" }]
                    }
                  ]
                }
              ]
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Tareas" }]
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "☐ Tarea 1" }]
                    }
                  ]
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "☐ Tarea 2" }]
                    }
                  ]
                }
              ]
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Notas" }]
            },
            {
              type: "paragraph",
              content: []
            }
          ]
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'template-lista-tareas',
        name: 'Lista de Tareas',
        description: 'Plantilla simple para listas de tareas',
        icon: '✅',
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Lista de Tareas" }]
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "☐ Tarea 1" }]
                    }
                  ]
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "☐ Tarea 2" }]
                    }
                  ]
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "☐ Tarea 3" }]
                    }
                  ]
                }
              ]
            }
          ]
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'template-diario-personal',
        name: 'Diario Personal',
        description: 'Plantilla para escribir un diario personal',
        icon: '📖',
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Diario Personal" }]
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Fecha: " }]
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "¿Cómo me siento hoy?" }]
            },
            {
              type: "paragraph",
              content: []
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Lo que hice hoy" }]
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Actividad 1" }]
                    }
                  ]
                }
              ]
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Reflexiones" }]
            },
            {
              type: "paragraph",
              content: []
            },
            {
              type: "heading",
              attrs: { level: 2 },
              content: [{ type: "text", text: "Gratitud" }]
            },
            {
              type: "bulletList",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Estoy agradecido por..." }]
                    }
                  ]
                }
              ]
            }
          ]
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  // Inicializar plantillas por defecto (solo si no existen)
  async initializeDefaultTemplates() {
    try {
      const existingTemplates = await this.loadTemplates();
      
      // Si ya hay plantillas, no inicializar
      if (existingTemplates.length > 0) {
        return existingTemplates;
      }
      
      // Inicializar con plantillas por defecto
      const defaultTemplates = this.getDefaultTemplates();
      await this.saveTemplates(defaultTemplates);
      return defaultTemplates;
    } catch (error) {
      return [];
    }
  }

  // Obtener plantilla por ID
  async getTemplateById(templateId) {
    try {
      const templates = await this.loadTemplates();
      return templates.find(t => t.id === templateId) || null;
    } catch (error) {
      return null;
    }
  }

  // Agregar nueva plantilla
  async addTemplate(template) {
    try {
      const templates = await this.loadTemplates();
      
      // Generar ID si no existe
      if (!template.id) {
        template.id = `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
      
      // Agregar timestamps
      if (!template.createdAt) {
        template.createdAt = new Date().toISOString();
      }
      template.updatedAt = new Date().toISOString();
      
      templates.push(template);
      await this.saveTemplates(templates);
      return template;
    } catch (error) {
      return null;
    }
  }

  // Actualizar plantilla
  async updateTemplate(templateId, updates) {
    try {
      const templates = await this.loadTemplates();
      const index = templates.findIndex(t => t.id === templateId);
      
      if (index === -1) {
        return null;
      }
      
      templates[index] = {
        ...templates[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await this.saveTemplates(templates);
      return templates[index];
    } catch (error) {
      return null;
    }
  }

  // Eliminar plantilla
  async deleteTemplate(templateId) {
    try {
      const templates = await this.loadTemplates();
      const filtered = templates.filter(t => t.id !== templateId);
      await this.saveTemplates(filtered);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Exportar plantilla a JSON
  exportTemplate(template) {
    return JSON.stringify(template, null, 2);
  }

  // Importar plantilla desde JSON
  importTemplate(jsonString) {
    try {
      const template = JSON.parse(jsonString);
      // Validar estructura básica
      if (template.id && template.name && template.content) {
        // Eliminar ID para que se genere uno nuevo
        delete template.id;
        delete template.createdAt;
        delete template.updatedAt;
        return template;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Exportar todas las plantillas
  async exportAllTemplates() {
    try {
      const templates = await this.loadTemplates();
      return JSON.stringify(templates, null, 2);
    } catch (error) {
      return null;
    }
  }

  // Importar múltiples plantillas desde JSON
  async importTemplates(jsonString) {
    try {
      const templates = JSON.parse(jsonString);
      if (!Array.isArray(templates)) {
        return false;
      }
      
      const existingTemplates = await this.loadTemplates();
      const importedTemplates = [];
      
      for (const template of templates) {
        // Validar estructura
        if (template.name && template.content) {
          // Eliminar IDs para que se generen nuevos
          delete template.id;
          delete template.createdAt;
          delete template.updatedAt;
          importedTemplates.push(template);
        }
      }
      
      const allTemplates = [...existingTemplates, ...importedTemplates];
      await this.saveTemplates(allTemplates);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Exportar singleton
const templateService = new TemplateService();
export default templateService;

