import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aviso legal — Escapes y Más',
  description: 'Datos del titular de Escapes y Más y condiciones de uso del sitio web.',
  alternates: { canonical: '/aviso-legal' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
