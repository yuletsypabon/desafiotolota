// Límite de intentos fallidos de contraseña por dispositivo (dirección IP), en memoria del servidor.
// Tras MAX_FALLOS seguidos se bloquea BLOQUEO_MS; un acierto limpia el contador.

export const MAX_FALLOS = 5;
export const BLOQUEO_MS = 5 * 60 * 1000;
/** Los fallos más viejos que esto ya no cuentan. */
const VENTANA_MS = 15 * 60 * 1000;

interface Registro { fallos: number; ultimo: number; hasta: number }

export function crearLimite() {
  const registros = new Map<string, Registro>();
  return {
    /** Ms que faltan para poder intentar de nuevo (0 si no está bloqueado). */
    espera(clave: string, ahora = Date.now()) {
      const r = registros.get(clave);
      return r && r.hasta > ahora ? r.hasta - ahora : 0;
    },
    fallo(clave: string, ahora = Date.now()) {
      const previo = registros.get(clave);
      const fallos = previo && ahora - previo.ultimo < VENTANA_MS ? previo.fallos + 1 : 1;
      registros.set(clave, { fallos, ultimo: ahora, hasta: fallos >= MAX_FALLOS ? ahora + BLOQUEO_MS : 0 });
      if (registros.size > 5000) registros.delete(registros.keys().next().value!); // no crecer sin límite
    },
    acierto(clave: string) {
      registros.delete(clave);
    },
  };
}

/** Dirección del cliente (detrás de un proxy viene en x-forwarded-for). */
export function ipDe(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'local';
}
