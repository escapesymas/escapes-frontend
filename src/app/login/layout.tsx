import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acceder — Escapes y Más',
  description: 'Inicia sesión o crea tu cuenta en Escapes y Más.',
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
