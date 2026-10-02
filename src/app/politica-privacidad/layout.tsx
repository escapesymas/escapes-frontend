import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de privacidad — Escapes y Más',
  description: 'Cómo trata Escapes y Más tus datos personales y cómo ejercer tus derechos.',
  alternates: { canonical: '/politica-privacidad' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
