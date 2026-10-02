import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y condiciones — Escapes y Más',
  description: 'Condiciones de compra en Escapes y Más: precios, envíos, pagos y devoluciones.',
  alternates: { canonical: '/terminos' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
