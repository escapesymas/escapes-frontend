'use client';

import Header from '../../components/Header';

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header
        selectedBike=""
        onOpenBikeSelector={() => {}}
        onCartClick={() => {}}
        onTabChange={() => {}}
      />
      <main id="main-content" className="flex-grow max-w-3xl mx-auto px-4 py-10 w-full">
        <title>Política de Privacidad — Escapes y Más</title>
        <h1 className="font-mono text-2xl font-bold uppercase text-foreground mb-6">Política de Privacidad</h1>

        <div className="text-xs font-sans text-foreground/80 leading-relaxed space-y-4">
          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">1. Responsable del Tratamiento</h2>
            <p>
              De acuerdo con el Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos Personales, le informamos que los datos personales que nos proporcione serán tratados por:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Titular:</strong> Escapes y Más</li>
              <li><strong>Correo electrónico:</strong> info@escapesymas.com</li>
            </ul>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">2. Finalidad del Tratamiento</h2>
            <p>Los datos personales recogidos se utilizan para las siguientes finalidades:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Gestión de pedidos y facturación.</li>
              <li>Atención al cliente y resolución de incidencias.</li>
              <li>Envío de notificaciones de disponibilidad de productos (cuando el usuario lo solicite).</li>
              <li>Cumplimiento de obligaciones legales y fiscales.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">3. Legitimación</h2>
            <p>
              La base legal para el tratamiento de sus datos es la ejecución de un contrato (compra de productos), su consentimiento explícito (notificaciones de stock) y el cumplimiento de obligaciones legales.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">4. Conservación de los Datos</h2>
            <p>
              Sus datos se conservarán durante el tiempo necesario para cumplir con la finalidad para la que fueron recogidos y durante los plazos legalmente establecidos.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">5. Derechos del Usuario</h2>
            <p>El usuario tiene derecho a:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Acceder a sus datos personales.</li>
              <li>Solicitar la rectificación o supresión de los mismos.</li>
              <li>Solicitar la limitación u oposición del tratamiento.</li>
              <li>Portar sus datos a otro responsable.</li>
              <li>Retirar el consentimiento en cualquier momento.</li>
            </ul>
            <p className="mt-2">
              Para ejercer estos derechos, envíe un correo a <strong>info@escapesymas.com</strong> indicando el derecho que desea ejercer.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">6. Seguridad</h2>
            <p>
              Implementamos las medidas técnicas y organizativas necesarias para garantizar la seguridad e integridad de sus datos personales y evitar su alteración, pérdida o acceso no autorizado.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
