'use client';

import Header from '../../components/Header';

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header
        selectedBike=""
        onOpenBikeSelector={() => {}}
        onCartClick={() => {}}
        onTabChange={() => {}}
      />
      <main id="main-content" className="flex-grow max-w-3xl mx-auto px-4 py-10 w-full">
        <h1 className="font-mono text-2xl font-bold uppercase text-foreground mb-6">Términos y Condiciones de Venta</h1>

        <div className="text-xs font-sans text-foreground/80 leading-relaxed space-y-4">
          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">1. Información general</h2>
            <p>
              Los presentes términos y condiciones de venta regulan el uso del sitio web <strong>escapesymas.com</strong> y la contratación de productos ofrecidos a través del mismo, en adelante "Escapes y Más", por parte de los usuarios que realicen pedidos o adquieran productos.
            </p>
            <p>
              Al realizar un pedido a través de este sitio web, el cliente acepta expresamente los presentes términos y condiciones. La contratación de los productos ofertados se regirá por las presentes condiciones generales de venta.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">2. Proceso de compra</h2>
            <p>El cliente puede realizar pedidos de los productos ofrecidos a través de las siguientes vías:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Selección directa del producto desde el catálogo online.</li>
              <li>Selección de producto compatible desde el selector de moto del sitio.</li>
              <li>Búsqueda por referencia (SKU), marca o modelo de moto.</li>
            </ul>
            <p>
              Para formalizar el pedido, el cliente deberá seguir los pasos del proceso de compra, facilitando los datos solicitados en cada paso y confirmando finalmente la compra mediante el botón correspondiente.
            </p>
            <p>
              Una vez completado el proceso, el cliente recibirá una confirmación de pedido por email con todos los detalles de la compra, incluyendo número de pedido, productos, cantidades, precios, gastos de envío y plazo de entrega estimado.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">3. Precios e impuestos</h2>
            <p>
              Los precios de los productos mostrados en el sitio web están expresados en Euros e incluyen el IVA aplicable según la legislación española vigente (21% en la mayoría de los productos).
            </p>
            <p>
              Los gastos de envío se muestran durante el proceso de compra, antes de la confirmación del pedido, y pueden variar en función del destino, el peso y las dimensiones del paquete.
            </p>
            <p>
              Escapes y Más se reserva el derecho a modificar los precios de los productos en cualquier momento, sin que ello afecte a los pedidos ya confirmados y en proceso de envío.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">4. Disponibilidad de productos</h2>
            <p>
              La disponibilidad de los productos está sujeta al stock existente en nuestros almacenes o en los de nuestros proveedores. En caso de no disponer de un producto tras la confirmación del pedido, Escapes y Más se compromete a:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Informar al cliente en un plazo máximo de 48 horas hábiles.</li>
              <li>Ofrecer un producto alternativo de características similares, si el cliente lo desea.</li>
              <li>Proceder al reembolso íntegro del importe abonado en caso de que no se desee un producto alternativo.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">5. Forma de pago</h2>
            <p>
              Escapes y Más acepta las siguientes formas de pago a través del proveedor seguro Stripe:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Tarjeta de crédito o débito (Visa, Mastercard, American Express).</li>
              <li>Bizum.</li>
              <li>Klarna (pago a plazos).</li>
              <li>Otros métodos habilitados por Stripe en el momento de la compra.</li>
            </ul>
            <p>
              Todos los pagos se procesan a través de conexiones seguras cifradas (SSL/TLS). Escapes y Más no almacena datos completos de tarjetas de crédito en sus sistemas.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">6. Envío y entrega</h2>
            <p>
              Los plazos de entrega indicados son orientativos y dependen de la disponibilidad del producto y de la dirección de envío. Los pedidos se procesan en un plazo de 24 a 72 horas hábiles tras la confirmación del pago.
            </p>
            <p>
              Escapes y Más envía a la Península Ibérica, Baleares, Canarias, Ceuta, Melilla y a países seleccionados de la Unión Europea. Los gastos y plazos de envío pueden variar según el destino.
            </p>
            <p>
              En caso de demora significativa imputable a Escapes y Más, el cliente tendrá derecho a resolver el contrato y obtener el reembolso íntegro de los importes abonados.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">7. Garantía</h2>
            <p>
              Todos los productos comercializados a través de este sitio web gozan de la garantía legal de conformidad de <strong>3 años</strong> para consumidores y usuarios finales, conforme a lo establecido en el Real Decreto Legislativo 1/2007 (LGDCU). Para clientes profesionales o empresas, la garantía legal es de 1 año.
            </p>
            <p>
              Las condiciones completas de garantía, devolución y desistimiento se regulan en la <a href="/devoluciones" className="text-accent hover:underline">Política de Devoluciones</a> de este sitio web.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">8. Protección de datos</h2>
            <p>
              El tratamiento de los datos personales facilitados por el cliente se realiza conforme a lo establecido en la <a href="/politica-privacidad" className="text-accent hover:underline">Política de Privacidad</a> y en cumplimiento del Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">9. Atención al cliente</h2>
            <p>
              Para cualquier duda, incidencia o reclamación, el cliente puede contactar con Escapes y Más a través de los siguientes medios:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Email: info@escapesymas.com</li>
              <li>Formulario de contacto disponible en el sitio web.</li>
            </ul>
            <p>
              Escapes y Más responderá a las consultas en un plazo máximo de 48 horas hábiles en días laborables.
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase text-foreground mb-2">10. Legislación aplicable y jurisdicción</h2>
            <p>
              Las presentes condiciones generales de venta se rigen por la legislación española y europea aplicable al comercio electrónico. Para cualquier controversia que pudiera derivarse de la interpretación o aplicación de las presentes condiciones, las partes se someterán a los juzgados y tribunales competentes del domicilio del consumidor cuando éste tenga la condición de consumidor y usuario final, conforme a la normativa aplicable.
            </p>
          </section>

          <p className="text-foreground/60 italic mt-8">Última actualización: junio de 2026.</p>
        </div>
      </main>
    </div>
  );
}
