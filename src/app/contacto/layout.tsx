import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto — Escapes y Más',
  description: 'Escríbenos para resolver dudas de compatibilidad, el estado de un pedido, garantías o devoluciones. Respondemos por correo.',
  alternates: { canonical: '/contacto' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
