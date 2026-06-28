import CartView from '../../components/CartView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout — Escapes y Más',
  description: 'Finaliza tu compra de escapes de moto y recambios.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://escapesymas.com/checkout' },
};

export default function CheckoutPage() {
  return <CartView initialStep="checkout" />;
}