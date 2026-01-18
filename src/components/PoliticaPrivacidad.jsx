import React from 'react';
import { Home } from 'lucide-react';

/**
 * Componente React para la página de Política de Privacidad
 * Opcional: Si prefieres usar React Router en lugar de HTML estático
 */
export default function PoliticaPrivacidad() {
  const dominio = 'notionlocal.com';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">Política de Privacidad</h1>
        
        <p className="text-gray-600 mb-6"><strong>Última actualización:</strong> 20 de enero de 2025</p>
        
        <p className="mb-4">
          En <strong>Notas afnarqui</strong> nos tomamos tu privacidad en serio. Esta política describe cómo manejamos tus datos cuando usas nuestro editor de Notion local.
        </p>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-3">1. Datos que recopilamos</h2>
          <p className="mb-3">
            No recopilamos, almacenamos ni compartimos ninguna información personal. Toda la información que ingresas en el editor es procesada directamente en tu navegador y se guarda localmente en tu dispositivo.
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
            <li><strong>Datos locales:</strong> Todas tus páginas, notas, tablas y archivos se guardan localmente en tu sistema de archivos.</li>
            <li><strong>Sin servidores:</strong> No enviamos datos a servidores externos.</li>
            <li><strong>Sin tracking:</strong> No recopilamos información de uso o estadísticas de navegación.</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-3">2. Cookies y tecnologías de terceros</h2>
          <p className="mb-3">
            Utilizamos Google AdSense para mostrar anuncios relevantes en nuestro sitio web. Google puede usar cookies y tecnologías similares para:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
            <li>Mostrar anuncios personalizados basados en tus intereses</li>
            <li>Medir la efectividad de los anuncios</li>
            <li>Proporcionar servicios publicitarios mejorados</li>
          </ul>
          
          <p className="mb-3">Para más información sobre cómo Google usa tus datos, puedes consultar:</p>
          <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
            <li>
              <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Política de anuncios de Google
              </a>
            </li>
            <li>
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Política de privacidad de Google
              </a>
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-3">3. Gestión de cookies y anuncios</h2>
          <p className="mb-3">Puedes gestionar tus preferencias de anuncios y cookies a través de:</p>
          <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
            <li>
              <a href="https://adssettings.google.com/authenticated" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Configuración de anuncios de Google
              </a>
            </li>
            <li>Configuración de cookies de tu navegador</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-3">4. Editor local (aplicación de escritorio)</h2>
          <p className="mb-3">
            La aplicación de escritorio <strong>Notas afnarqui</strong> funciona completamente offline y no recopila ningún dato:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
            <li>✅ Funciona sin conexión a internet</li>
            <li>✅ Guarda todo localmente en tu carpeta seleccionada</li>
            <li>✅ No envía datos a ningún servidor</li>
            <li>✅ Sin telemetría ni tracking</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-3">5. Versión web</h2>
          <p className="mb-3">Si usas la versión web del editor:</p>
          <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
            <li>Los datos se guardan en el almacenamiento local de tu navegador (localStorage/IndexedDB)</li>
            <li>No se envían a servidores externos</li>
            <li>Puedes borrar todos los datos eliminando el almacenamiento local del navegador</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-3">6. Cambios a esta política</h2>
          <p className="mb-4">
            Podemos actualizar esta política de privacidad ocasionalmente. Cualquier cambio será publicado en esta misma página con la fecha de actualización.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-3">7. Contacto</h2>
          <p className="mb-4">
            Si tienes preguntas sobre esta política de privacidad, puedes contactarnos a través de nuestro repositorio o sitio web.
          </p>
        </section>

        <a 
          href="/" 
          className="inline-flex items-center gap-2 mt-8 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Home size={20} />
          Volver al inicio
        </a>

      </div>
    </div>
  );
}

