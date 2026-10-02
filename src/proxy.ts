import { NextResponse, type NextRequest } from 'next/server';

/**
 * /api/* se reenvía al backend pasando otra vez por Traefik, que descarta el
 * X-Forwarded-For: el backend veía la IP de la red interna para todos los
 * clientes (un único cupo de rate limit). Aquí se envía la IP real en
 * X-Client-IP; el backend solo la acepta si la petición viene de la red interna.
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    || request.headers.get('x-real-ip') || '';
  if (ip) headers.set('x-client-ip', ip);
  else headers.delete('x-client-ip');
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: '/api/:path*' };
