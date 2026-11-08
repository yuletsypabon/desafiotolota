import 'server-only';
import { NextResponse } from 'next/server';
import { HttpError } from './api';
import { claveCorrecta, hashClave, textosIguales } from './clave';
import { prisma } from './prisma';
import { COOKIE_SESION, DURACION_SESION_S, HEADER_ROL, crearToken, type Rol } from './sesion';

/** Contraseña inicial opcional desde el .env (ADMIN_PASSWORD / CRONO_PASSWORD). */
function claveEnv(rol: Rol) {
  return (rol === 'ADMIN' ? process.env.ADMIN_PASSWORD : process.env.CRONO_PASSWORD)?.trim() || null;
}

/** ¿Hay contraseña para cada rol (en la base o en el .env)? */
export async function estadoClaves() {
  const filas = await prisma.credencial.findMany({ select: { rol: true } });
  const tiene = (rol: Rol) => filas.some((f) => f.rol === rol) || !!claveEnv(rol);
  return { ADMIN: tiene('ADMIN'), CRONO: tiene('CRONO') };
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
  res.cookies.set(COOKIE_SESION, await crearToken(rol), {
    httpOnly: true,
    sameSite: 'lax',
    secure: new URL(req.url).protocol === 'https:',
    path: '/',
    maxAge: DURACION_SESION_S,
  });
  return res;
}

export function respuestaSinSesion() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_SESION, '', { path: '/', maxAge: 0 });
  return res;
}
