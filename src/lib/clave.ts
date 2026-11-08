// Cifrado de contraseñas (scrypt). Lo usan la app y el comando `npm run claves`.
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (pass: string, salt: Buffer, len: number) => Promise<Buffer>;

/** "scrypt$<sal>$<hash>" (base64). Nunca se guarda la contraseña en claro. */
export async function hashClave(clave: string) {
  const sal = randomBytes(16);
  const h = await scrypt(clave, sal, 32);
  return `scrypt$${sal.toString('base64')}$${h.toString('base64')}`;
}

export async function claveCorrecta(clave: string, guardado: string) {
  const [alg, sal, h] = guardado.split('$');
  if (alg !== 'scrypt' || !sal || !h) return false;
  const esperado = Buffer.from(h, 'base64');
  const calculado = await scrypt(clave, Buffer.from(sal, 'base64'), esperado.length);
  return timingSafeEqual(calculado, esperado);
}

/** Comparación de textos en tiempo constante. */
export function textosIguales(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
