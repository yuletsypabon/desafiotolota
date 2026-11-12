// Sesión firmada en una cookie (HMAC-SHA256 con Web Crypto).
// Funciona tanto en el middleware (Edge) como en las rutas (Node). Sin dependencias ni base de datos.

export type Rol = 'ADMIN' | 'CRONO';
export const COOKIE_SESION = 'tolota_sesion';
export const COOKIE_HISTORICO = 'tolota_historico';
export const HEADER_ROL = 'x-tolota-rol';
export const DURACION_SESION_S = 12 * 60 * 60; // una jornada
export const DURACION_HISTORICO_S = 2 * 60 * 60;

export const ROL_LABEL: Record<Rol, string> = { ADMIN: 'Administrador', CRONO: 'Cronometrador' };

const enc = new TextEncoder();

/**
 * Secreto para firmar las sesiones: AUTH_SECRET (obligatoria en producción; "Iniciar evento.bat" la crea sola en el
 * portátil y en Vercel se configura a mano). Solo en desarrollo, si falta, se deriva de DATABASE_URL para no
 * bloquear al programador; en producción eso sería adivinable (p. ej. postgres:postgres), así que se rechaza.
 */
function secreto() {
  const s = process.env.AUTH_SECRET?.trim();
  if (s) return 'tolota-sesion:' + s;
  if (process.env.NODE_ENV === 'production' || !process.env.DATABASE_URL)
    throw new Error('Falta AUTH_SECRET en el archivo .env (ejecuta "Iniciar evento.bat" o node scripts/asegurar-secreto.mjs)');
  return 'tolota-sesion:' + process.env.DATABASE_URL;
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

export async function crearTokenHistorico(ahora = Date.now()) {
  const datos = `HISTORICO.${Math.floor(ahora / 1000) + DURACION_HISTORICO_S}`;
  return `${datos}.${await firmar(datos)}`;
}

export async function leerTokenHistorico(token: string | undefined | null, ahora = Date.now()) {
  if (!token) return false;
  const partes = token.split('.');
  if (partes.length !== 3) return false;
  const [tipo, exp, firma] = partes;
  if (tipo !== 'HISTORICO' || !/^\d+$/.test(exp) || Number(exp) * 1000 < ahora) return false;
  try {
    return iguales(firma, await firmar(`${tipo}.${exp}`));
  } catch {
    return false;
  }
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
// El cronometrador opera pruebas habilitadas; el histórico requiere su contraseña adicional.
// No puede ver fichas médicas, gestionar equipos, disciplina, configuración ni respaldo.

const ID = '[^/]+';
const PAGINAS_CRONO = [
  /^\/cronometro$/,
  new RegExp(`^/cronometro/eventos/${ID}/cronometro$`),
  new RegExp(`^/cronometro/eventos/${ID}/resultados$`),
];
const API_CRONO: [string, RegExp][] = [
  ['GET', /^\/api\/auth\/sesion$/], // quién soy (menú y botón Salir)
  ['POST', /^\/api\/auth\/logout$/],
  ['GET', /^\/api\/auth\/historico$/],
  ['POST', /^\/api\/auth\/historico$/],
  ['GET', /^\/api\/eventos$/],
  ['GET', new RegExp(`^/api/eventos/${ID}$`)],
  ['GET', new RegExp(`^/api/eventos/${ID}/(equipos|clasificacion)$`)],
  ['PATCH', new RegExp(`^/api/pruebas/${ID}$`)], // solo orden de salida y estado (se limita en la ruta)
  ['PUT', new RegExp(`^/api/pruebas/${ID}/resultados$`)],
  ['PUT', new RegExp(`^/api/pruebas/${ID}/reservas$`)], // equipos cargados en las pistas de cada dispositivo
  ['POST', new RegExp(`^/api/pruebas/${ID}/resultados/intercambiar$`)],
  ['DELETE', new RegExp(`^/api/resultados/${ID}$`)],
];

export function permitidoCrono(metodo: string, ruta: string, query: URLSearchParams, historicoAutorizado = false): boolean {
  if (ruta.startsWith('/api/')) {
    const m = metodo === 'HEAD' ? 'GET' : metodo;
    if (/^\/api\/eventos\/[^/]+\/exportar$/.test(ruta)) {
      return m === 'GET' && historicoAutorizado && query.get('tipo') !== 'participantes';
    }
    return API_CRONO.some(([mm, re]) => mm === m && re.test(ruta));
  }
  return PAGINAS_CRONO.some((re) => re.test(ruta));
}
