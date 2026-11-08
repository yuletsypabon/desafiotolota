// Sesión firmada en una cookie (HMAC-SHA256 con Web Crypto).
// Funciona tanto en el middleware (Edge) como en las rutas (Node). Sin dependencias ni base de datos.

export type Rol = 'ADMIN' | 'CRONO';
export const COOKIE_SESION = 'tolota_sesion';
export const HEADER_ROL = 'x-tolota-rol';
export const DURACION_SESION_S = 12 * 60 * 60; // una jornada

export const ROL_LABEL: Record<Rol, string> = { ADMIN: 'Administrador', CRONO: 'Cronometrador' };

const enc = new TextEncoder();

/**
 * Secreto para firmar: AUTH_SECRET si existe; si no, se deriva de DATABASE_URL
 * (contiene la contraseña de la base, así que no es público). Así no hace falta configurar nada más.
 */
function secreto() {
  const s = process.env.AUTH_SECRET || process.env.DATABASE_URL;
  if (!s) throw new Error('Falta AUTH_SECRET o DATABASE_URL para firmar la sesión');
  return 'tolota-sesion:' + s;
}

const b64url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function firmar(datos: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secreto()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(datos)));
}

/** Comparación en tiempo constante (evita adivinar la firma por tiempos de respuesta). */
function iguales(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function crearToken(rol: Rol, ahora = Date.now()) {
  const datos = `${rol}.${Math.floor(ahora / 1000) + DURACION_SESION_S}`;
  return `${datos}.${await firmar(datos)}`;
}

/** Devuelve el rol si el token es válido y no ha vencido; si no, null. */
export async function leerToken(token: string | undefined | null, ahora = Date.now()): Promise<Rol | null> {
  if (!token) return null;
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  const [rol, exp, firma] = partes;
  if (rol !== 'ADMIN' && rol !== 'CRONO') return null;
  if (!/^\d+$/.test(exp) || Number(exp) * 1000 < ahora) return null;
  try {
    return iguales(firma, await firmar(`${rol}.${exp}`)) ? rol : null;
  } catch {
    return null;
  }
}

// ─── Qué puede hacer el cronometrador ─────────────────────────────────
// Como en la versión HTML: elegir una prueba habilitada, ordenar equipos, cronometrar y ver resultados.
// Nada de fichas médicas, equipos, disciplina, configuración ni respaldo.

const ID = '[^/]+';
const PAGINAS_CRONO = [/^\/$/, new RegExp(`^/eventos/${ID}/(cronometro|resultados)$`)];
const API_CRONO: [string, RegExp][] = [
  ['GET', /^\/api\/auth\/sesion$/], // quién soy (menú y botón Salir)
  ['POST', /^\/api\/auth\/logout$/],
  ['GET', /^\/api\/eventos$/],
  ['GET', new RegExp(`^/api/eventos/${ID}$`)],
  ['GET', new RegExp(`^/api/eventos/${ID}/(equipos|clasificacion|exportar)$`)],
  ['PATCH', new RegExp(`^/api/pruebas/${ID}$`)], // solo orden de salida y estado (se limita en la ruta)
  ['PUT', new RegExp(`^/api/pruebas/${ID}/resultados$`)],
  ['POST', new RegExp(`^/api/pruebas/${ID}/resultados/intercambiar$`)],
  ['DELETE', new RegExp(`^/api/resultados/${ID}$`)],
];

export function permitidoCrono(metodo: string, ruta: string, query: URLSearchParams): boolean {
  if (ruta.startsWith('/api/')) {
    if (ruta.endsWith('/exportar') && query.get('tipo') === 'participantes') return false; // fichas médicas
    const m = metodo === 'HEAD' ? 'GET' : metodo;
    return API_CRONO.some(([mm, re]) => mm === m && re.test(ruta));
  }
  return PAGINAS_CRONO.some((re) => re.test(ruta));
}
