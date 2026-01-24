import { Code, Database, Calendar, Image as ImageIcon, FileText, FolderTree, File, FileJson, Send, FileCode, Plus, Sparkles, Zap, Rocket, BookOpen, CheckCircle2, Settings, HardDrive, Cloud, Terminal, Monitor } from 'lucide-react';

export default function WelcomeExamples({ onCreatePage }) {
  const useCases = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Organiza tus Notas",
      description: "Crea páginas para tus ideas, proyectos y recordatorios. Todo en un solo lugar.",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "Gestiona Proyectos",
      description: "Tablas Kanban, listas de tareas y seguimiento de progreso para tus proyectos.",
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Prueba APIs",
      description: "Cliente Postman integrado para probar y documentar tus APIs REST.",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
      iconColor: "text-indigo-600 dark:text-indigo-400"
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Planifica Eventos",
      description: "Calendario interactivo para organizar tus eventos y recordatorios importantes.",
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400"
    },
    {
      icon: <FileCode className="w-6 h-6" />,
      title: "Documenta Código",
      description: "Editor Markdown y bloques de código con resaltado de sintaxis.",
      iconBg: "bg-teal-100 dark:bg-teal-900/30",
      iconColor: "text-teal-600 dark:text-teal-400"
    },
    {
      icon: <FolderTree className="w-6 h-6" />,
      title: "Gestiona Archivos",
      description: "Galerías de imágenes y archivos organizados para todos tus documentos.",
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400"
    },
    {
      icon: <Monitor className="w-6 h-6" />,
      title: "Editor Visual Code",
      description: "Editor de código completo con resaltado de sintaxis, explorador de archivos y múltiples temas.",
      iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
      iconColor: "text-cyan-600 dark:text-cyan-400"
    },
    {
      icon: <Terminal className="w-6 h-6" />,
      title: "Terminal Node.js",
      description: "Ejecuta scripts Node.js y Python directamente desde la aplicación con terminales integradas.",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400"
    }
  ];

  const quickStartSteps = [
    {
      step: 1,
      title: "Crea tu primera página",
      description: "Haz clic en el botón de abajo o usa el botón '+' en el sidebar",
      icon: <Plus className="w-5 h-5" />
    },
    {
      step: 2,
      title: "Usa el botón de comandos",
      description: "Haz clic en el botón flotante que sigue tu cursor para insertar comandos y funcionalidades",
      icon: <Zap className="w-5 h-5" />
    },
    {
      step: 3,
      title: "Personaliza tu espacio",
      description: "Organiza tus páginas, agrega tags y crea la estructura que necesites",
      icon: <Sparkles className="w-5 h-5" />
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
      {/* Header de Bienvenida */}
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Rocket className="w-10 h-10 text-white" />
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            ¡Bienvenido a tu Espacio de Trabajo!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Organiza tus ideas, gestiona proyectos y potencia tu productividad. 
            Todo lo que necesitas en un solo lugar.
          </p>
        </div>
        
        {/* Botón de Acción Principal */}
        <div className="pt-4">
          <button
            onClick={onCreatePage}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>Crear tu primera página</span>
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Temas para Invitar al Usuario */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            ¿Qué puedes hacer aquí?
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Descubre todas las formas en que puedes usar esta aplicación
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-105 cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-lg ${useCase.iconBg} flex items-center justify-center ${useCase.iconColor} mb-4`}>
                {useCase.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {useCase.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {useCase.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Guía Rápida de Inicio */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 border border-blue-200 dark:border-gray-700">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Comienza en 3 pasos
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Sigue estos pasos simples para empezar a usar la aplicación
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickStartSteps.map((step, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                  {step.step}
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  {step.icon}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Características Destacadas */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            Características Principales
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tabla de Tareas */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Code className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Gestión de Tareas
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Tarea</th>
                    <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100">Implementar funcionalidad</td>
                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Completado
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-gray-100">Revisar código</td>
                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        En progreso
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
              Usa el botón flotante de comandos para insertar una tabla
            </p>
          </div>

          {/* Postman/API */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Send className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Cliente API
              </h3>
            </div>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded">
                  POST
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                  /api/login
                </span>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                <pre className="text-xs text-gray-100 font-mono">
                  <code>
                    <span className="text-gray-400">{'{'}</span>{'\n'}
                    {'  '}
                    <span className="text-yellow-400">"usuario"</span>
                    <span className="text-gray-400">: </span>
                    <span className="text-green-400">"admin"</span>
                    {'\n'}
                    <span className="text-gray-400">{'}'}</span>
                  </code>
                </pre>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Usa el botón flotante de comandos para insertar un cliente API
            </p>
          </div>
        </div>

        {/* Segunda fila: Visual Code y Terminal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Visual Code */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Editor Visual Code
              </h3>
            </div>
            <div className="mb-4">
              {/* Simulación de editor de código */}
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                {/* Barra de herramientas */}
                <div className="bg-gray-800 px-3 py-1.5 flex items-center gap-2 border-b border-gray-700">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-xs text-gray-400 ml-2">app.js</span>
                </div>
                {/* Código */}
                <div className="p-3">
                  <pre className="text-xs text-gray-100 font-mono">
                    <code>
                      <span className="text-purple-400">const</span>{' '}
                      <span className="text-yellow-400">express</span>
                      <span className="text-gray-400"> = </span>
                      <span className="text-blue-400">require</span>
                      <span className="text-gray-400">(</span>
                      <span className="text-green-400">'express'</span>
                      <span className="text-gray-400">);</span>{'\n'}
                      {'\n'}
                      <span className="text-purple-400">const</span>{' '}
                      <span className="text-yellow-400">app</span>
                      <span className="text-gray-400"> = </span>
                      <span className="text-blue-400">express</span>
                      <span className="text-gray-400">();</span>{'\n'}
                      {'\n'}
                      <span className="text-yellow-400">app</span>
                      <span className="text-gray-400">.</span>
                      <span className="text-blue-400">get</span>
                      <span className="text-gray-400">(</span>
                      <span className="text-green-400">'/'</span>
                      <span className="text-gray-400">, (</span>
                      <span className="text-yellow-400">req</span>
                      <span className="text-gray-400">, </span>
                      <span className="text-yellow-400">res</span>
                      <span className="text-gray-400">) {'=>'}</span>{'\n'}
                      {'  '}
                      <span className="text-yellow-400">res</span>
                      <span className="text-gray-400">.</span>
                      <span className="text-blue-400">send</span>
                      <span className="text-gray-400">(</span>
                      <span className="text-green-400">'Hello World'</span>
                      <span className="text-gray-400">);</span>
                    </code>
                  </pre>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Resaltado de sintaxis para múltiples lenguajes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Explorador de archivos integrado</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Temas personalizables (One Dark, Light, etc.)</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
              Abre proyectos completos y edita código directamente
            </p>
          </div>

          {/* Terminal Node.js */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Terminal Node.js
              </h3>
            </div>
            <div className="mb-4">
              {/* Simulación de terminal */}
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                {/* Header de terminal */}
                <div className="bg-gray-800 px-3 py-1.5 flex items-center justify-between border-b border-gray-700">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-gray-400">Terminal - Node.js</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  </div>
                </div>
                {/* Contenido de terminal */}
                <div className="p-3 font-mono text-xs">
                  <div className="text-green-400 mb-1">
                    <span className="text-blue-400">$</span>{' '}
                    <span className="text-gray-300">node app.js</span>
                  </div>
                  <div className="text-gray-300 mb-1">
                    Server running on port 3000
                  </div>
                  <div className="text-green-400 mb-1">
                    <span className="text-blue-400">$</span>{' '}
                    <span className="text-gray-300">npm install express</span>
                  </div>
                  <div className="text-gray-300 mb-1">
                    <span className="text-yellow-400">added 57 packages</span>{' '}
                    <span className="text-gray-400">in 2s</span>
                  </div>
                  <div className="text-green-400">
                    <span className="text-blue-400">$</span>{' '}
                    <span className="text-gray-300 animate-pulse">_</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Ejecuta scripts Node.js y Python</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Múltiples terminales simultáneas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Cola de ejecución para proyectos</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
              Ejecuta código sin salir de la aplicación
            </p>
          </div>
        </div>
      </div>

      {/* Información sobre Almacenamiento */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Configuración de Almacenamiento
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Tus datos están seguros y bajo tu control
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Almacenamiento del Navegador */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-6 border border-blue-200 dark:border-gray-600">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Cloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Almacenamiento del Navegador
              </h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              <strong className="text-blue-600 dark:text-blue-400">Por defecto,</strong> todos tus datos se guardan en el almacenamiento del navegador (localStorage/IndexedDB).
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Funciona inmediatamente sin configuración</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Ideal para empezar rápido</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>No requiere permisos especiales</span>
              </li>
            </ul>
          </div>

          {/* Carpeta Local */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl p-6 border border-purple-200 dark:border-gray-600">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Carpeta Local del Sistema
              </h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              <strong className="text-purple-600 dark:text-purple-400">En cualquier momento,</strong> puedes cambiar a guardar tus datos en una carpeta de tu sistema de archivos.
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Acceso desde otros programas</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Backups manuales más fáciles</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Útil para archivos grandes</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                ¿Cómo cambiar el almacenamiento?
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Haz clic en el botón de <strong>Configuración</strong> (⚙️) en el sidebar o en el menú superior. 
                Allí podrás elegir entre almacenamiento del navegador o carpeta local, y cambiar en cualquier momento.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Llamada Final a la Acción */}
      <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <h2 className="text-2xl font-bold mb-3">
          ¿Listo para comenzar?
        </h2>
        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
          Crea tu primera página y descubre todo lo que puedes hacer. 
          Es fácil, rápido y completamente personalizable.
        </p>
        <button
          onClick={onCreatePage}
          className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>Crear mi primera página</span>
        </button>
      </div>
    </div>
  );
}
