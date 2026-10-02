import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pedido confirmado — Escapes y Más',
  description: 'Gracias por tu compra en Escapes y Más.',
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
