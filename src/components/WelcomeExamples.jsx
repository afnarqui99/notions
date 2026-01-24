import { Code, Database, Calendar, Image as ImageIcon, FileText, FolderTree, File, FileJson, Send, FileCode } from 'lucide-react';

export default function WelcomeExamples() {
  return (
    <div className="space-y-12">
      {/* Ejemplo 1: Tabla de Tareas para Programador */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Code className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gestión de Tareas de Desarrollo
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Tarea</th>
                <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Estado</th>
                <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Prioridad</th>
                <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100">Implementar autenticación</td>
                <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Completado
                  </span>
                </td>
                <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">Alta</td>
                <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">15 Ene</td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100">Optimizar consultas SQL</td>
                <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    En progreso
                  </span>
                </td>
                <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">Media</td>
                <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">20 Ene</td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100">Escribir tests unitarios</td>
                <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    Pendiente
                  </span>
                </td>
                <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">Alta</td>
                <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">25 Ene</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Ejemplo 2: Postman/API Client */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Send className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cliente API (Postman)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Prueba APIs REST con colecciones, variables y múltiples pestañas
            </p>
          </div>
        </div>
        
        {/* Pestañas */}
        <div className="mb-4 flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <div className="px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-semibold rounded-t border-b-2 border-indigo-600 dark:border-indigo-400">
            Login API
          </div>
          <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs rounded-t">
            + Nueva API
          </div>
        </div>
        
        {/* Request */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded">
              POST
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">
              <span className="text-blue-600 dark:text-blue-400">{'{{'}</span>base_url<span className="text-blue-600 dark:text-blue-400">{'}}'}</span>/login
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">(con variables)</span>
          </div>
          
          {/* Variables */}
          <div className="mb-3 bg-blue-50 dark:bg-blue-900/20 rounded p-2 border border-blue-200 dark:border-blue-800">
            <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">Variables</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-white dark:bg-gray-700 rounded border border-blue-200 dark:border-blue-700">
                <span className="text-blue-600 dark:text-blue-400 font-mono">base_url</span>
                <span className="text-gray-500 dark:text-gray-400"> = </span>
                <span className="text-green-600 dark:text-green-400">https://api.ejemplo.com</span>
              </span>
              <span className="px-2 py-1 bg-white dark:bg-gray-700 rounded border border-blue-200 dark:border-blue-700">
                <span className="text-blue-600 dark:text-blue-400 font-mono">token</span>
                <span className="text-gray-500 dark:text-gray-400"> = </span>
                <span className="text-green-600 dark:text-green-400">abc123...</span>
              </span>
            </div>
          </div>
          
          {/* Headers */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Headers</div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2 text-xs font-mono">
              <div className="text-gray-700 dark:text-gray-300">
                <span className="text-purple-600 dark:text-purple-400">Content-Type</span>
                <span className="text-gray-500 dark:text-gray-500">: </span>
                <span className="text-blue-600 dark:text-blue-400">application/json</span>
              </div>
              <div className="text-gray-700 dark:text-gray-300 mt-1">
                <span className="text-purple-600 dark:text-purple-400">Authorization</span>
                <span className="text-gray-500 dark:text-gray-500">: </span>
                <span className="text-blue-600 dark:text-blue-400">Bearer <span className="text-green-600 dark:text-green-400">{'{{'}</span>token<span className="text-green-600 dark:text-green-400">{'}}'}</span></span>
              </div>
            </div>
          </div>
          
          {/* Body JSON */}
          <div>
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Body (JSON)</div>
            <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
              <pre className="text-xs text-gray-100 font-mono">
                <code>
                  <span className="text-gray-400">{'{'}</span>{'\n'}
                  {'  '}
                  <span className="text-yellow-400">"usuario"</span>
                  <span className="text-gray-400">: </span>
                  <span className="text-green-400">"admin"</span>
                  <span className="text-gray-400">,</span>{'\n'}
                  {'  '}
                  <span className="text-yellow-400">"clave"</span>
                  <span className="text-gray-400">: </span>
                  <span className="text-green-400">"******"</span>
                  {'\n'}
                  <span className="text-gray-400">{'}'}</span>
                </code>
              </pre>
            </div>
          </div>
        </div>
        
        {/* Response */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded">
              200 OK
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">156ms</span>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
            <pre className="text-xs text-gray-100 font-mono">
              <code>
                <span className="text-gray-400">{'{'}</span>{'\n'}
                {'  '}
                <span className="text-yellow-400">"token"</span>
                <span className="text-gray-400">: </span>
                <span className="text-green-400">"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."</span>
                <span className="text-gray-400">,</span>{'\n'}
                {'  '}
                <span className="text-yellow-400">"expira"</span>
                <span className="text-gray-400">: </span>
                <span className="text-blue-400">3600</span>
                {'\n'}
                <span className="text-gray-400">{'}'}</span>
              </code>
            </pre>
          </div>
        </div>
        
        {/* Características */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Características:</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-1">
              <span className="text-green-500">✓</span>
              <span>Múltiples pestañas</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-500">✓</span>
              <span>Variables dinámicas</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-500">✓</span>
              <span>Importar colecciones</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-500">✓</span>
              <span>Autenticación</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
            Escribe <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">/postman</code> para crear un bloque Postman
          </p>
        </div>
      </div>

      {/* Ejemplo 3: Markdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <FileCode className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Editor Markdown
          </h3>
        </div>
        
        {/* Vista dividida: Editor y Preview */}
        <div className="grid grid-cols-2 gap-4">
          {/* Editor */}
          <div>
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Editor</div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">
{`# Título Principal

## Subtítulo

**Texto en negrita** y *cursiva*

- Lista item 1
- Lista item 2
- Lista item 3

\`código inline\`

[Enlace](https://ejemplo.com)`}
              </pre>
            </div>
          </div>
          
          {/* Preview */}
          <div>
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Vista Previa</div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
              <div className="text-sm space-y-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Título Principal</h1>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Subtítulo</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Texto en negrita</strong> y <em>cursiva</em>
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 ml-2">
                  <li>Lista item 1</li>
                  <li>Lista item 2</li>
                  <li>Lista item 3</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300">
                  <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">código inline</code>
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Enlace</a>
                </p>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
          Escribe en Markdown y ve la vista previa en tiempo real
        </p>
      </div>

      {/* Ejemplo 4: Bloque JSON */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <FileJson className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bloque JSON
          </h3>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-gray-100 font-mono">
            <code>
              <span className="text-gray-400">{'{'}</span>{'\n'}
              {'  '}
              <span className="text-yellow-400">"usuario"</span>
              <span className="text-gray-400">: {'{'}</span>{'\n'}
              {'    '}
              <span className="text-yellow-400">"id"</span>
              <span className="text-gray-400">: </span>
              <span className="text-blue-400">123</span>
              <span className="text-gray-400">,</span>{'\n'}
              {'    '}
              <span className="text-yellow-400">"nombre"</span>
              <span className="text-gray-400">: </span>
              <span className="text-green-400">"María García"</span>
              <span className="text-gray-400">,</span>{'\n'}
              {'    '}
              <span className="text-yellow-400">"email"</span>
              <span className="text-gray-400">: </span>
              <span className="text-green-400">"maria@ejemplo.com"</span>
              <span className="text-gray-400">,</span>{'\n'}
              {'    '}
              <span className="text-yellow-400">"activo"</span>
              <span className="text-gray-400">: </span>
              <span className="text-purple-400">true</span>
              <span className="text-gray-400">,</span>{'\n'}
              {'    '}
              <span className="text-yellow-400">"roles"</span>
              <span className="text-gray-400">: [</span>
              <span className="text-green-400">"admin"</span>
              <span className="text-gray-400">, </span>
              <span className="text-green-400">"editor"</span>
              <span className="text-gray-400">]</span>
              {'\n'}
              {'  '}
              <span className="text-gray-400">{'}'}</span>
              {'\n'}
              <span className="text-gray-400">{'}'}</span>
            </code>
          </pre>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
          Formatea y valida JSON con resaltado de sintaxis
        </p>
      </div>

      {/* Ejemplo 5: Código de Ejemplo */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Code className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bloque de Código
          </h3>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-gray-100 font-mono">
            <code>
              <span className="text-purple-400">function</span>{' '}
              <span className="text-yellow-400">calcularTotal</span>
              <span className="text-gray-400">(</span>
              <span className="text-blue-400">items</span>
              <span className="text-gray-400">) {'{'}</span>{'\n'}
              {'  '}
              <span className="text-purple-400">return</span>{' '}
              <span className="text-blue-400">items</span>
              <span className="text-gray-400">.</span>
              <span className="text-yellow-400">reduce</span>
              <span className="text-gray-400">((</span>
              <span className="text-blue-400">acc</span>
              <span className="text-gray-400">, </span>
              <span className="text-blue-400">item</span>
              <span className="text-gray-400">) {'=>'}</span>{'\n'}
              {'    '}
              <span className="text-blue-400">acc</span>
              <span className="text-gray-400"> + </span>
              <span className="text-blue-400">item</span>
              <span className="text-gray-400">.</span>
              <span className="text-blue-400">precio</span>
              <span className="text-gray-400">, </span>
              <span className="text-green-400">0</span>
              <span className="text-gray-400">);</span>{'\n'}
              <span className="text-gray-400">{'}'}</span>
            </code>
          </pre>
        </div>
      </div>

      {/* Ejemplo 6: Organización de Archivos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <FolderTree className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Organización de Archivos
          </h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <FolderTree className="w-4 h-4 text-blue-500" />
            <span className="font-medium">Proyectos</span>
          </div>
          <div className="ml-6 space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4 text-gray-400" />
              <span>Planificación 2026.pdf</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4 text-gray-400" />
              <span>Reunión equipo.docx</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <FolderTree className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Carpeta</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FileText className="w-4 h-4 text-gray-400" />
                <span>Notas importantes.txt</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FileText className="w-4 h-4 text-gray-400" />
                <span>Ideas proyecto.md</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mt-4">
            <FolderTree className="w-4 h-4 text-blue-500" />
            <span className="font-medium">Presupuesto</span>
          </div>
          <div className="ml-6 space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4 text-gray-400" />
              <span>Gastos enero.xlsx</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4 text-gray-400" />
              <span>Presupuesto anual.xlsx</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mt-4">
            <FolderTree className="w-4 h-4 text-blue-500" />
            <span className="font-medium">Varios</span>
          </div>
          <div className="ml-6 space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4 text-gray-400" />
              <span>Recetas favoritas.pdf</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4 text-gray-400" />
              <span>Lista compras.txt</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mt-4">
            <FolderTree className="w-4 h-4 text-blue-500" />
            <span className="font-medium">Música</span>
          </div>
          <div className="ml-6 space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4 text-gray-400" />
              <span>Playlist verano.mp3</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4 text-gray-400" />
              <span>Favoritas 2024.mp3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ejemplo 7: Calendario de Eventos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Calendario de Eventos
          </h3>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {/* Headers */}
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
          {/* Days */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(day => {
            const isEvent = day === 5 || day === 12;
            const isToday = day === 8;
            return (
              <div
                key={day}
                className={`text-center text-sm py-2 rounded ${
                  isToday
                    ? 'bg-blue-500 text-white font-semibold'
                    : isEvent
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {day}
                {isEvent && (
                  <div className="w-1 h-1 mx-auto mt-1 rounded-full bg-orange-500"></div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-700 dark:text-gray-300">5 Ene - Revisión de código</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-700 dark:text-gray-300">12 Ene - Deploy a producción</span>
          </div>
        </div>
      </div>

      {/* Ejemplo 8: Galería de Archivos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
            <File className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Galería de Archivos
          </h3>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {/* Archivo PDF */}
          <div className="flex flex-col items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <FileText className="w-8 h-8 text-red-600 dark:text-red-400 mb-2" />
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate w-full text-center">documento.pdf</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">2.3 MB</span>
          </div>
          
          {/* Archivo Word */}
          <div className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate w-full text-center">reporte.docx</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">1.8 MB</span>
          </div>
          
          {/* Archivo Excel */}
          <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <FileText className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate w-full text-center">datos.xlsx</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">856 KB</span>
          </div>
          
          {/* Archivo JSON */}
          <div className="flex flex-col items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <FileJson className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate w-full text-center">config.json</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">12 KB</span>
          </div>
          
          {/* Imagen */}
          <div className="flex flex-col items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <ImageIcon className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-2" />
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate w-full text-center">foto.jpg</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">450 KB</span>
          </div>
          
          {/* Archivo Markdown */}
          <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <FileText className="w-8 h-8 text-gray-600 dark:text-gray-400 mb-2" />
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate w-full text-center">README.md</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">8 KB</span>
          </div>
          
          {/* Archivo ZIP */}
          <div className="flex flex-col items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <File className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mb-2" />
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate w-full text-center">backup.zip</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">15.2 MB</span>
          </div>
          
          {/* Archivo Video */}
          <div className="flex flex-col items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <File className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-2" />
            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate w-full text-center">video.mp4</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">45 MB</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
          Organiza y visualiza todos tus archivos en un solo lugar
        </p>
      </div>

    </div>
  );
}

