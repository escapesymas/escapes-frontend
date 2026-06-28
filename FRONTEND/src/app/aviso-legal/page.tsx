'use client';

import Header from '../../components/Header';
import Head from 'next/head';

export default function AvisoLegalPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header
        selectedBike=""
        onOpenBikeSelector={() => {}}
        onCartClick={() => {}}
        onTabChange={() => {}}
      />
      <main id="main-content" className="flex-grow max-w-3xl mx-auto px-4 py-10 w-full">
        <title>Aviso Legal — Escapes y Más</title>
        <h1 className="font-mono text-2xl font-bold uppercase text-foreground mb-6">Aviso Legal</h1>

        <div className="text-xs font-sans text-foreground/80 leading-relaxed space-y-4">
          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">1. Identificación del Titular</h2>
            <p>
              En cumplimiento con el deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico, a continuación se exponen los datos identificativos del titular del sitio web <strong>escapesymas.com</strong>:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Denominación social:</strong> Escapes y Más</li>
              <li><strong>NIF / CIF:</strong> [RELLENAR POR EL TITULAR]</li>
              <li><strong>Domicilio social:</strong> [RELLENAR POR EL TITLAR — calle, número, código postal, ciudad, provincia, país]</li>
              <li><strong>Registro Mercantil:</strong> [RELLENAR POR EL TITULAR — tomo, folio, hoja, inscripción]</li>
              <li><strong>Teléfono de contacto:</strong> [RELLENAR POR EL TITULAR]</li>
              <li><strong>Correo electrónico:</strong> info@escapesymas.com</li>
            </ul>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">2. Condiciones de Uso</h2>
            <p>
              El acceso y uso de este sitio web atribuye la condición de usuario e implica la aceptación plena y sin reservas de todas y cada una de las condiciones incluidas en este Aviso Legal.
            </p>
            <p>
              El usuario se compromete a hacer un uso adecuado de los contenidos y servicios ofrecidos y a no emplearlos para incurrir en actividades ilícitas o contrarias a la buena fe.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">3. Propiedad Intelectual</h2>
            <p>
              Todos los contenidos del sitio web, incluyendo textos, imágenes, logotipos, marcas y cualquier otro material, están protegidos por derechos de propiedad intelectual e industrial. Queda prohibida su reproducción, distribución o transformación sin autorización expresa del titular.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">4. Exclusión de Responsabilidad</h2>
            <p>
              El titular no se hace responsable de los daños o perjuicios derivados del uso de la información contenida en este sitio web, ni de los posibles errores u omisiones en los contenidos.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">5. Legislación Aplicable</h2>
            <p>
              Este Aviso Legal se rige por la legislación española. Para cualquier controversia que pudiera derivarse del acceso o uso del sitio web, las partes se someten a los juzgados y tribunales de la ciudad correspondiente.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
