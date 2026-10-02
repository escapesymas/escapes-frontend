import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Confirmar email — Escapes y Más',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
