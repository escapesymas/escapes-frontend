'use client';

import dynamic from 'next/dynamic';

const WhatsAppFloatingButton = dynamic(
  () => import('./WhatsAppFloatingButton'),
  { ssr: false }
);

export default function WhatsAppWrapper() {
  return <WhatsAppFloatingButton />;
}