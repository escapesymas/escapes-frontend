'use client';

import Header from '../../components/Header';

export default function PoliticaCookiesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header
        selectedBike=""
        onOpenBikeSelector={() => {}}
        onCartClick={() => {}}
        onTabChange={() => {}}
      />
      <main id="main-content" className="flex-grow max-w-3xl mx-auto px-4 py-10 w-full">
        <h1 className="font-mono text-2xl font-bold uppercase text-foreground mb-6">Política de Cookies</h1>

        <div className="text-xs font-sans text-foreground/80 leading-relaxed space-y-4">
          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">¿Qué son las cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que un sitio web almacena en el dispositivo del usuario cuando visita el sitio. Las cookies permiten al sitio web reconocer el navegador del usuario y recordar información sobre su visita.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">¿Qué cookies utilizamos?</h2>
            <p>En <strong>escapesymas.com</strong> utilizamos las siguientes categorías de cookies:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>Cookies estrictamente necesarias:</strong> imprescindibles para el funcionamiento del sitio web, como la gestión del carrito de la compra, la autenticación de usuarios y la seguridad. Estas cookies no requieren consentimiento.</li>
              <li><strong>Cookies de análisis (opcionales):</strong> nos permiten medir y analizar la navegación de los usuarios en el sitio para mejorar nuestros servicios. Solo se activan con tu consentimiento.</li>
              <li><strong>Cookies de funcionalidad (opcionales):</strong> permiten recordar tus preferencias (idioma, configuración del selector de moto, productos favoritos) para ofrecerte una experiencia personalizada.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">Cookies específicas utilizadas</h2>
            <table className="w-full text-xs border-collapse mt-2">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="text-left py-2 font-bold">Cookie</th>
                  <th className="text-left py-2 font-bold">Tipo</th>
                  <th className="text-left py-2 font-bold">Finalidad</th>
                  <th className="text-left py-2 font-bold">Duración</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-card-border/50">
                  <td className="py-2">tg_session</td>
                  <td className="py-2">Estrictamente necesaria</td>
                  <td className="py-2">Autenticación de usuario (JWT de sesión)</td>
                  <td className="py-2">Sesión</td>
                </tr>
                <tr className="border-b border-card-border/50">
                  <td className="py-2">tg_cart_token</td>
                  <td className="py-2">Estrictamente necesaria</td>
                  <td className="py-2">Identificador de carrito persistente (guest)</td>
                  <td className="py-2">30 días</td>
                </tr>
                <tr className="border-b border-card-border/50">
                  <td className="py-2">tg_selected_bike</td>
                  <td className="py-2">Funcionalidad</td>
                  <td className="py-2">Recordar la moto seleccionada para filtrar compatibilidades</td>
                  <td className="py-2">365 días</td>
                </tr>
                <tr className="border-b border-card-border/50">
                  <td className="py-2">cookie_consent</td>
                  <td className="py-2">Estrictamente necesaria</td>
                  <td className="py-2">Almacenar tu elección de consentimiento de cookies</td>
                  <td className="py-2">365 días</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3">Este sitio web no utiliza cookies publicitarias ni de seguimiento entre sitios de terceros.</p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">Gestión de cookies</h2>
            <p>
              Puedes configurar o rechazar las cookies opcionales a través del banner de cookies que aparece en tu primera visita, o actualizar tus preferencias en cualquier momento haciendo clic en el botón "Gestionar cookies" en el pie de página.
            </p>
            <p>
              También puedes configurar tu navegador para que rechace todas las cookies o avise antes de instalarlas. La mayoría de los navegadores aceptan las cookies por defecto, pero puedes cambiar la configuración en cualquier momento. Ten en cuenta que bloquear las cookies estrictamente necesarias puede impedir el correcto funcionamiento del sitio.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">Cambios en la política de cookies</h2>
            <p>
              Escapes y Más podrá modificar la presente política para adaptarla a novedades legislativas o jurisprudenciales. En caso de cambios sustanciales, se notificará al usuario mediante un aviso visible en el sitio web.
            </p>
          </section>

          <p className="text-foreground/60 italic mt-8">Última actualización: junio de 2026.</p>
        </div>
      </main>
    </div>
  );
}
