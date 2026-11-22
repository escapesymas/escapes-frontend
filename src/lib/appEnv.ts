/**
 * Entorno de pruebas (staging) de la tienda. Se activa al COMPILAR con NEXT_PUBLIC_APP_ENV=staging (Next incrusta el valor);
 * sin esa variable todo es producción. En pruebas no se carga ningún píxel ni analítica, no se permiten claves de Stripe en vivo,
 * no se indexa nada y se ve una etiqueta «ENTORNO DE PRUEBAS» para no confundirlo con la tienda real.
 */
export const IS_STAGING = process.env.NEXT_PUBLIC_APP_ENV === 'staging';
