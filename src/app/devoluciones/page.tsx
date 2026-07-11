'use client';

import Header from '../../components/Header';

export default function DevolucionesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header
        selectedBike=""
        onOpenBikeSelector={() => {}}
        onCartClick={() => {}}
        onTabChange={() => {}}
      />
      <main id="main-content" className="flex-grow max-w-3xl mx-auto px-4 py-10 w-full">
        <h1 className="font-mono text-2xl font-bold uppercase text-foreground mb-6">Política de Devoluciones y Desistimiento</h1>

        <div className="text-xs font-sans text-foreground/80 leading-relaxed space-y-4">
          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">1. Derecho de desistimiento (consumidores UE)</h2>
            <p>
              De conformidad con el Real Decreto Legislativo 1/2007, de 16 de noviembre, por el que se aprueba el texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios, el cliente consumidor tiene derecho a desistir del contrato en un plazo de <strong>14 días naturales</strong> desde la recepción del producto, sin necesidad de justificación alguna.
            </p>
            <p>
              Para ejercer el derecho de desistimiento, el consumidor deberá notificar su decisión a través de cualquiera de los siguientes medios antes de la finalización del plazo:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Email a info@escapesymas.com indicando el número de pedido.</li>
              <li>Formulario de desistimiento que el cliente puede solicitar y que enviaremos por email.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">2. Condiciones de devolución</h2>
            <p>
              El producto deberá devolverse en su embalaje original, sin usar, sin montar y en perfecto estado, incluyendo todos sus componentes, manuales y accesorios. No se aceptarán devoluciones de productos que muestren señales de uso, montaje o manipulación.
            </p>
            <p>
              Los gastos de envío de la devolución correrán por cuenta del cliente, salvo en los casos de producto defectuoso o error en el envío, en los que Escapes y Más asumirá los costes íntegros de la recogida y reposición.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">3. Excepciones al derecho de desistimiento</h2>
            <p>Conforme al artículo 103 de la LGDCU, el derecho de desistimiento NO será aplicable en los siguientes casos:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Productos sellados que no sean aptos para devolución por razones de protección de la salud o higiene y hayan sido desprecintados tras la entrega (por ejemplo: líquidos, lubricantes, cascos interiores).</li>
              <li>Productos elaborados conforme a especificaciones del cliente o claramente personalizados.</li>
              <li>Productos de recambio eléctrico o electrónico cuyo precinto haya sido retirado tras la entrega.</li>
              <li>Productos que, tras su entrega, se hayan mezclado de forma indisociable con otros bienes.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">4. Plazo de reembolso</h2>
            <p>
              Una vez recibido el producto devuelto y verificado su estado, Escapes y Más procederá al reembolso del importe íntegro del producto en el plazo máximo de <strong>14 días naturales</strong>, utilizando el mismo método de pago empleado por el cliente en la compra original, salvo que el cliente indique expresamente otro método.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">5. Garantía legal de productos defectuosos</h2>
            <p>
              Todos los productos comercializados en Escapes y Más están cubiertos por la garantía legal de conformidad de <strong>3 años</strong> (artículos 114-126 del TRLGDCU) para consumidores finales, y de <strong>1 año</strong> para clientes profesionales o empresas.
            </p>
            <p>
              En caso de producto defectuoso o en mal estado, contacta con info@escapesymas.com indicando el número de pedido, una descripción del problema y, si es posible, fotografías adjuntas. Gestionaremos la recogida y sustitución o reembolso sin coste alguno.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">6. Dirección de devolución</h2>
            <p>Los productos devueltos deben enviarse a la dirección que te indicaremos por email una vez aprobada la solicitud de devolución. No se aceptarán devoluciones en puntos diferentes a los expresamente autorizados.</p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">7. Modelos oficiales de desistimiento</h2>
            <p>Conforme al artículo 68.2 del TRLGDCU, ponemos a tu disposición el siguiente modelo de formulario de desistimiento (puedes usarlo o enviar uno con contenido equivalente):</p>
            <blockquote className="border-l-4 border-card-border pl-4 my-4 text-foreground/70 italic">
              <p>A la atención de Escapes y Más, con domicilio social en <span className="bg-amber-100 px-1 rounded text-amber-900 font-bold not-italic">[PENDIENTE: dirección social completa del titular]</span>:</p>
              <p>Por la presente le comunico que desisto del contrato de venta del siguiente bien:</p>
              <ul className="list-none mt-2">
                <li>- Pedido nº: [_______________]</li>
                <li>- Recibido el día: [_______________]</li>
                <li>- Nombre del consumidor: [_______________]</li>
                <li>- Domicilio del consumidor: [_______________]</li>
                <li>- Fecha y firma (solo si se presenta en papel): [_______________]</li>
              </ul>
            </blockquote>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">8. Legislación aplicable</h2>
            <p>La presente política de devoluciones se rige por el Real Decreto Legislativo 1/2007 (LGDCU) y por las restantes normas españolas y europeas aplicables al comercio electrónico y la protección de los consumidores.</p>
          </section>

          <p className="text-foreground/60 italic mt-8">Última actualización: junio de 2026.</p>
        </div>
      </main>
    </div>
  );
}
