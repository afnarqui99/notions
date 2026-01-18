import React from 'react';
import { Home } from 'lucide-react';

/**
 * Componente React para la página de Términos y Condiciones
 * Opcional: Si prefieres usar React Router en lugar de HTML estático
 */
export default function Terminos() {
  const dominio = 'notionlocal.com';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-4">Términos y Condiciones</h1>
        
        <p className="text-gray-600 mb-6"><strong>Última actualización:</strong> 20 de enero de 2025</p>
        
        <p className="mb-4">
          Bienvenido a <strong>Notas afnarqui</strong>, un editor de Notion completamente offline y local. Al usar este servicio, aceptas estos términos y condiciones.
        </p>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-3">1. Descripción del Servicio</h2>
          <p className="mb-3">
            <strong>Notas afnarqui</strong> es un editor de notas y gestión de proyectos que funciona completamente offline. Permite:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
            <li>Crear páginas, notas y tablas dinámicas</li>
            <li>Gestionar proyectos con tableros Kanban</li>
            <li>Organizar archivos e imágenes</li>
            <li>Ejecutar código en consola integrada</li>
            <li>Guardar todo localmente en tu sistema de archivos</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-3">2. Uso Aceptable</h2>
          <p className="mb-3">Al usar <strong>Notas afnarqui</strong>, te comprometes a:</p>
          <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
            <li>✅ Usar el servicio de manera legal y responsable</li>
            <li>✅ No utilizar el servicio para actividades ilegales o maliciosas</li>
            <li>✅ No intentar acceder a partes no autorizadas del sistema</li>
            <li>✅ No compartir información que viole derechos de autor</li>
            <li>✅ Respetar las políticas de privacidad y seguridad</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-3">3. Propiedad Intelectual</h2>
          <p className="mb-3">El código fuente de <strong>Notas afnarqui</strong> es de uso libre. Sin embargo:</p>
          <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
            <li>El contenido que crees en el editor es tuyo y permanece bajo tu control</li>
            <li>No reclamamos propiedad sobre tus datos, páginas o archivos</li>
            <li>Puedes usar, modificar y distribuir el código fuente según la licencia del proyecto</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-3">4. Limitación de Responsabilidad</h2>
          <p className="mb-3"><strong>Notas afnarqui</strong> se proporciona "tal cual" sin garantías de ningún tipo:</p>
          <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
            <li>No garantizamos que el servicio esté libre de errores o interrupciones</li>
            <li>No nos hacemos responsables de la pérdida de datos (aunque todo se guarda localmente)</li>
            <li>Es tu responsabilidad hacer copias de seguridad de tus archivos</li>
            <li>No garantizamos que el servicio cumpla con todos tus requisitos específicos</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-3">5. Almacenamiento de Datos</h2>
          <p className="mb-3">Todos los datos se guardan localmente en tu dispositivo:</p>
          <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
            <li>✅ Tú tienes control total sobre tus datos</li>
            <li>✅ Los datos no se envían a servidores externos</li>
            <li>✅ Puedes exportar y respaldar tus datos en cualquier momento</li>
            <li>⚠️ Es tu responsabilidad mantener copias de seguridad</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-3">6. Cambios a estos Términos</h2>
          <p className="mb-4">
            Podemos actualizar estos términos y condiciones ocasionalmente. Los cambios entrarán en vigor cuando se publiquen en esta página. Es tu responsabilidad revisar estos términos periódicamente.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-700 mb-3">7. Contacto</h2>
          <p className="mb-4">
            Si tienes preguntas sobre estos términos y condiciones, puedes contactarnos a través de nuestro repositorio o sitio web.
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

