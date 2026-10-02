import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mi cuenta — Escapes y Más',
  description: 'Tu cuenta en Escapes y Más: pedidos, garaje y datos.',
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
