import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de cookies — Escapes y Más',
  description: 'Qué cookies utiliza Escapes y Más y cómo gestionarlas.',
  alternates: { canonical: '/politica-cookies' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
