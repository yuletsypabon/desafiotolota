// Defensas de la API que no dependen de la base de datos (las usa el middleware).

const SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * ¿La petición que cambia datos viene de otro sitio web? (CSRF: una página ajena que intenta enviar formularios o
 * llamadas a nuestra API usando la sesión del usuario). Se rechaza si el navegador dice que es de otro sitio o si
 * el origen no coincide con nuestro dominio. Las lecturas (GET) no cambian nada y siempre pasan.
 */
export function esPeticionAjena(metodo: string, origen: string | null, host: string | null, secFetchSite: string | null) {
  if (SEGUROS.has(metodo.toUpperCase())) return false;
  if (secFetchSite === 'cross-site') return true;
  if (!origen) return false; // herramientas sin navegador (curl, scripts) no mandan Origin; igual necesitan sesión
  try {
    return new URL(origen).host !== host;
  } catch {
    return true;
  }
}

/** Tamaño máximo del cuerpo de una petición JSON normal (los respaldos tienen su propio límite). */
export const MAX_CUERPO_BYTES = 2_000_000;
