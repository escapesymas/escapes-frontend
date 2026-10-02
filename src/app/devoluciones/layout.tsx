import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Devoluciones y garantía — Escapes y Más',
  description: 'Cómo devolver un pedido en Escapes y Más: plazo de 14 días, condiciones y garantía de los productos.',
  alternates: { canonical: '/devoluciones' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
