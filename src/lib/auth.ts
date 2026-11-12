import 'server-only';
import { NextResponse } from 'next/server';
import { HttpError } from './api';
import { claveCorrecta, hashClave, textosIguales } from './clave';
import { prisma } from './prisma';
import { crearLimite, ipDe } from './limiteIntentos';
import {
  COOKIE_HISTORICO, COOKIE_SESION, DURACION_HISTORICO_S, DURACION_SESION_S, HEADER_ROL,
  crearToken, crearTokenHistorico, leerTokenHistorico, type Rol,
} from './sesion';

/** Contraseña inicial opcional desde el .env (ADMIN_PASSWORD / CRONO_PASSWORD). */
function claveEnv(rol: Rol) {
  return (rol === 'ADMIN' ? process.env.ADMIN_PASSWORD : process.env.CRONO_PASSWORD)?.trim() || null;
}

/** ¿Hay contraseña para cada rol (en la base o en el .env)? */
export async function estadoClavesAcceso() {
  const filas = await prisma.credencial.findMany({ select: { rol: true } });
  const tiene = (rol: Rol) => filas.some((f) => f.rol === rol) || !!claveEnv(rol);
  return { ADMIN: tiene('ADMIN'), CRONO: tiene('CRONO') };
}

export async function estadoClaves() {
  const [acceso, historico] = await Promise.all([
    estadoClavesAcceso(),
    prisma.claveHistorico.findUnique({ where: { id: 'historico' }, select: { id: true } }),
  ]);
  return { ...acceso, HISTORICO: !!historico };
}

export async function verificarClave(rol: Rol, clave: string) {
  const fila = await prisma.credencial.findUnique({ where: { rol } });
  if (fila) return claveCorrecta(clave, fila.hash);
  // Sin contraseña guardada: se acepta la del .env y, si coincide, se guarda cifrada en la base
  const env = claveEnv(rol);
  if (!env || !textosIguales(clave, env)) return false;
  await guardarClave(rol, clave);
  return true;
}

/** Guarda (o reemplaza) la contraseña de un rol. La longitud mínima la valida `cambioClave`. */
export async function guardarClave(rol: Rol, clave: string) {
  const hash = await hashClave(clave);
  await prisma.credencial.upsert({ where: { rol }, create: { rol, hash }, update: { hash } });
}

export async function guardarClaveHistorico(clave: string) {
  const hash = await hashClave(clave);
  return prisma.claveHistorico.upsert({
    where: { id: 'historico' },
    create: { id: 'historico', hash },
    update: { hash },
  });
}

export async function verificarClaveHistorico(clave: string) {
  const credencial = await prisma.claveHistorico.findUnique({ where: { id: 'historico' } });
  return credencial ? claveCorrecta(clave, credencial.hash) : false;
}

export async function tieneClaveHistorico() {
  return Boolean(await prisma.claveHistorico.findUnique({ where: { id: 'historico' }, select: { id: true } }));
}

function cookie(req: Request, nombre: string) {
  const valor = req.headers.get('cookie')?.split(';').map((parte) => parte.trim())
    .find((parte) => parte.startsWith(`${nombre}=`));
  return valor?.slice(nombre.length + 1);
}

export async function puedeVerHistorico(req: Request) {
  if (rolDe(req) === 'ADMIN') return true;
  return leerTokenHistorico(cookie(req, COOKIE_HISTORICO));
}

/** Rol de la petición, puesto por el middleware tras verificar la cookie firmada. */
export function rolDe(req: Request): Rol | null {
  const r = req.headers.get(HEADER_ROL);
  return r === 'ADMIN' || r === 'CRONO' ? r : null;
}

export function exigirAdmin(req: Request) {
  if (rolDe(req) !== 'ADMIN') throw new HttpError(403, 'Solo el administrador puede hacer esto');
}

/** El cronometrador solo puede trabajar en pruebas habilitadas por el administrador. */
export async function exigirPruebaHabilitada(req: Request, pruebaId: string) {
  if (rolDe(req) !== 'CRONO') return;
  const p = await prisma.prueba.findUnique({ where: { id: pruebaId }, select: { habilitadaDesde: true } });
  if (!p) throw new HttpError(404, 'Prueba no encontrada');
  if (!p.habilitadaDesde || p.habilitadaDesde > new Date())
    throw new HttpError(403, 'Esta prueba no está habilitada para el cronometrador');
}

/** Filtro de Prisma: pruebas que el cronometrador puede ver ahora. */
export const pruebasHabilitadas = () => ({ habilitadaDesde: { lte: new Date() } });

/** Respuesta que deja la sesión iniciada (cookie httpOnly: el JavaScript de la página no puede leerla). */
export async function respuestaConSesion(req: Request, rol: Rol) {
  const res = NextResponse.json({ rol });
  res.cookies.set(COOKIE_HISTORICO, '', { path: '/', maxAge: 0 });
  res.cookies.set(COOKIE_SESION, await crearToken(rol), {
    httpOnly: true,
    sameSite: 'lax',
    secure: new URL(req.url).protocol === 'https:',
    path: '/',
    maxAge: DURACION_SESION_S,
  });
  return res;
}

export async function respuestaConAccesoHistorico(req: Request) {
  const res = NextResponse.json({ autorizado: true });
  res.cookies.set(COOKIE_HISTORICO, await crearTokenHistorico(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: new URL(req.url).protocol === 'https:',
    path: '/',
    maxAge: DURACION_HISTORICO_S,
  });
  return res;
}

export function respuestaSinSesion() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESION, '', { path: '/', maxAge: 0 });
  res.cookies.set(COOKIE_HISTORICO, '', { path: '/', maxAge: 0 });
  return res;
}

// Intentos de contraseña (inicio de sesión e histórico): tras 5 fallos seguidos el dispositivo espera 5 minutos
const globalLimite = globalThis as unknown as { limiteClaves?: ReturnType<typeof crearLimite> };
const limite = (globalLimite.limiteClaves ??= crearLimite());

/** Rechaza el intento si este dispositivo está bloqueado por muchos fallos. */
export function exigirIntentosDisponibles(req: Request) {
  const ms = limite.espera(ipDe(req));
  if (ms) throw new HttpError(429, `Demasiados intentos fallidos. Espera ${Math.ceil(ms / 60000)} min e inténtalo de nuevo.`);
}

/** Anota el resultado de un intento de contraseña. */
export function anotarIntento(req: Request, correcto: boolean) {
  if (correcto) limite.acierto(ipDe(req));
  else limite.fallo(ipDe(req));
}
