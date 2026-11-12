// Cifrado de contraseñas (scrypt). Lo usan la app y el comando `npm run claves`.
import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto';

const scrypt = (clave: string, sal: Buffer, largo: number, opciones: ScryptOptions) =>
  new Promise<Buffer>((ok, mal) => scryptCb(clave, sal, largo, opciones, (e, h) => (e ? mal(e) : ok(h))));

/**
 * Costo actual (recomendación OWASP para scrypt: N = 2^17, r = 8, p = 1). Cada contraseña tarda ~0,1–0,3 s en
 * comprobarse, lo que hace inviable probar millones de claves si alguien llegara a copiar la base de datos.
 */
const COSTO = { N: 2 ** 17, r: 8, p: 1 };
const memoria = (N: number, r: number) => 256 * N * r; // scrypt necesita 128·N·r bytes; se deja holgura

/** "scrypt2$N$r$p$<sal>$<hash>" (base64). Nunca se guarda la contraseña en claro. */
export async function hashClave(clave: string) {
  const sal = randomBytes(16);
  const h = await scrypt(clave, sal, 32, { ...COSTO, maxmem: memoria(COSTO.N, COSTO.r) });
  return `scrypt2$${COSTO.N}$${COSTO.r}$${COSTO.p}$${sal.toString('base64')}$${h.toString('base64')}`;
}

/** Compara en tiempo constante. Acepta el formato actual y el anterior ("scrypt$<sal>$<hash>", costo 2^14). */
export async function claveCorrecta(clave: string, guardado: string) {
  const partes = guardado.split('$');
  let N = 2 ** 14, r = 8, p = 1, sal: string | undefined, h: string | undefined;
  if (partes[0] === 'scrypt2' && partes.length === 6) {
    [N, r, p] = partes.slice(1, 4).map(Number);
    [sal, h] = partes.slice(4);
  } else if (partes[0] === 'scrypt' && partes.length === 3) {
    [sal, h] = partes.slice(1);
  }
  if (!sal || !h || !Number.isInteger(N) || N < 2 ** 14 || N > 2 ** 20 || r < 1 || r > 32 || p < 1 || p > 4) return false;
  const esperado = Buffer.from(h, 'base64');
  const calculado = await scrypt(clave, Buffer.from(sal, 'base64'), esperado.length, { N, r, p, maxmem: memoria(N, r) });
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

/** ¿El hash usa un costo menor al actual? (se vuelve a cifrar al iniciar sesión con la contraseña correcta) */
export function hashAnticuado(guardado: string) {
  return !guardado.startsWith(`scrypt2$${COSTO.N}$${COSTO.r}$${COSTO.p}$`);
}

/** Comparación de textos en tiempo constante. */
export function textosIguales(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
