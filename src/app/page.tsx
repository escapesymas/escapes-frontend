import type { Metadata } from 'next';
import Home from './HomeClient';

// El layout no pone canonical (lo heredarían todas las páginas), así que la portada lo declara aquí:
// sin él, las direcciones con ?utm_… o ?bike=… competían con la portada como si fueran páginas distintas.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return <Home />;
}
